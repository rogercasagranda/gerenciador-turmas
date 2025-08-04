# Contém as funções de segurança como hashing e verificação de senha

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Verifica se a senha está correta comparando de forma segura
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    # Gera o hash de uma nova senha
    return pwd_context.hash(password)
