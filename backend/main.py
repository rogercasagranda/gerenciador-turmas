# ======================================================
# Importa módulos padrão e terceiros
# ======================================================
import os                                   # Importa os recursos do sistema operacional para obter variáveis de ambiente
import logging                               # Importa o logging para registrar eventos e erros
from pathlib import Path                     # Importa Path para manipular caminhos de arquivos
import requests                               # Importa requests para realizar chamadas HTTP ao Google OAuth
import psycopg2                               # Importa psycopg2 para conexão síncrona com PostgreSQL
from psycopg2 import Error as PsycopgError    # Importa a classe de erro específica do psycopg2
from zoneinfo import ZoneInfo                 # Importa ZoneInfo para definir fuso horário
import uuid                                   # Gera correlation_id quando ausente
import time                                   # Utilizado para timestamp seguro no redirect

# ======================================================
# JWT: criação de token de acesso
# ======================================================
from datetime import datetime, timedelta     # Importa utilitários de data e tempo
from jose import jwt                         # Importa biblioteca JOSE para geração de JWT

# Lê a chave do JWT priorizando SECRET_KEY (compatibilidade com nomes antigos)
SECRET_KEY = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET", "change-me-in-prod")  # Define chave secreta do JWT
ALGORITHM = os.getenv("JWT_ALG", "HS256")                 # Define algoritmo de assinatura
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
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse, Response   # Importa respostas JSON, redirecionamentos e arquivos
from fastapi.middleware.cors import CORSMiddleware              # Importa CORS middleware para liberar origens
from fastapi.staticfiles import StaticFiles                     # Importa utilitário para servir arquivos estáticos

# ======================================================
# Importa utilitários de configuração e modelos
# ======================================================
from dotenv import load_dotenv                 # Importa load_dotenv para carregar variáveis do arquivo .env
from pydantic import BaseModel, Field, ConfigDict  # Importa BaseModel, Field e ConfigDict para validação flexível

# ======================================================
# Importa camada de acesso a dados (AJUSTE DE IMPORTS PARA EXECUTAR PELA RAIZ)
# ======================================================
from backend.database import (
    get_db, engine, SessionLocal
)  # Importa acesso ao banco e fábrica de sessões
from backend.models.usuarios import (
    Usuarios, Base
)  # Importa o modelo Usuarios e a Base compartilhada
from backend.models.permissoes import Grupo, UsuarioGrupo  # Importa grupos e associação usuário-grupo
from backend.services.permissions import get_effective_permissions  # Calcula permissões efetivas
from backend.models.logconfig import LogConfig          # Modelo de configuração de logs
from backend.models.logauditoria import LogAuditoria    # Modelo de auditoria para criação de tabela
import bcrypt                                          # Importa bcrypt para validação de senha

# ======================================================
# IMPORTA ROTAS (MERGE) — adiciona router de usuários
# ======================================================
from backend.routes.usuarios import router as usuarios_router   # Importa router de /usuarios
from backend.routers.usuarios_delete import router as usuarios_delete_router  # Importa rotas de exclusão de usuários
from backend.routes.logs import router as logs_router            # Importa rotas de logs de auditoria
from backend.routers.logs_config import router as logs_config_router  # Importa rotas de configuração de logs
from backend.routes.turmas import router as turmas_router            # Importa rotas do módulo de turmas
from backend.routes.calendario import router as calendario_router    # Importa rotas de calendário escolar
from backend.routes.telas import router as telas_router              # Importa rotas de telas oficiais
from backend.routes.me import router as me_router                    # Importa rotas de informações do usuário
from backend.routes.acessos import router as acessos_router          # Importa rotas de acessos e permissões

# ======================================================
# Configura logger da aplicação
# ======================================================
BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")
logging.Formatter.converter = lambda *args: datetime.now(BRAZIL_TZ).timetuple()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s:%(name)s:%(message)s",
)
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

