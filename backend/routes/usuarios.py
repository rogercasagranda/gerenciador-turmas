# backend/routes/usuarios.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import Response
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
import os, bcrypt, logging, hashlib

from backend.database import get_db
from backend.models.usuarios import Usuarios as UsuariosModel
from backend.utils.audit import registrar_log, log_403
from backend.utils.pdf import generate_pdf

# Lê a chave do JWT priorizando SECRET_KEY para compatibilidade
SECRET_KEY = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET_KEY", "change-me-in-prod")
ALGORITHM  = "HS256"
ALLOWED_PERFIS = {"master", "diretor", "secretaria"}
MAX_JWT_BYTES = 256 * 1024


def to_canonical(perfil: str | None) -> str:
    p = (perfil or "").strip().lower()
    if p.startswith("diretor"):
        return "diretor"
    if p.startswith("coordenador"):
        return "coordenador"
    if p.startswith("professor"):
        return "professor"
    if p in {"aluno", "aluna"}:
        return "aluno"
    return p

router = APIRouter(prefix="", tags=["Usuarios"])

logger = logging.getLogger(__name__)

class UsuarioOut(BaseModel):
    id_usuario: int
    nome: str
    email: EmailStr
    tipo_perfil: str | None = None
    ddi: str | None = None
    ddd: str | None = None
    numero_celular: str | None = None
    is_master: bool | None = None
    class Config:
        from_attributes = True

class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str | None = None
    tipo_perfil: str | None = None
    ddi: str | None = None
    ddd: str | None = None
    numero_celular: str

class UsuarioUpdate(BaseModel):
    nome: str | None = None
    tipo_perfil: str | None = None
    ddi: str | None = None
    ddd: str | None = None
    numero_celular: str | None = None


class TokenData(BaseModel):
    id_usuario: int
    email: EmailStr
    tipo_perfil: str | None = None
    is_master: bool = False


def token_data_from_request(request: Request) -> TokenData:
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid/expired")
    token = auth.split(" ", 1)[1]
    if len(token) > MAX_JWT_BYTES:
        raise HTTPException(status_code=413, detail="Token muito grande")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role")
        is_master = bool(payload.get("is_master"))
        if sub is None or email is None:
            raise HTTPException(status_code=401, detail="invalid/expired")
        return TokenData(id_usuario=int(sub), email=str(email), tipo_perfil=role, is_master=is_master)
    except JWTError:
        raise HTTPException(status_code=401, detail="invalid/expired")


def require_perfil(request: Request, db: Session) -> TokenData:
    token_data = token_data_from_request(request)
    perfil = to_canonical(token_data.tipo_perfil)
    if perfil not in ALLOWED_PERFIS:
        log_403(db, token_data.id_usuario, perfil, request.url.path, "perfil sem acesso")
        logger.warning(
            "403 denied: user_id=%s perfil=%s path=%s", token_data.id_usuario, perfil, request.url.path
        )
        raise HTTPException(status_code=403, detail="Sem permissão para acessar usuários.")
    token_data.tipo_perfil = perfil
    return token_data

@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(request: Request, db: Session = Depends(get_db)):
    token_data = require_perfil(request, db)
    logs = db.query(UsuariosModel).all()
    registrar_log(db, token_data.id_usuario, "READ", "usuarios", descricao="Listou usuários")
    return logs

@router.post("/usuarios", status_code=status.HTTP_201_CREATED, response_model=UsuarioOut)
def criar_usuario(payload: UsuarioCreate, request: Request, db: Session = Depends(get_db)):
    token_data = require_perfil(request, db)
    if db.query(UsuariosModel).filter(UsuariosModel.email == payload.email).first():
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")

    salt = bcrypt.gensalt(rounds=12)
    if payload.senha:
        senha_hash = bcrypt.hashpw(payload.senha.encode("utf-8"), salt).decode("utf-8")
    else:
        senha_hash = bcrypt.hashpw(os.urandom(16).hex().encode("utf-8"), salt).decode("utf-8")

    novo = UsuariosModel(
        nome=payload.nome,
        email=payload.email,
        senha_hash=senha_hash,
        tipo_perfil=to_canonical(payload.tipo_perfil),
        ddi=payload.ddi,
        ddd=payload.ddd,
        numero_celular=payload.numero_celular,
        google_id=None,
        is_master=False,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    registrar_log(db, token_data.id_usuario, "CREATE", "usuarios", novo.id_usuario, f"Criou usuário {novo.email}")
    return novo

@router.put("/usuarios/{id_usuario}", response_model=UsuarioOut)
def atualizar_usuario(id_usuario: int, payload: UsuarioUpdate, request: Request, db: Session = Depends(get_db)):
    token_data = require_perfil(request, db)
    user = db.query(UsuariosModel).filter(UsuariosModel.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if payload.nome is not None:            user.nome = payload.nome
    if payload.tipo_perfil is not None:     user.tipo_perfil = to_canonical(payload.tipo_perfil)
    if payload.ddi is not None:             user.ddi = payload.ddi
    if payload.ddd is not None:             user.ddd = payload.ddd
    if payload.numero_celular is not None:  user.numero_celular = payload.numero_celular
    db.commit()
    db.refresh(user)
    registrar_log(db, token_data.id_usuario, "UPDATE", "usuarios", user.id_usuario, f"Atualizou usuário {user.email}")
    return user

@router.get("/usuarios/me", response_model=UsuarioOut)
def meu_perfil(request: Request, db: Session = Depends(get_db)):
    token_data = token_data_from_request(request)  # 401 se Ausente/Inválido
    user = (
        db.query(UsuariosModel)
        .filter(UsuariosModel.id_usuario == token_data.id_usuario)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user

@router.get("/usuarios/{id_usuario}", response_model=UsuarioOut)
def obter_usuario(id_usuario: int, request: Request, db: Session = Depends(get_db)):
    token_data = require_perfil(request, db)
    user = db.query(UsuariosModel).filter(UsuariosModel.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    registrar_log(db, token_data.id_usuario, "READ", "usuarios", id_usuario, f"Consultou usuário {id_usuario}")
    return user


@router.get("/usuarios/export")
def exportar_usuarios(
    request: Request,
    q: str | None = None,
    format: str = "pdf",
    db: Session = Depends(get_db),
):
    """Exporta usuários em PDF aplicando o mesmo filtro de consulta."""
    token_data = require_perfil(request, db)
    query = db.query(UsuariosModel)
    if q:
        termo = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(UsuariosModel.nome).like(termo),
                func.lower(UsuariosModel.email).like(termo),
                func.lower(UsuariosModel.tipo_perfil).like(termo),
            )
        )
    usuarios = query.all()

    if format != "pdf":
        raise HTTPException(status_code=400, detail="Formato não suportado")

    rows = []
    for u in usuarios:
        telefone = " ".join(filter(None, [u.ddi, u.ddd, u.numero_celular]))
        rows.append([u.nome, u.email, (u.tipo_perfil or "").upper(), telefone])

    columns = ["Nome", "E-mail", "Perfil", "Celular"]
    orientation = "landscape" if len(columns) > 6 else "portrait"
    pdf_bytes = generate_pdf(
        title="Relatório de Usuários",
        user=token_data.email,
        columns=columns,
        rows=rows,
        orientation=orientation,
        logo_path=os.getenv("SYSTEM_LOGO_PATH"),
    )
    sha = hashlib.sha256(pdf_bytes).hexdigest()
    registrar_log(
        db,
        token_data.id_usuario,
        "export",
        request.url.path,
        descricao=f"tipo={format} filtro={q} hash={sha}",
    )

    return Response(
        pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=usuarios.pdf"},
    )
