# backend/app/routes/login.py

# Importa o roteador do FastAPI para criação de rotas
from fastapi import APIRouter, HTTPException, status, Request

# Importa o modelo de validação de dados
from pydantic import BaseModel

# Importa a biblioteca asyncpg para comunicação com o banco de dados PostgreSQL
import asyncpg

# Importa o gerenciador de hashing de senha (bcrypt)
from passlib.context import CryptContext

# Instancia um novo roteador para as rotas de login
router = APIRouter()

# Define o esquema de criptografia de senha como bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Define os dados esperados no corpo da requisição
class LoginData(BaseModel):
    identificador: str  # Pode ser e-mail ou número de celular completo (DDI+DDD+número)
    senha: str          # Senha do usuário

# Define a rota POST para o endpoint /login
@router.post("/login")
async def login(data: LoginData, request: Request):
    # Recupera o pool de conexão com o banco de dados
    pool: asyncpg.pool.Pool = request.app.state.db

    # Verifica se o identificador contém "@" para saber se é e-mail
    if "@" in data.identificador:
        # Consulta o usuário com base no e-mail
        query = "SELECT * FROM usuarios WHERE email = $1"
        values = (data.identificador,)
    else:
        # Verifica se o número de celular é válido
        if not data.identificador.isdigit() or len(data.identificador) < 10:
            raise HTTPException(status_code=400, detail="Número de telefone inválido")

        # Extrai DDI, DDD e número
        ddi = data.identificador[:2]
        ddd = data.identificador[2:4]
        numero = data.identificador[4:]

        # Consulta o usuário com base no número de celular
        query = """
            SELECT * FROM usuarios WHERE ddi = $1 AND ddd = $2 AND numero_celular = $3
        """
        values = (ddi, ddd, numero)

    # Executa a consulta
    user = await pool.fetchrow(query, *values)

    # Retorna erro se usuário não for encontrado
    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    # Verifica a senha fornecida com a hash armazenada
    if not pwd_context.verify(data.senha, user["senha_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    # Retorna dados do usuário em caso de sucesso
    return {
        "mensagem": "Login realizado com sucesso",
        "usuario_id": str(user["id"]),
        "nome": user["nome"]
    }