# URL do frontend para redirecionamento raiz
# Mantemos a variável para compatibilidade, mas o endpoint raiz agora
# responde com uma mensagem padrão. Isso evita que usuários recebam
# um erro "Not Found" caso a URL do frontend não esteja disponível.
FRONTEND_URL = os.getenv("FRONTEND_URL")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")


@app.get("/")
def root():
    """Endpoint de saúde simples para a API.

    Se ``FRONTEND_URL`` estiver configurada o valor é retornado na
    resposta para referência, mas nenhuma tentativa de redirecionamento
    é feita. Assim a abertura da aplicação sempre retorna ``200``.
    """
    body = {"status": "ok"}
    if FRONTEND_URL:
        body["frontend_url"] = FRONTEND_URL
    return body

@app.get("/health")
def health():
    """Endpoint de saúde para monitoramento."""
    return {"status": "ok"}


@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)

# ======================================================
# Configura CORS — restringe à origem do frontend
# ======================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN")],
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=False,
)

# ======================================================
# Registra routers (MERGE) — mantém existentes e soma /usuarios
# ======================================================
# Inclui primeiro as rotas com caminhos estáticos para evitar conflito com /usuarios/{id}
app.include_router(usuarios_delete_router)           # Registra rota de exclusão e log de perfil
app.include_router(usuarios_router)                  # Registra rotas de usuários (/usuarios GET/POST)
app.include_router(logs_router)                      # Registra rotas de logs de auditoria
app.include_router(logs_config_router)               # Registra rotas de configuração de logs
app.include_router(turmas_router)                    # Registra rotas de turmas e afins
app.include_router(calendario_router)                # Registra rotas de calendário (ano letivo e afins)
app.include_router(telas_router)                     # Registra rota de listagem de telas
app.include_router(me_router)                        # Registra rotas do usuário autenticado
app.include_router(acessos_router)                   # Registra rotas de acessos e permissões

# ======================================================
# Evento de inicialização do servidor
# ======================================================
@app.on_event("startup")  # Executa no start do app
async def startup_event():  # Declara função assíncrona de inicialização
    # Garante que todas as tabelas do ORM existam
    Base.metadata.create_all(bind=engine)
    # Assegura registro global de logs habilitado por padrão
    with SessionLocal() as db:
        if not db.query(LogConfig).filter(LogConfig.screen == "__all__").first():
            db.add(LogConfig(screen="__all__", create_enabled=True, read_enabled=True, update_enabled=True, delete_enabled=True))
            db.commit()

    logger.info("Backend iniciado com sucesso")  # Log único de inicialização

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
    email = (
        raw.get("email")
        or raw.get("usuario")
        or raw.get("username")
        or ""
    ).strip().lower()  # Normaliza e-mail e força minúsculas
    senha = (raw.get("senha") or raw.get("password") or "").strip()                        # Normaliza senha

    # --------------------------------------------------
    # Validação mínima do payload
    # --------------------------------------------------
    if not email or not senha:                                       # Verifica se faltam campos
        logger.warning("Payload inválido no /login (faltando email/senha)")  # Registra aviso
        raise HTTPException(status_code=422, detail="Payload inválido: envie 'email' e 'senha'.")  # Retorna 422

    cid = request.headers.get("x-cid") or str(uuid.uuid4())
    logger.info(f"[{cid}] Tentativa de login com e-mail: {email}")

    # --------------------------------------------------
    # Consulta usuário via ORM
    # --------------------------------------------------
    usuario = db.query(Usuarios).filter(Usuarios.email.ilike(email)).first()  # Busca usuário por e-mail (case-insensitive)
    if not usuario:                                                       # Verifica inexistência
        logger.warning(f"[{cid}] Usuário não pré-cadastrado (LOCAL): {email}")
        return JSONResponse(                                               # Retorna 403 com código e mensagem
            status_code=403,
            content={"code": "USER_NOT_FOUND", "message": "Cadastro não encontrado, procure a secretaria da sua escola"}
        )

    # --------------------------------------------------
    # Valida senha com bcrypt
    # --------------------------------------------------
    if not usuario.senha_hash:                                             # Verifica ausência de senha local
        logger.warning(f"[{cid}] Usuário sem senha local configurada: {email}")
        return JSONResponse(                                               # Retorna 403 com código e mensagem
            status_code=403,
            content={"code": "NO_LOCAL_PASSWORD", "message": "Cadastro não possui senha local, utilize o login com Google"}
        )
    if not bcrypt.checkpw(senha.encode("utf-8"), usuario.senha_hash.encode("utf-8")):  # Compara hash
        logger.warning(f"[{cid}] Senha incorreta para o e-mail: {email}")
        raise HTTPException(                                                            # Retorna 401 padronizado
            status_code=401,
            detail="SEU USUÁRIO E/OU SENHA ESTÃO INCORRETAS, TENTE NOVAMENTE"
        )

    # --------------------------------------------------
    # Sucesso
    # --------------------------------------------------
    logger.info(
        f"[{cid}] Login realizado com sucesso user_id={usuario.id_usuario} role={usuario.tipo_perfil}"
    )
    # Monta grupos e permissões do usuário
    grupos = [
        g.nome
        for g in db.query(Grupo)
        .join(UsuarioGrupo, UsuarioGrupo.grupo_id == Grupo.id)
        .filter(UsuarioGrupo.usuario_id == usuario.id_usuario)
        .all()
    ]
    permissoes = get_effective_permissions(db, usuario.id_usuario, usuario.tipo_perfil)
    is_master = bool(usuario.is_master or (usuario.tipo_perfil or "").lower() == "master")
    role = "Master" if is_master else usuario.tipo_perfil
    perms_payload = ["*"] if is_master else permissoes
    token_payload = {
        "sub": str(usuario.id_usuario),
        "email": email,
        "nome": usuario.nome,
        "role": role,
        "groups": grupos,
        "permissions": perms_payload,
        "is_master": is_master,
    }
    token = create_access_token(token_payload)
    logger.info(f"[{cid}] JWT size={len(token)} bytes")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": usuario.id_usuario,
            "email": email,
            "nome": usuario.nome,
            "perfis": grupos,
            "permissoes": permissoes,
            "is_master": is_master,
        },
    }

