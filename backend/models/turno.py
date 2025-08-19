# backend/models/turno.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna e enum
from sqlalchemy import Column, Integer, Enum
from enum import Enum as PyEnum

# Enum de turnos
class TurnoNome(PyEnum):
    MANHA = "MANHA"
    TARDE = "TARDE"
    NOITE = "NOITE"

# Modelo de turno
class Turno(Base):
    # Nome da tabela
    __tablename__ = "turno"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Nome do turno
    nome = Column(Enum(TurnoNome, name="turno_enum"), nullable=False)
