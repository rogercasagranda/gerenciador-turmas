# backend/models/horario.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna e enum
from sqlalchemy import Column, Integer, ForeignKey, Time, Enum
from enum import Enum as PyEnum


# Enum de dias da semana
class DiaSemana(PyEnum):
    SEG = "SEG"
    TER = "TER"
    QUA = "QUA"
    QUI = "QUI"
    SEX = "SEX"
    SAB = "SAB"


# Modelo de horário
class Horario(Base):
    # Nome da tabela
    __tablename__ = "horario"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Referência à turma (FK ajustada para coluna legada id_turma)
    turma_id = Column(Integer, ForeignKey("turma.id_turma"), nullable=False)

    # Dia da semana
    dia_semana = Column(Enum(DiaSemana, name="dia_semana_enum"), nullable=False)

    # Hora inicial
    hora_inicio = Column(Time, nullable=False)

    # Hora final
    hora_fim = Column(Time, nullable=False)
