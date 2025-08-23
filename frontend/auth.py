# backend/auth.py

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .auth.auth_handler import verify_user
from .app.core.database import SessionLocal


def authenticate_user(username: str, password: str, db: Session | None = None):
    """Autentica usuário consultando o banco de dados"""
    session = db or SessionLocal()
    try:
        if not verify_user(username, password, session):
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        return {"message": "Login bem-sucedido"}
    finally:
        if db is None:
            session.close()
