# Importa FastAPI e utilitários principais
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware  # Libera CORS para frontend acessar a API
from pydantic import BaseModel                      # Validação de dados recebidos no endpoint
import asyncpg                                      # Conexão assíncrona com PostgreSQL
from passlib.context import CryptContext            # Hash seguro de senha (bcrypt)
from dotenv import load_dotenv                      # Carregar variáveis do .env
import os                                           # Para acessar variáveis de ambiente
from google.oauth2 import id_token                  # Validar tokens do Google
from google.auth.transport import requests as grequests

# Carrega variáveis de ambiente do arquivo .env (ex: DATABASE_URL)
load_dotenv()

# Cria a instância principal da aplicação FastAPI
app = FastAPI()

# Habilita CORS para permitir frontend (React) acessar a API (ajuste para seu domínio se desejar)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Troque por ["http://localhost:3000"] ou seu domínio para produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cria contexto de hash seguro para senha, usando bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Recupera a string de conexão do banco a partir do .env
DATABASE_URL = os.getenv("DATABASE_URL")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Função assíncrona utilitária para obter conexão com o banco PostgreSQL
async def get_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

# Modelo de dados para login (recebido no corpo do POST)
class LoginData(BaseModel):
    usuario: str
    senha: str


class GoogleToken(BaseModel):
    token: str

# Função utilitária para gerar hash seguro (use ao cadastrar usuário!)
def gerar_hash_senha(senha: str) -> str:
    """
    Gera hash seguro (bcrypt) para salvar no banco.
    Use ao cadastrar/atualizar senha de usuário.
    """
    return pwd_context.hash(senha)

# Endpoint de teste para ver se API está online
@app.get("/")
async def home():
    return {"message": "Bem-vindo ao Portal do Professor - API online!"}

# Endpoint seguro de login, consultando o banco e comparando hash da senha
@app.post("/login")
async def login(data: LoginData, db=Depends(get_db)):
    """
    Endpoint de login seguro:
    - Consulta o banco de dados pela tabela de usuário.
    - Compara a senha enviada com o hash salvo (bcrypt).
    - Retorna mensagem genérica de erro, sem nunca dizer qual campo está errado.
    """
    # Busca usuário pelo nome
    row = await db.fetchrow(
        "SELECT id, usuario, senha_hash FROM usuario WHERE usuario = $1",
        data.usuario
    )
    if not row:
        # Usuário não existe (mensagem genérica, nunca revele se o usuário existe!)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos"
        )
    # Verifica a senha enviada comparando com o hash do banco
    senha_ok = pwd_context.verify(data.senha, row['senha_hash'])
    if not senha_ok:
        # Senha incorreta (mensagem sempre genérica)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos"
        )

    # Login realizado com sucesso, retorna só o nome do usuário (pode expandir para JWT depois)
    return {"message": "Login realizado com sucesso!", "usuario": row["usuario"]}


# Endpoint de autenticação com Google
@app.post("/auth/google")
async def auth_google(token: GoogleToken):
    try:
        idinfo = id_token.verify_oauth2_token(
            token.token,
            grequests.Request(),
            GOOGLE_CLIENT_ID,
        )
        return {"message": "Token Google válido", "email": idinfo.get("email")}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )

# Endpoint simples para health check/ping
@app.get("/ping")
async def ping():
    return {"status": "ok"}

# ======================== FIM DO ARQUIVO MAIN.PY ========================

# Exemplo prático para criação da tabela "usuario" no PostgreSQL:
#
# CREATE TABLE usuario (
#   id SERIAL PRIMARY KEY,
#   usuario VARCHAR(50) UNIQUE NOT NULL,
#   senha_hash VARCHAR(256) NOT NULL,
#   is_master BOOLEAN DEFAULT FALSE
# );
#
# Como gerar hash da senha do usuário master:
#
# from passlib.context import CryptContext
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# print(pwd_context.hash("senha_do_master"))
#
# Como inserir o usuário master:
#
# INSERT INTO usuario (usuario, senha_hash, is_master)
# VALUES ('master', '<cole_aqui_o_hash_gerado>', TRUE);
#
# Não esqueça de criar seu arquivo .env com:
# DATABASE_URL=postgresql://usuario:senha@host:porta/nomedobanco
#
# Pronto: backend seguro, funcional, pronto para rodar no Render, local ou onde quiser.
