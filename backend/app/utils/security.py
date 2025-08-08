# Importa o contexto de criptografia do PassLib
from passlib.context import CryptContext

# Define o algoritmo e contexto de hash
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Função que compara a senha digitada com o hash armazenado
def verificar_senha(senha_plain: str, senha_hashed: str) -> bool:
    # Verifica a validade da senha
    return pwd_context.verify(senha_plain, senha_hashed)
