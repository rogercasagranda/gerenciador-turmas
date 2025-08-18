# ======================================================
# Importa módulos padrão e terceiros
# ======================================================
import os                                   # Importa os recursos do sistema operacional para obter variáveis de ambiente
import logging                               # Importa o logging para registrar eventos e erros
from pathlib import Path                     # Importa Path para manipular caminhos de arquivos
import requests                               # Importa requests para realizar chamadas HTTP ao Google OAuth
import psycopg2                               # Importa psycopg2 para conexão síncrona com PostgreSQL
from psycopg2 import Error as PsycopgError    # Importa a classe de erro específica do psycopg2

# ======================================================
# JWT: criação de token de acesso
# ======================================================
from datetime import datetime, timedelta     # Importa utilitários de data e tempo
from jose import jwt                         # Importa biblioteca JOSE para geração de JWT

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")  # Define chave secreta do JWT
ALGORITHM = "HS256"                                             # Define algoritmo de assinatura
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))  # Define expiração padrão

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    # Cria payload com expiração
    to_encode = data.copy()                                                     # Copia dados de entrada
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))  # Calcula expiração
    to_encode.update({"exp": expire})                                           # Insere expiração no payload
    # Gera o token JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)        # Codifica o token
    return encoded_jwt                                                          # Retorna o token

# ======================================================
# Importa FastAPI e utilidades
# ======================================================
from fastapi import FastAPI, Request, HTTPException, Depends   # Importa classes e funções da FastAPI
from fastapi.responses import RedirectResponse                  # Importa RedirectResponse para redirecionamentos
from fastapi.middleware.cors import CORSMiddleware              # Importa CORS middleware para liberar origens

# ======================================================
# Importa utilitários de configuração e modelos
# ======================================================
from dotenv import load_dotenv                 # Importa load_dotenv para carregar variáveis do arquivo .env
from pydantic import BaseModel, Field, ConfigDict  # Importa BaseModel, Field e ConfigDict para validação flexível

# ======================================================
# Importa camada de acesso a dados (AJUSTE DE IMPORTS PARA EXECUTAR PELA RAIZ)
# ======================================================
from backend.database import get_db                    # Importa função get_db via pacote absoluto
from backend.models.usuarios import Usuarios           # Importa o modelo Usuarios via pacote absoluto
import bcrypt                                          # Importa bcrypt para validação de senha

# ======================================================
# IMPORTA ROTAS (MERGE) — adiciona router de usuários
# ======================================================
from backend.routes.usuarios import router as usuarios_router   # Importa router de /usuarios

# ======================================================
# Configura logger da aplicação
# ======================================================
logging.basicConfig(level=logging.INFO)        # Define nível de log como INFO
logger = logging.getLogger(__name__)           # Cria instância de logger para este módulo

# ======================================================
# Carrega variáveis do arquivo .env localizado em backend/.env
# ======================================================
env_path = Path(__file__).resolve().parent / ".env"  # Define caminho absoluto do .env na pasta backend
load_dotenv(dotenv_path=env_path)                    # Carrega as variáveis do .env

# ======================================================
# Instancia aplicação FastAPI
# ======================================================
app = FastAPI()                                      # Cria instância principal do app FastAPI

# ======================================================
# Configura CORS de forma ampla (padrão já aprovado)
# ======================================================
app.add_middleware(                                  # Adiciona middleware de CORS
    CORSMiddleware,                                  # Define a classe do middleware
    allow_origins=["*"],                             # Libera origens
    allow_credentials=True,                          # Permite envio de cookies/credenciais
    allow_methods=["*"],                             # Libera todos os métodos HTTP
    allow_headers=["*"],                             # Libera todos os headers
)

# ======================================================
# Registra routers (MERGE) — mantém existentes e soma /usuarios
# ======================================================
app.include_router(usuarios_router)                  # Registra rotas de usuários (/usuarios GET/POST)

# ======================================================
# Loga variáveis públicas do OAuth (sem expor segredos)
# ======================================================
logger.info(f"🔎 GOOGLE_CLIENT_ID: {os.getenv('GOOGLE_CLIENT_ID')}")         # Registra o client_id para conferência
logger.info(f"🔎 GOOGLE_REDIRECT_URI: {os.getenv('GOOGLE_REDIRECT_URI')}")   # Registra a redirect_uri para conferência

