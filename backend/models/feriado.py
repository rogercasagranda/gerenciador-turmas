# backend/models/feriado.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, Date, Text, Enum, ForeignKey, UniqueConstraint

# Modelo de feriado
class Feriado(Base):
    # Nome da tabela
    __tablename__ = "feriado"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Referência ao ano letivo
    ano_letivo_id = Column(Integer, ForeignKey("ano_letivo.id"), nullable=False)

    # Data do feriado
    data = Column(Date, nullable=False)

    # Descrição
    descricao = Column(Text, nullable=False)

    # Origem do feriado
    origem = Column(Enum("ESCOLA", "NACIONAL", name="origem_feriado_enum"), nullable=False)

    # Restrição de unicidade
    __table_args__ = (
        UniqueConstraint('ano_letivo_id', 'data', 'origem', name='uq_feriado_ano_data_origem'),
    )
