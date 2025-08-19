# backend/models/disciplina.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, String

# Modelo de disciplina
class Disciplina(Base):
    # Nome da tabela
    __tablename__ = "disciplina"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Nome da disciplina
    nome = Column(String(255), nullable=False)

    # Carga horária
    carga_horaria = Column(Integer, nullable=False)
