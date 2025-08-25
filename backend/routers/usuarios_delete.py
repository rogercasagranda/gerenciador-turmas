# backend/routers/usuarios_delete.py
# v7 — inclui logs do perfil em acesso e rota utilitária /usuarios/log-perfil

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.usuarios import Usuarios
from backend.utils.audit import registrar_log, log_403
import logging
from jose import jwt, JWTError
from backend.security import SECRET_KEY, ALGORITHM
MAX_JWT_BYTES = 256 * 1024

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

def _norm(x: str) -> str:
    return (x or "").strip().upper()

def _canon(x: str | None) -> str:
    p = _norm(x)
    if p.startswith("DIRETOR"):
        return "DIRETOR"
    if p.startswith("COORDENADOR"):
        return "COORDENADOR"
    if p.startswith("PROFESSOR"):
        return "PROFESSOR"
    if p in {"ALUNO", "ALUNA"}:
        return "ALUNO"
    return p

def _claims(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente ou inválido")
    token = auth.split(" ", 1)[1].strip()
    if len(token) > MAX_JWT_BYTES:
        raise HTTPException(status_code=413, detail="Token muito grande")
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.delete("/{id_usuario}")
def excluir_usuario(id_usuario: int, request: Request, db: Session = Depends(get_db)):
    claims = _claims(request)
    # O token contém o identificador numérico no campo "sub".
    # Converte o ID para inteiro e falha com 401 caso o valor seja ausente ou inválido.
    try:
        me_id = int(claims.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="ID do usuário inválido no token")

    my_role = _canon(claims.get("role") or claims.get("perfil") or claims.get("tipo_perfil"))
    if not my_role:
        log_403(db, me_id, None, request.url.path, "perfil ausente no token")
        raise HTTPException(status_code=403, detail="Perfil não encontrado no token")

    alvo = db.query(Usuarios).filter(Usuarios.id_usuario == id_usuario).first()
    if not alvo:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    alvo_role = _canon(alvo.tipo_perfil)

    # LOG detalhado da tentativa
    logger.info(
        "Tentativa de exclusão: executor id=%s perfil=%s -> alvo id=%s perfil=%s",
        me_id,
        my_role,
        alvo.id_usuario,
        alvo_role,
    )

    if my_role not in {"MASTER", "DIRETOR"}:
        log_403(db, me_id, my_role, request.url.path, "perfil sem permissão")
        raise HTTPException(status_code=403, detail="Sem permissão para excluir usuários")
    if alvo_role == "MASTER" and my_role != "MASTER":
        log_403(db, me_id, my_role, request.url.path, "apenas MASTER pode excluir outro MASTER")
        raise HTTPException(status_code=403, detail="Apenas MASTER pode excluir outro MASTER")
    if me_id == alvo.id_usuario:
        raise HTTPException(status_code=409, detail="Não é permitido excluir o próprio usuário")

    db.delete(alvo)
    db.commit()
    logger.info("Usuário id=%s excluído por id=%s", id_usuario, me_id)
    registrar_log(db, me_id, "DELETE", "usuarios", id_usuario, f"excluiu usuário {alvo.email}")
    return JSONResponse({"message": "Usuário excluído com sucesso", "id_excluido": id_usuario})
