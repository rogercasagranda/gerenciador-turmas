# backend/auth/auth_handler.py

from sqlalchemy.orm import Session

from ..app.core.database import SessionLocal
from ..app.core.security import verify_password
from ..app.models.user import User


def verify_user(username: str, password: str, db: Session | None = None) -> bool:
    """Valida usuário e senha consultando o banco de dados"""
    session = db or SessionLocal()
    try:
        user = session.query(User).filter(User.username == username).first()
        if not user:
            return False
        return verify_password(password, user.hashed_password)
    finally:
        if db is None:
            session.close()
