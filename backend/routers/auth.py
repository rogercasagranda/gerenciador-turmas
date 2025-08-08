# Importa o roteador de rotas da FastAPI
from fastapi import APIRouter, HTTPException, Depends

# Importa a sessão do SQLAlchemy para transações com o banco
from sqlalchemy.orm import Session

# Importa a função para obter a sessão ativa com o banco de dados
from backend.database import get_db

# Importa o modelo de usuário para consulta à tabela "usuarios"
from backend.models import Usuario

# Importa a biblioteca bcrypt para verificação segura da senha
import bcrypt

# Cria o roteador de autenticação
router = APIRouter()

# Define a rota POST /login para autenticação com e-mail e senha
@router.post("/login")
def login(email: str, senha: str, db: Session = Depends(get_db)):
    # Busca o usuário pelo e-mail informado
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    # Se o usuário não existir, retorna erro de credenciais inválidas
    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="SEU USUÁRIO E/OU SENHA ESTÃO INCORRETAS, TENTE NOVAMENTE"
        )

    # Verifica se a senha fornecida corresponde ao hash armazenado no banco
    if not bcrypt.checkpw(senha.encode("utf-8"), usuario.senha_hash.encode("utf-8")):
        raise HTTPException(
            status_code=401,
            detail="SEU USUÁRIO E/OU SENHA ESTÃO INCORRETAS, TENTE NOVAMENTE"
        )

    # Se todas as validações passarem, retorna sucesso com o e-mail do usuário
    return {
        "mensagem": "Login realizado com sucesso",
        "usuario": usuario.email
    }