# ======================================================
# Rota de logout mantida apenas para compatibilidade; não usa cookies
# ======================================================
@app.post("/logout")
def logout():
    return JSONResponse({"message": "Logout realizado com sucesso"})

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
    cid = request.headers.get("x-cid") or str(uuid.uuid4())
    try:
        code = request.query_params.get("code")                        # Lê código de autorização
        if not code:                                                   # Valida presença do código
            logger.warning(f"[{cid}] Código de autorização ausente")
            raise HTTPException(status_code=400, detail="Código de autorização ausente")

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
            logger.error(f"[{cid}] Erro ao obter token: {token_response.text}")
            raise HTTPException(status_code=400, detail="Falha ao obter token de acesso")

        access_token = token_response.json().get("access_token")      # Extrai access_token
        if not access_token:                                          # Valida presença
            raise HTTPException(status_code=400, detail="Token de acesso ausente")  # Retorna 400

        user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"  # Define endpoint de userinfo
        headers = {"Authorization": f"Bearer {access_token}"}            # Monta header de autorização
        user_info_response = requests.get(user_info_url, headers=headers, timeout=10)
        if user_info_response.status_code != 200:
            logger.error(f"[{cid}] Erro ao obter dados do usuário: {user_info_response.text}")
            raise HTTPException(status_code=400, detail="Erro ao obter dados do usuário")

        user_data = user_info_response.json()                # Converte resposta para dicionário
        user_email = user_data.get("email")                  # Extrai e-mail do usuário
        user_name = user_data.get("name")                    # Extrai nome do usuário
        if not user_email:
            logger.warning(f"[{cid}] Email ausente na resposta do Google")
            raise HTTPException(status_code=400, detail="Email não encontrado na resposta do Google")

        conn = None                                          # Inicializa conexão
        cur = None                                           # Inicializa cursor
        try:
            database_url = os.getenv("DATABASE_URL")         # Lê URL do banco
            conn = psycopg2.connect(dsn=database_url)        # Abre conexão
            cur = conn.cursor()                              # Abre cursor
            # Busca identificador e perfil do usuário pré-cadastrado
            cur.execute(
                "SELECT id_usuario, tipo_perfil, is_master FROM usuarios WHERE email = %s",
                (user_email,),
            )
            result = cur.fetchone()                          # Lê resultado

            if not result:                                   # Verifica se usuário não existe
                logger.warning(f"[{cid}] Usuário não pré-cadastrado (GOOGLE): {user_email}")
                if not FRONTEND_ORIGIN:
                    logger.error(f"[{cid}] FRONTEND_ORIGIN não configurado")
                    raise HTTPException(status_code=500, detail="FRONTEND_ORIGIN não configurado")
                return RedirectResponse(
                    url=f"{FRONTEND_ORIGIN}/login?err=USER_NOT_FOUND",
                    status_code=302,
                )

            logger.info(f"[{cid}] Usuário autorizado: {user_email}")
            id_usuario, tipo_perfil, is_master_db = result       # Extrai dados do usuário
            with SessionLocal() as db_session:
                grupos = [
                    g.nome
                    for g in db_session.query(Grupo)
                    .join(UsuarioGrupo, UsuarioGrupo.grupo_id == Grupo.id)
                    .filter(UsuarioGrupo.usuario_id == id_usuario)
                    .all()
                ]
                permissoes = get_effective_permissions(db_session, id_usuario, tipo_perfil)
            is_master = bool(is_master_db or (tipo_perfil or "").lower() == "master")
            role = "Master" if is_master else tipo_perfil
            perms_payload = ["*"] if is_master else permissoes
            token_payload = {
                "sub": str(id_usuario),
                "email": user_email,
                "nome": user_name,
                "role": role,
                "groups": grupos,
                "permissions": perms_payload,
                "is_master": is_master,
            }
            access_token = create_access_token(token_payload)
            logger.info(f"[{cid}] Google login gerou JWT size={len(access_token)} bytes")
            if not FRONTEND_ORIGIN:
                logger.error(f"[{cid}] FRONTEND_ORIGIN não configurado")
                raise HTTPException(status_code=500, detail="FRONTEND_ORIGIN não configurado")
            redirect_url = (
                f"{FRONTEND_ORIGIN}/#/auth/callback?token={access_token}&t={int(time.time())}"
            )
            return RedirectResponse(url=redirect_url, status_code=302)

        except PsycopgError as db_err:                       # Captura erro de banco
            logger.error(f"[{cid}] Erro ao consultar banco de dados: {db_err}")
            raise HTTPException(status_code=500, detail="Erro ao acessar banco de dados")  # Retorna 500
        finally:
            if cur is not None:                              # Verifica cursor aberto
                try:
                    cur.close()                              # Fecha cursor
                except Exception:
                    logger.warning(f"[{cid}] Falha ao fechar cursor do banco")
            if conn is not None:                             # Verifica conexão aberta
                try:
                    conn.close()                             # Fecha conexão
                except Exception:
                    logger.warning(f"[{cid}] Falha ao fechar conexão com o banco")

    except HTTPException:                                    # Mantém HTTPException original
        raise                                                # Propaga exceção
    except Exception:                                        # Captura exceções não previstas
        logger.exception(f"[{cid}] Erro inesperado na callback do Google")
        raise HTTPException(status_code=500, detail="Erro interno no servidor")  # Retorna 500


# ======================================================
# Servir frontend estático e fallback para SPA
# ======================================================

# Monta a pasta de assets gerados pelo build do React
app.mount(
    "/assets",
    StaticFiles(directory="frontend/dist/assets", check_dir=False),
    name="assets",
)


# Fallback para qualquer rota não atendida pelo backend
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    index_path = os.path.join("frontend", "dist", "index.html")
    return FileResponse(index_path, media_type="text/html")