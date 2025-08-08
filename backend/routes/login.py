# Importa os módulos necessários para autenticação
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
import os

# Cria o roteador de login
router = APIRouter()

# Define a rota /google-login
@router.get("/google-login")
async def google_login():
    # Obtém variáveis de ambiente
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

    # Monta a URL de autenticação do Google com os parâmetros necessários
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        "?response_type=code"
        f"&client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
        "&prompt=consent"
    )

    # Retorna redirecionamento para o Google Auth
    return RedirectResponse(url=auth_url)
