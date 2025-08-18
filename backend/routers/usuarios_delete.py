# backend/routers/usuarios_delete.py
# v7 — inclui logs do perfil em acesso e rota utilitária /usuarios/log-perfil

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.usuarios import Usuarios
from backend.utils.audit import registrar_log
import os
import logging
from jose import jwt, JWTError

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

logger = logging.getLogger("portal.professor")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

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
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.get("/log-perfil")
def log_perfil(request: Request):
    "Apenas decodifica o token, LOGA o perfil/ID e devolve."
    claims = _claims(request)
    perfil = _canon(claims.get("role") or claims.get("perfil") or claims.get("tipo_perfil"))
    uid = claims.get("sub")
    logger.info("Acesso de usuário id=%s perfil=%s", uid, perfil)
    return {"id": uid, "perfil": perfil}

@router.delete("/{id_usuario}")
def excluir_usuario(id_usuario: int, request: Request, db: Session = Depends(get_db)):
    claims = _claims(request)
    # O token contém o e-mail em "sub" e o identificador numérico em "id_usuario".
    # Converte o ID para inteiro e falha com 401 caso o valor seja ausente ou não numérico.
    try:
        me_id = int(claims.get("id_usuario"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="ID do usuário inválido no token")

    my_role = _canon(claims.get("role") or claims.get("perfil") or claims.get("tipo_perfil"))
    if not my_role:
        raise HTTPException(status_code=403, detail="Perfil não encontrado no token")

    alvo = db.query(Usuarios).filter(Usuarios.id_usuario == id_usuario).first()
    if not alvo:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    alvo_role = _canon(alvo.tipo_perfil)

    # LOG detalhado da tentativa
    logger.info("Tentativa de exclusão: executor id=%s perfil=%s -> alvo id=%s perfil=%s", me_id, my_role, alvo.id_usuario, alvo_role)

    if my_role not in {"MASTER", "DIRETOR"}:
        raise HTTPException(status_code=403, detail="Sem permissão para excluir usuários")
    if alvo_role == "MASTER" and my_role != "MASTER":
        raise HTTPException(status_code=403, detail="Apenas MASTER pode excluir outro MASTER")
    if me_id == alvo.id_usuario:
        raise HTTPException(status_code=409, detail="Não é permitido excluir o próprio usuário")

    db.delete(alvo)
    db.commit()
    logger.info("Usuário id=%s excluído por id=%s", id_usuario, me_id)
    registrar_log(db, me_id, "DELETE", "usuarios", id_usuario, f"Excluiu usuário {id_usuario}")
    return JSONResponse({"message": "Usuário excluído com sucesso", "id_excluido": id_usuario})
