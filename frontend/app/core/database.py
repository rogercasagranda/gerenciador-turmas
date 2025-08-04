from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Define a URL de conexão com o banco de dados Supabase
DATABASE_URL = "postgresql://postgres:Zp#8vLq3@Wd9KmX@db.awoajcgpkovgegvfqpoa.supabase.co:5432/postgres"

# Cria o engine para se conectar ao banco
engine = create_engine(DATABASE_URL)

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
