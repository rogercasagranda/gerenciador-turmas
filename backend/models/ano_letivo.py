# backend/models/ano_letivo.py

"""Modelo de ano letivo com período único."""

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna e restrição
from sqlalchemy import Column, Integer, Text, Date, CheckConstraint



# Modelo de ano letivo
class AnoLetivo(Base):
    # Nome da tabela
    __tablename__ = "ano_letivo"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)


    # Descrição única do ano letivo
    descricao = Column(Text, nullable=False, unique=True)

    # Data de início do período
    data_inicio = Column(Date, nullable=False)

    # Data de fim do período
    data_fim = Column(Date, nullable=False)

    # Restrições de tabela

    __table_args__ = (
        CheckConstraint("data_inicio <= data_fim", name="ck_ano_letivo_datas"),
    )
