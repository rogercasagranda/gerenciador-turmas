# backend/models/ano_letivo.py

"""Modelo ORM de ano letivo."""

# Importa Base compartilhada
from .base import Base

# Importa tipos e utilitários de coluna
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Index,
    CheckConstraint,
    func,
)


# Modelo de ano letivo
class AnoLetivo(Base):
    # Nome da tabela
    __tablename__ = "ano_letivo"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Descrição do ano letivo (única, case-insensitive)
    descricao = Column(String(120), nullable=False, index=True)

    # Data de início do período
    inicio = Column(Date, nullable=False)

    # Data de fim do período
    fim = Column(Date, nullable=False)

    # Índice único e regra de validação de datas
    __table_args__ = (
        Index("ix_ano_letivo_descricao_ci", func.lower(descricao), unique=True),
        CheckConstraint("inicio < fim", name="ck_ano_letivo_datas"),
    )
