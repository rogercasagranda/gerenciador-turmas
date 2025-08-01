# Importa dependências necessárias
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from backend.db.session import get_db
from backend.db.models.user import User
from backend.schemas.login_schema import LoginRequest
from backend.utils.token import create_access_token

# Instancia o roteador da API
router = APIRouter()

# Define o contexto de criptografia para senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Cria a rota POST para login
@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Busca usuário no banco pelo nome de usuário
    user = db.query(User).filter(User.username == request.username).first()

    # Verifica se o usuário existe e se a senha está correta
    if not user or not pwd_context.verify(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuário e/ou senha inválidos")

    # Gera o token JWT de acesso
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}
