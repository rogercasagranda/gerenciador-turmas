# Importa o modelo de dados do Pydantic para validar as entradas do usuário
from pydantic import BaseModel

# Define o schema utilizado para login de usuários
class UsuarioLogin(BaseModel):
    # Campo obrigatório que representa o nome de usuário
    usuario: str
    # Campo obrigatório que representa a senha em texto plano
    senha: str
