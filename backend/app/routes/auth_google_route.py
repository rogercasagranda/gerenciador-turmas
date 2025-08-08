# Importa o roteador do FastAPI
from fastapi import APIRouter

# Importa o tipo de resposta para redirecionamento
from fastapi.responses import RedirectResponse

# Importa o módulo os para acessar variáveis de ambiente
import os

# Importa função para carregar variáveis do .env
from dotenv import load_dotenv

# Carrega variáveis do arquivo .env
load_dotenv()

# Cria o roteador específico para autenticação via Google
router = APIRouter()

# Lê o CLIENT_ID da conta Google salvo no .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Define a URL de redirecionamento de callback (deve bater com o console do Google)
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# Define os escopos desejados do OAuth
GOOGLE_SCOPE = "openid email profile"

# Define o endpoint GET /google-login
@router.get("/google-login")
def login_google():
    """
    Redireciona o usuário para o fluxo de login com o Google
    """

    # Monta a URL completa para iniciar o fluxo OAuth com a Google
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope={GOOGLE_SCOPE}"
        f"&access_type=offline"
        f"&prompt=consent"
    )

    # Retorna uma resposta de redirecionamento para a URL do Google
    return RedirectResponse(url=google_auth_url)
