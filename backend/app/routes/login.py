# Importa o roteador do FastAPI
from fastapi import APIRouter, Request, HTTPException

# Importa o schema de entrada do login
from pydantic import BaseModel

# Importa a função de busca assíncrona no banco
from app.database.database import get_user_by_email_or_phone

# Importa função para verificação de hash
from passlib.context import CryptContext

# Cria o roteador da rota /login
router = APIRouter()

# Define o contexto de criptografia para comparar senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Define o schema esperado para o corpo da requisição de login
class LoginRequest(BaseModel):
    usuario: str
    senha: str

# Define o endpoint POST /login
@router.post("/login")
async def login(request: Request, body: LoginRequest):
    # Busca o usuário usando e-mail ou telefone
    user = await get_user_by_email_or_phone(body.usuario)

    # Se não encontrar o usuário, retorna erro 401
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")

    # Verifica se a senha informada bate com o hash salvo no banco
    senha_valida = pwd_context.verify(body.senha, user["senha_hash"])

    # Se a senha for inválida, retorna erro 401
    if not senha_valida:
        raise HTTPException(status_code=401, detail="Senha incorreta")

    # Retorna os dados básicos do usuário autenticado (sem a senha)
    return {
        "nome": user["nome"],
        "email": user["email"],
        "tipo_perfil": user["tipo_perfil"],
        "foi_pre_cadastrado": user["foi_pre_cadastrado"],
        "ativo": user["ativo"]
    }
