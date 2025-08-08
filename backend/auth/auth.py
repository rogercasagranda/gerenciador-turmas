from passlib.context import CryptContext
from google.oauth2 import id_token
from google.auth.transport import requests

# Cria contexto de hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Simula um usuário master para testes
USUARIO_MASTER = {
    "email": "roger.rodriguez05@gmail.com",
    "senha_hash": pwd_context.hash("Getulio#3011"),
    "nome": "Roger Casagranda",
    "tipo_perfil": "master"
}

async def verify_user_credentials(usuario: str, senha: str):
    if usuario == USUARIO_MASTER["email"] and pwd_context.verify(senha, USUARIO_MASTER["senha_hash"]):
        return {
            "nome": USUARIO_MASTER["nome"],
            "email": USUARIO_MASTER["email"],
            "tipo_perfil": USUARIO_MASTER["tipo_perfil"]
        }
    return None

async def verify_google_token(token: str):
    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request())
        email = idinfo.get("email")
        if email == USUARIO_MASTER["email"]:
            return {
                "nome": USUARIO_MASTER["nome"],
                "email": email,
                "tipo_perfil": USUARIO_MASTER["tipo_perfil"]
            }
    except Exception:
        return None
    return None
