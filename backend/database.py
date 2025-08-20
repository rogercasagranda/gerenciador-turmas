# backend/database.py
# ======================================================
# Importa módulos necessários
# ======================================================
import os                                  # Importa os recursos do sistema operacional para acessar variáveis de ambiente
from dotenv import load_dotenv             # Importa load_dotenv para carregar variáveis do arquivo .env
from sqlalchemy import create_engine       # Importa create_engine para criar o engine do SQLAlchemy
from sqlalchemy.orm import sessionmaker    # Importa sessionmaker para criar sessões de banco

# Importa modelos para registrar tabelas
from backend.models import Base, AnoLetivo

# ======================================================
# Carrega o .env da pasta backend
# ======================================================
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))  # Carrega as variáveis do arquivo .env no diretório backend

# ======================================================
# Lê a URL do banco do .env
# ======================================================
DATABASE_URL = os.getenv("DATABASE_URL")   # Obtém a variável de ambiente DATABASE_URL

# ======================================================
# Valida a variável de ambiente
# ======================================================
if not DATABASE_URL or "postgresql" not in DATABASE_URL:  # Verifica se a URL está ausente ou malformada
    raise RuntimeError(                                   # Lança erro claro para facilitar o diagnóstico
        "DATABASE_URL ausente ou inválida no backend/.env. "
        "Verifique se não há cortes/reticências e se o valor completo do Neon foi colado."
    )

# ======================================================
# Cria o engine com parâmetros seguros
# ======================================================
engine = create_engine(                   # Cria o engine do SQLAlchemy
    DATABASE_URL,                         # Define a URL de conexão do PostgreSQL (Neon)
    pool_pre_ping=True,                   # Ativa pre-ping para validar conexões do pool
    pool_size=5,                          # Define tamanho do pool
    max_overflow=10,                      # Define overflow do pool
    future=True                           # Usa API futura do SQLAlchemy
)

# ======================================================
# Cria as tabelas no banco
# ======================================================
Base.metadata.create_all(bind=engine)     # Gera as tabelas conforme os modelos

# ======================================================
# Cria a fábrica de sessões
# ======================================================
SessionLocal = sessionmaker(              # Cria fábrica de sessões
    autocommit=False,                     # Desativa autocommit
    autoflush=False,                      # Desativa autoflush
    bind=engine                           # Vincula ao engine criado
)

# ======================================================
# Dependência FastAPI para injeção de sessão
# ======================================================
def get_db():                             # Define função geradora para obter sessão de banco
    db = SessionLocal()                   # Cria uma sessão do banco
    try:                                  # Abre bloco de uso normal
        yield db                          # Entrega a sessão para uso na rota
    finally:                              # Garante finalização
        db.close()                        # Fecha a sessão do banco
