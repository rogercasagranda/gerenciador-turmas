# backend/models/ano_letivo_periodo.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, Date, ForeignKey, CheckConstraint, UniqueConstraint, Index

# Modelo de período do ano letivo
class AnoLetivoPeriodo(Base):
    # Nome da tabela
    __tablename__ = "ano_letivo_periodo"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Referência ao ano letivo
    ano_letivo_id = Column(Integer, ForeignKey("ano_letivo.id"), nullable=False)

    # Data de início
    data_inicio = Column(Date, nullable=False)

    # Data de fim
    data_fim = Column(Date, nullable=False)

    # Restrições e índices
    __table_args__ = (
        CheckConstraint('data_inicio <= data_fim', name='ck_periodo_datas'),
        UniqueConstraint('ano_letivo_id', 'data_inicio', 'data_fim', name='uq_periodo_datas'),  # Garante unicidade de faixa
        Index('ix_periodo_ano_datas', 'ano_letivo_id', 'data_inicio', 'data_fim'),  # Auxilia verificação de sobreposição
    )

    # Regra de não sobreposição validada na aplicação
