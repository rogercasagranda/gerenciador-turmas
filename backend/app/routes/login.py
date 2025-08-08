# backend/app/routes/login.py

# Importa o roteador do FastAPI
from fastapi import APIRouter

# Importa o redirecionamento HTTP
from fastapi.responses import RedirectResponse

# Cria o roteador para as rotas de login
router = APIRouter()

# Define a rota GET para /google-login
@router.get("/google-login")
async def login_google():
    # Redireciona para o endpoint real de login do Google
    return RedirectResponse(url="/auth/google/login")
