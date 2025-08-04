# backend/app/routes/usuarios.py

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime
import asyncpg
from app.db import get_db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Define o schema de entrada para o cadastro
class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    tipo_perfil: str
    ddi: str
    ddd: str
    numero_celular: str
    google_id: str | None = None

# Função para gerar hash da senha
def gerar_hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)

# Endpoint de cadastro
@router.post("/usuarios", status_code=status.HTTP_201_CREATED)
async def criar_usuario(dados: UsuarioCreate, db: asyncpg.Connection = Depends(get_db)):
    # Verifica se e-mail já existe
    usuario_existente = await db.fetchrow("SELECT * FROM usuarios WHERE email = $1", dados.email)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    # Gera hash da senha
    senha_hash = gerar_hash_senha(dados.senha)

    # Insere o usuário no banco
    query_usuario = """
        INSERT INTO usuarios (
            nome, email, senha_hash, tipo_perfil, ddi, ddd, numero_celular, google_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id_usuario
    """
    novo_id = await db.fetchval(query_usuario, dados.nome, dados.email, senha_hash, dados.tipo_perfil,
                                dados.ddi, dados.ddd, dados.numero_celular, dados.google_id)

    # Registra o log
    query_log = """
        INSERT INTO logs (acao, tabela, id_registro, criado_em)
        VALUES ('CADASTRO', 'usuarios', $1, $2)
    """
    await db.execute(query_log, novo_id, datetime.now())

    return {"mensagem": "Usuário cadastrado com sucesso", "id_usuario": novo_id}
