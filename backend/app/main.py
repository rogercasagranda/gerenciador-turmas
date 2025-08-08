# Importa o FastAPI principal
from fastapi import FastAPI

# Importa o middleware CORS
from fastapi.middleware.cors import CORSMiddleware

# Importa o roteador da rota de login padrão
from app.routes import login

# Importa o roteador da rota de autenticação com Google
from app.routes import auth_google_route

# Cria a instância da aplicação FastAPI
app = FastAPI()

# Configura as origens permitidas (ajustar para produção conforme necessário)
origins = [
    "http://localhost:5173",  # Frontend em ambiente local
]

# Adiciona o middleware CORS para permitir acesso entre domínios
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Lista de origens permitidas
    allow_credentials=True,         # Permite envio de cookies e headers
    allow_methods=["*"],            # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"],            # Permite todos os headers
)

# Inclui o roteador padrão de login tradicional
app.include_router(login.router)

# Inclui o roteador responsável pela rota /google-login
app.include_router(auth_google_route.router)

# Endpoint raiz opcional para teste
@app.get("/")
def read_root():
    return {"message": "API do Portal do Professor funcionando"}
