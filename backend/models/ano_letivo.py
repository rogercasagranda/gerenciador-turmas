# backend/models/ano_letivo.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, Boolean

# Modelo de ano letivo
class AnoLetivo(Base):
    # Nome da tabela
    __tablename__ = "ano_letivo"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Ano
    ano = Column(Integer, nullable=False)

    # Ativo
    ativo = Column(Boolean, nullable=False, default=True)