# ======================================================
# Exibe rotas ao iniciar o servidor
# ======================================================
@app.on_event("startup")                     # Define tarefa a executar no start do app
async def startup_event():                   # Declara função assíncrona de inicialização
    logger.info("✅ Backend iniciado com sucesso")     # Registra mensagem de inicialização
    logger.info("✅ Rotas registradas:")               # Registra cabeçalho das rotas
    for route in app.routes:                           # Itera sobre rotas registradas
        logger.info(f"➡️ {route.path}")                # Registra caminho de cada rota

# ======================================================
# Modelo de payload com alias para compatibilizar o front
# ======================================================
class LoginPayload(BaseModel):                                       # Declara classe Pydantic para login
    email: str | None = Field(default=None, alias="usuario")         # Aceita 'usuario' como alias de 'email'
    senha: str | None = Field(default=None, alias="password")        # Aceita 'password' como alias de 'senha'
    model_config = ConfigDict(populate_by_name=True, extra="ignore") # Permite popular por nome e ignora extras

# ======================================================
# Rota de login: aceita JSON e form-data, mapeia aliases
# ======================================================
@app.post("/login")                                                  # Define endpoint POST /login
async def login(request: Request, db=Depends(get_db)):               # Declara função com injeção de sessão do DB
    content_type = request.headers.get("content-type", "")           # Obtém o Content-Type da requisição

    # --------------------------------------------------
    # Lê o corpo conforme o tipo enviado pelo front
    # --------------------------------------------------
    if "application/json" in content_type:                           # Verifica se é JSON
        raw = await request.json()                                   # Lê o JSON do corpo
    else:                                                            # Caso contrário, trata como form-data
        form = await request.form()                                  # Lê o formulário enviado
        raw = dict(form)                                             # Converte em dicionário simples

    # --------------------------------------------------
    # Normaliza chaves aceitando variações do front
    # --------------------------------------------------
    email = (raw.get("email") or raw.get("usuario") or raw.get("username") or "").strip()  # Normaliza e-mail
    senha = (raw.get("senha") or raw.get("password") or "").strip()                        # Normaliza senha

    # --------------------------------------------------
    # Validação mínima do payload
    # --------------------------------------------------
    if not email or not senha:                                       # Verifica se faltam campos
        logger.warning("⚠️ Payload inválido no /login (faltando email/senha)")             # Registra aviso
        raise HTTPException(status_code=422, detail="Payload inválido: envie 'email' e 'senha'.")  # Retorna 422

    logger.info(f"🔍 Tentativa de login com e-mail: {email}")         # Registra tentativa de login

    # --------------------------------------------------
    # Consulta usuário via ORM
    # --------------------------------------------------
    usuario = db.query(Usuarios).filter(Usuarios.email == email).first()  # Busca usuário por e-mail
    if not usuario:                                                       # Verifica inexistência
        logger.warning(f"⛔ Usuário não pré-cadastrado (LOCAL): {email}")  # Registra pré-cadastro ausente
        from fastapi.responses import JSONResponse                         # Importa resposta JSON específica
        return JSONResponse(                                               # Retorna 403 com código e mensagem
            status_code=403,
            content={"code": "USER_NOT_FOUND", "message": "Cadastro não encontrado, procure a secretaria da sua escola"}
        )

    # --------------------------------------------------
    # Valida senha com bcrypt
    # --------------------------------------------------
    if not bcrypt.checkpw(senha.encode("utf-8"), usuario.senha_hash.encode("utf-8")):  # Compara hash
        logger.warning(f"❌ Senha incorreta para o e-mail: {email}")                     # Registra senha incorreta
        raise HTTPException(                                                            # Retorna 401 padronizado
            status_code=401,
            detail="SEU USUÁRIO E/OU SENHA ESTÃO INCORRETAS, TENTE NOVAMENTE"
        )

    # --------------------------------------------------
    # Sucesso
    # --------------------------------------------------
    logger.info(f"✅ Login realizado com sucesso para: {email}")       # Registra sucesso
    # Gera JWT incluindo identificador e tipo de perfil do usuário
    token_payload = {
        "sub": email,
        "id_usuario": usuario.id_usuario,
        "tipo_perfil": usuario.tipo_perfil,
    }
    token = create_access_token(token_payload)
    return {
        "message": "Login realizado com sucesso",
        "token": token,
        "email": email,
        "id_usuario": usuario.id_usuario,
        "tipo_perfil": usuario.tipo_perfil,
    }  # Retorna token e dados básicos do usuário

# ======================================================
# (As rotas /google-login e /google-callback permanecem como no seu código aprovado)
# ======================================================

