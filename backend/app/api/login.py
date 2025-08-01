# Cria a rota de login protegida

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user_schema import UserLogin
from app.models.user import User
from app.core.security import verify_password
from app.core.database import get_db

router = APIRouter()

@router.post("/login")
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    # Busca o usuário no banco
    user = db.query(User).filter(User.username == user_credentials.username).first()

    # Retorna erro se não encontrar
    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    # Verifica a senha com hash
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    return {"message": "Login realizado com sucesso"}
