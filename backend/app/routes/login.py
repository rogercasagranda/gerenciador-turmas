# Importa bibliotecas necessárias para integração com OAuth do Google
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.config import Config
import os
from dotenv import load_dotenv

# Carrega variáveis do arquivo .env localizado na pasta backend/
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# Inicializa o roteador do FastAPI
router = APIRouter()

# Lê as variáveis de ambiente necessárias para o OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# Garante que as variáveis foram corretamente carregadas
if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not GOOGLE_REDIRECT_URI:
    raise RuntimeError("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REDIRECT_URI não configurados corretamente.")

# Instancia configuração do OAuth com as variáveis carregadas
config = Config(environ=os.environ)
oauth = OAuth(config)

# Registra o provedor Google OAuth
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    access_token_url='https://oauth2.googleapis.com/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid email profile'},
)

# Define rota de redirecionamento para o Google
@router.get("/google-login")
async def login_with_google(request: Request):
    # Redireciona para o consentimento do Google
    return await oauth.google.authorize_redirect(request, GOOGLE_REDIRECT_URI)

# Define rota de callback que o Google retorna após o login
@router.get("/auth/google/callback")
async def auth_callback(request: Request):
    try:
        # Recebe o token de acesso
        token = await oauth.google.authorize_access_token(request)
        # Extrai dados do usuário autenticado
        user_info = await oauth.google.parse_id_token(request, token)
        # Retorna resposta JSON com os dados do usuário
        return JSONResponse({"status": "sucesso", "dados": user_info})
    except OAuthError as e:
        # Em caso de erro, retorna erro 400 com descrição
        return JSONResponse({"erro": "Falha na autenticação", "detalhes": str(e)}, status_code=400)