# 🔓 Google login
@app.get("/google-login")
def google_login():
    client_id = os.getenv("GOOGLE_CLIENT_ID")                          # Lê client_id do .env
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")                    # Lê redirect_uri do .env
    scope = "openid%20email%20profile"                                 # Define escopos solicitados
    google_oauth_url = (                                               # Monta URL de autorização
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={client_id}"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scope}"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return RedirectResponse(google_oauth_url)                          # Redireciona para Google

# 🔁 Google callback
@app.get("/google-callback")
def google_callback(request: Request):
    try:
        code = request.query_params.get("code")                        # Lê código de autorização
        if not code:                                                   # Valida presença do código
            raise HTTPException(status_code=400, detail="Código de autorização ausente")  # Retorna 400

        client_id = os.getenv("GOOGLE_CLIENT_ID")                      # Lê client_id do .env
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")              # Lê client_secret do .env
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")                # Lê redirect_uri do .env

        token_url = "https://oauth2.googleapis.com/token"              # Define endpoint de token
        token_data = {                                                 # Monta payload de troca de código
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }

        token_response = requests.post(token_url, data=token_data, timeout=10)  # Solicita token ao Google
        if token_response.status_code != 200:                                   # Valida resposta
            logger.error(f"❌ Erro ao obter token: {token_response.text}")      # Registra erro
            raise HTTPException(status_code=400, detail="Falha ao obter token de acesso")  # Retorna 400

        access_token = token_response.json().get("access_token")      # Extrai access_token
        if not access_token:                                          # Valida presença
            raise HTTPException(status_code=400, detail="Token de acesso ausente")  # Retorna 400

        user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"  # Define endpoint de userinfo
        headers = {"Authorization": f"Bearer {access_token}"}            # Monta header de autorização
        user_info_response = requests.get(user_info_url, headers=headers, timeout=10)  # Consulta dados do usuário
        if user_info_response.status_code != 200:                        # Valida resposta
            logger.error(f"❌ Erro ao obter dados do usuário: {user_info_response.text}")  # Registra erro
            raise HTTPException(status_code=400, detail="Erro ao obter dados do usuário")  # Retorna 400

        user_data = user_info_response.json()                # Converte resposta para dicionário
        user_email = user_data.get("email")                  # Extrai e-mail do usuário
        if not user_email:                                   # Valida presença do e-mail
            raise HTTPException(status_code=400, detail="Email não encontrado na resposta do Google")  # Retorna 400

        conn = None                                          # Inicializa conexão
        cur = None                                           # Inicializa cursor
        try:
            database_url = os.getenv("DATABASE_URL")         # Lê URL do banco
            conn = psycopg2.connect(dsn=database_url)        # Abre conexão
            cur = conn.cursor()                              # Abre cursor
            cur.execute("SELECT id_usuario FROM usuarios WHERE email = %s", (user_email,))  # Consulta pré-cadastro
            result = cur.fetchone()                          # Lê resultado

            if not result:                                   # Verifica se usuário não existe
                logger.warning(f"⛔ Usuário não pré-cadastrado (GOOGLE): {user_email}")  # Registra ausência
                from fastapi.responses import RedirectResponse                            # Importa RedirectResponse
                frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")        # Define URL do front
                return RedirectResponse(url=f"{frontend_url}/login?err=USER_NOT_FOUND", status_code=302)  # Redireciona

            logger.info(f"✅ Usuário autorizado: {user_email}")    # Registra sucesso
            token = create_access_token({"sub": user_email})       # Gera JWT
            from fastapi.responses import RedirectResponse         # Importa RedirectResponse
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")  # Define URL do front
            return RedirectResponse(url=f"{frontend_url}/login?token={token}", status_code=302)  # Redireciona com token

        except PsycopgError as db_err:                       # Captura erro de banco
            logger.error(f"❌ Erro ao consultar banco de dados: {db_err}")  # Registra erro
            raise HTTPException(status_code=500, detail="Erro ao acessar banco de dados")  # Retorna 500
        finally:
            if cur is not None:                              # Verifica cursor aberto
                try:
                    cur.close()                              # Fecha cursor
                except Exception:
                    logger.warning("⚠️ Falha ao fechar cursor do banco")   # Registra aviso
            if conn is not None:                             # Verifica conexão aberta
                try:
                    conn.close()                             # Fecha conexão
                except Exception:
                    logger.warning("⚠️ Falha ao fechar conexão com o banco")  # Registra aviso

    except HTTPException:                                    # Mantém HTTPException original
        raise                                                # Propaga exceção
    except Exception:                                        # Captura exceções não previstas
        logger.exception("❌ Erro inesperado na callback do Google")  # Registra stacktrace
        raise HTTPException(status_code=500, detail="Erro interno no servidor")  # Retorna 500
