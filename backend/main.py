# Importa a classe principal da FastAPI
from fastapi import FastAPI

# Importa o middleware CORS para permitir chamadas do frontend
from fastapi.middleware.cors import CORSMiddleware

# Importa o módulo de rotas de login
from app.routes import login

# Cria a instância da aplicação FastAPI
app = FastAPI()

# Define as origens permitidas para o CORS
origins = [
    "http://localhost:5173",  # Frontend local com Vite
    "http://localhost:4173",  # Preview local (build do Vite)
]

# Adiciona o middleware CORS à aplicação
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,             # Lista de domínios permitidos
    allow_credentials=True,            # Permite envio de cookies/autenticação
    allow_methods=["*"],               # Permite todos os métodos HTTP
    allow_headers=["*"],               # Permite todos os headers
)

# Inclui o roteador de login na aplicação
app.include_router(login.router)
