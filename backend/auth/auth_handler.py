# backend/auth/auth_handler.py

import hashlib

# Usuário Master pré-definido para testes
USERS = {
    "admin": hashlib.sha256("admin123".encode()).hexdigest()
}

def verify_user(username: str, password: str) -> bool:
    """Verifica se o usuário existe e se a senha está correta (hash SHA-256)"""
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return USERS.get(username) == password_hash
