import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Lê a URL de conexão do banco de dados de uma variável de ambiente
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não está definida")

# Configura argumentos especiais para bancos SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Cria o engine para se conectar ao banco
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Cria a factory para sessões de banco de dados
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Cria a base para os modelos
Base = declarative_base()

# Função para obter uma sessão do banco para uso no FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
