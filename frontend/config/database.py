import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Carrega variáveis do .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

# Consulta a string de conexão do banco (usa o valor do .env)
DATABASE_URL = os.getenv('DATABASE_URL')

# Usa a conexão consultada
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
