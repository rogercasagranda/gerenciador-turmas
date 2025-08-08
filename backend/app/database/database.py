# Importa o módulo asyncpg para conexão assíncrona com PostgreSQL
import asyncpg

# Importa o módulo os para leitura de variáveis de ambiente
import os

# Importa função do dotenv para carregar variáveis do arquivo .env
from dotenv import load_dotenv

# Carrega variáveis do .env para o ambiente
load_dotenv()

# Lê a URL de conexão com o banco de dados da variável DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

# Define uma função assíncrona que busca um usuário pelo e-mail ou telefone
async def get_user_by_email_or_phone(usuario: str):
    # Estabelece a conexão com o banco de dados PostgreSQL usando asyncpg
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Executa a consulta SQL buscando por e-mail ou número de celular
        result = await conn.fetchrow("""
            SELECT nome, email, senha_hash, tipo_perfil, foi_pre_cadastrado, ativo
            FROM usuarios
            WHERE email = $1 OR numero_celular = $1
        """, usuario)

        # Retorna os dados em formato de dicionário se houver resultado, senão retorna None
        return dict(result) if result else None

    finally:
        # Encerra a conexão com o banco de dados independentemente do resultado
        await conn.close()
