# backend/routes/usuarios.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
import os, bcrypt

from backend.database import get_db
from backend.models.usuarios import Usuarios as UsuariosModel

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")
ALGORITHM  = "HS256"

router = APIRouter(prefix="", tags=["Usuarios"])

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

@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(UsuariosModel).all()

@router.post("/usuarios", status_code=status.HTTP_201_CREATED, response_model=UsuarioOut)
def criar_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(UsuariosModel).filter(UsuariosModel.email == payload.email).first():
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")

    salt = bcrypt.gensalt(rounds=12)
    senha_hash = bcrypt.hashpw(os.urandom(16).hex().encode("utf-8"), salt).decode("utf-8")

    novo = UsuariosModel(
        nome=payload.nome,
        email=payload.email,
        senha_hash=senha_hash,
        tipo_perfil=payload.tipo_perfil,
        ddi=payload.ddi,
        ddd=payload.ddd,
        numero_celular=payload.numero_celular,
        google_id=None,
        is_master=False,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@router.put("/usuarios/{id_usuario}", response_model=UsuarioOut)
def atualizar_usuario(id_usuario: int, payload: UsuarioUpdate, db: Session = Depends(get_db)):
    user = db.query(UsuariosModel).filter(UsuariosModel.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if payload.nome is not None:            user.nome = payload.nome
    if payload.tipo_perfil is not None:     user.tipo_perfil = payload.tipo_perfil
    if payload.ddi is not None:             user.ddi = payload.ddi
    if payload.ddd is not None:             user.ddd = payload.ddd
    if payload.numero_celular is not None:  user.numero_celular = payload.numero_celular
    db.commit()
    db.refresh(user)
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
def obter_usuario(id_usuario: int, db: Session = Depends(get_db)):
    user = db.query(UsuariosModel).filter(UsuariosModel.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user
