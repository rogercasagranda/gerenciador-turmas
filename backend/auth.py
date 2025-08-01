# backend/auth.py

from fastapi import HTTPException

# Usuário master fixo para testes (depois será movido ao banco)
MASTER_USER = {
    "username": "admin",
    "password": "admin123"  # Futuramente será hash
}

def authenticate_user(username: str, password: str):
    # Verifica se usuário e senha conferem
    if username != MASTER_USER["username"] or password != MASTER_USER["password"]:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    return {"message": "Login bem-sucedido"}
