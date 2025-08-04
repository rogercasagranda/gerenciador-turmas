# backend/routes/auth_routes.py

from fastapi import APIRouter, HTTPException
from ..models.user import UserLogin
from ..auth.auth_handler import verify_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(user: UserLogin):
    if verify_user(user.username, user.password):
        return {"message": "Login efetuado com sucesso"}
    else:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
