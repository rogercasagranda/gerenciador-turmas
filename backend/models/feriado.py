# backend/models/feriado.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, Date, Text

# Modelo de feriado
class Feriado(Base):
    # Nome da tabela
    __tablename__ = "feriado"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Data do feriado
    data = Column(Date, nullable=False)

    # Descrição
    descricao = Column(Text, nullable=True)
