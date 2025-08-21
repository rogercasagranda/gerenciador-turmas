# backend/routes/usuarios.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
import os, bcrypt, logging

from backend.database import get_db
from backend.models.usuarios import Usuarios as UsuariosModel
from backend.utils.audit import registrar_log

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")
ALGORITHM  = "HS256"
ALLOWED_PERFIS = {"master", "diretor", "secretaria"}


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


def token_data_from_request(request: Request) -> TokenData:
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente.")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        id_usuario = payload.get("id_usuario")
        tipo_perfil = payload.get("tipo_perfil")
        if sub is None or id_usuario is None:
            raise HTTPException(status_code=401, detail="Token inválido.")
        return TokenData(id_usuario=int(id_usuario), email=str(sub), tipo_perfil=tipo_perfil)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido.")


def require_perfil(request: Request) -> TokenData:
    token_data = token_data_from_request(request)
    perfil = to_canonical(token_data.tipo_perfil)
    autorizado = perfil in ALLOWED_PERFIS
    logger.info(f"[AUTH] user={token_data.email} perfil={perfil} autorizado={autorizado}")
    if not autorizado:
        raise HTTPException(status_code=403, detail="Sem permissão para acessar usuários.")
    token_data.tipo_perfil = perfil
    return token_data

@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(request: Request, db: Session = Depends(get_db)):
    token_data = require_perfil(request)
    logs = db.query(UsuariosModel).all()
    registrar_log(db, token_data.id_usuario, "READ", "usuarios", descricao="Listou usuários")
    return logs

@router.post("/usuarios", status_code=status.HTTP_201_CREATED, response_model=UsuarioOut)
def criar_usuario(payload: UsuarioCreate, request: Request, db: Session = Depends(get_db)):
    token_data = require_perfil(request)
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
    token_data = require_perfil(request)
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
    token_data = require_perfil(request)
    user = db.query(UsuariosModel).filter(UsuariosModel.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    registrar_log(db, token_data.id_usuario, "READ", "usuarios", id_usuario, f"Consultou usuário {id_usuario}")
    return user
