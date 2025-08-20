# backend/models/ano_letivo.py

"""Modelo ORM de ano letivo."""

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, String, Date


# Modelo de ano letivo
class AnoLetivo(Base):
    # Nome da tabela
    __tablename__ = "ano_letivo"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Descrição do ano letivo
    descricao = Column(String, nullable=False)

    # Data de início do período
    data_inicio = Column(Date, nullable=False)

    # Data de fim do período
    data_fim = Column(Date, nullable=False)
