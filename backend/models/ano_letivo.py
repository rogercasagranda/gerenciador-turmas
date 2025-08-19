# backend/models/ano_letivo.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, Date, Boolean, CheckConstraint

# Modelo de ano letivo
class AnoLetivo(Base):
    # Nome da tabela
    __tablename__ = "ano_letivo"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Ano
    ano = Column(Integer, nullable=False)

    # Data de início
    data_inicio = Column(Date, nullable=False)

    # Data de fim
    data_fim = Column(Date, nullable=False)

    # Ativo
    ativo = Column(Boolean, nullable=False, default=True)

    # Validação de datas
    __table_args__ = (
        CheckConstraint('data_inicio <= data_fim', name='ck_ano_letivo_datas'),
    )
