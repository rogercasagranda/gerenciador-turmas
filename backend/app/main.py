# backend/app/main.py

# Importa a biblioteca FastAPI
from fastapi import FastAPI

# Importa o middleware CORS para permitir acesso do frontend
from fastapi.middleware.cors import CORSMiddleware

# Importa a biblioteca para carregar variáveis de ambiente
from dotenv import load_dotenv

# Importa o módulo OS para ler as variáveis do sistema
import os

# Importa a biblioteca asyncpg para conexão assíncrona com o banco de dados PostgreSQL
import asyncpg

# Importa o roteador de login
from app.routes import login

# Carrega as variáveis definidas no arquivo .env
load_dotenv()

# Cria uma instância do app FastAPI
app = FastAPI()

# Define as origens permitidas para requisições (libera tudo neste caso)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],             # Libera requisições de qualquer origem
    allow_credentials=True,
    allow_methods=["*"],             # Libera todos os métodos (GET, POST, etc)
    allow_headers=["*"],             # Libera todos os cabeçalhos
)

# Evento disparado ao iniciar a aplicação (cria pool de conexão com o banco)
@app.on_event("startup")
async def startup():
    app.state.db = await asyncpg.create_pool(
        dsn=os.getenv("DATABASE_URL")  # Usa a variável de ambiente DATABASE_URL
    )

# Evento disparado ao encerrar a aplicação (fecha o pool)
@app.on_event("shutdown")
async def shutdown():
    await app.state.db.close()

# Registra o roteador de login na aplicação
app.include_router(login.router)
