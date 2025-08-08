# backend/main.py

# Importa bibliotecas padrão
import os
import logging
from pathlib import Path
import requests

# Importa FastAPI e componentes
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse

# Importa utilitário para leitura do .env
from dotenv import load_dotenv

# Ativa logging global
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Força carregamento do .env na pasta backend
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# Instancia a aplicação FastAPI
app = FastAPI()

# Exibe os valores lidos do .env para depuração
logger.info(f"🔎 GOOGLE_CLIENT_ID: {os.getenv('GOOGLE_CLIENT_ID')}")
logger.info(f"🔎 GOOGLE_REDIRECT_URI: {os.getenv('GOOGLE_REDIRECT_URI')}")

# Evento de inicialização que imprime as rotas registradas
@app.on_event("startup")
async def startup_event():
    logger.info("✅ Backend iniciado com sucesso")
    logger.info("✅ Rotas registradas:")
    for route in app.routes:
        logger.info(f"➡️ {route.path}")

# Rota para redirecionamento ao login com Google
@app.get("/google-login")
def google_login():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    scope = "openid%20email%20profile"

    # Monta a URL de redirecionamento
    google_oauth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={client_id}"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scope}"
        f"&access_type=offline"
        f"&prompt=consent"
    )

    # Redireciona o usuário
    return RedirectResponse(google_oauth_url)

# Rota de callback do Google
@app.get("/google-callback")
def google_callback(request: Request):
    try:
        # Extrai o code da URL
        code = request.query_params.get("code")

        # Se não houver code, retorna erro
        if not code:
            raise HTTPException(status_code=400, detail="Código de autorização ausente")

        # Lê variáveis do .env
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

        # Monta a requisição para troca de code por token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }

        # Executa a requisição
        token_response = requests.post(token_url, data=token_data)

        # Loga o erro se falhar
        if token_response.status_code != 200:
            logger.error(f"❌ Erro ao obter token: {token_response.text}")
            raise HTTPException(status_code=400, detail="Falha ao obter token de acesso")

        # Extrai o token da resposta
        access_token = token_response.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Token de acesso ausente")

        # Consulta os dados do usuário
        user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        user_info_response = requests.get(user_info_url, headers=headers)

        # Loga erro se falhar
        if user_info_response.status_code != 200:
            logger.error(f"❌ Erro ao obter dados do usuário: {user_info_response.text}")
            raise HTTPException(status_code=400, detail="Erro ao obter dados do usuário")

        # Retorna os dados do usuário
        return user_info_response.json()

    except Exception as e:
        logger.exception("❌ Erro inesperado na callback do Google")
        raise HTTPException(status_code=500, detail="Erro interno no servidor")
