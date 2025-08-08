# Importa o roteador do FastAPI
from fastapi import APIRouter

# Importa o modelo de dados do Pydantic
from pydantic import BaseModel


# Cria o roteador da aplicação
router = APIRouter()

# Define o modelo esperado no corpo da requisição
class GoogleToken(BaseModel):
    token: str  # Token JWT fornecido pelo login com o Google

# Rota POST que trata login via Google OAuth
@router.post("/login/google")
async def login_google(data: GoogleToken):
    # Aqui você poderia validar o token com a API do Google
    # Neste exemplo, retornamos dados fixos de um "usuário autenticado"

    return {
        "email": "roger.rodriguez05@gmail.com",
        "nome": "Roger Casagranda",
        "tipo_perfil": "master"
    }

