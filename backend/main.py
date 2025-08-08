# backend/main.py

import os
import logging
from pathlib import Path
import requests
import psycopg2  # Merge para validar usuário no banco

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv

# Ativa logging global
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Carrega .env
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI()

logger.info(f"🔎 GOOGLE_CLIENT_ID: {os.getenv('GOOGLE_CLIENT_ID')}")
logger.info(f"🔎 GOOGLE_REDIRECT_URI: {os.getenv('GOOGLE_REDIRECT_URI')}")

@app.on_event("startup")
async def startup_event():
    logger.info("✅ Backend iniciado com sucesso")
    logger.info("✅ Rotas registradas:")
    for route in app.routes:
        logger.info(f"➡️ {route.path}")

@app.get("/google-login")
def google_login():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    scope = "openid%20email%20profile"

    google_oauth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={client_id}"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scope}"
        f"&access_type=offline"
        f"&prompt=consent"
    )

    return RedirectResponse(google_oauth_url)

@app.get("/google-callback")
def google_callback(request: Request):
    try:
        code = request.query_params.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="Código de autorização ausente")

        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }

        token_response = requests.post(token_url, data=token_data)

        if token_response.status_code != 200:
            logger.error(f"❌ Erro ao obter token: {token_response.text}")
            raise HTTPException(status_code=400, detail="Falha ao obter token de acesso")

        access_token = token_response.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Token de acesso ausente")

        user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        user_info_response = requests.get(user_info_url, headers=headers)

        if user_info_response.status_code != 200:
            logger.error(f"❌ Erro ao obter dados do usuário: {user_info_response.text}")
            raise HTTPException(status_code=400, detail="Erro ao obter dados do usuário")

        user_data = user_info_response.json()
        user_email = user_data.get("email")
        if not user_email:
            raise HTTPException(status_code=400, detail="Email não encontrado na resposta do Google")

        # 🔒 VALIDAÇÃO DO PRÉ-CADASTRO (merge)
        try:
            database_url = os.getenv("DATABASE_URL")
            conn = psycopg2.connect(dsn=database_url)
            cur = conn.cursor()
            cur.execute("SELECT id_usuario FROM usuarios WHERE email = %s", (user_email,))
            result = cur.fetchone()
            cur.close()
            conn.close()

            if not result:
                logger.warning(f"⛔ Usuário não pré-cadastrado: {user_email}")
                raise HTTPException(status_code=401, detail="Usuário não autorizado")

            logger.info(f"✅ Usuário autorizado: {user_email}")
            return {
                "status": "autorizado",
                "email": user_email,
                "dados": user_data
            }

        except Exception as db_error:
            logger.exception("❌ Erro ao consultar banco de dados")
            raise HTTPException(status_code=500, detail="Erro ao acessar banco de dados")

    except Exception as e:
        logger.exception("❌ Erro inesperado na callback do Google")
        raise HTTPException(status_code=500, detail="Erro interno no servidor")
