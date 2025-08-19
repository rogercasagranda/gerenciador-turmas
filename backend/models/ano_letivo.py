# backend/models/ano_letivo.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, String, Date, CheckConstraint

# Modelo de ano letivo
class AnoLetivo(Base):
    # Nome da tabela
    __tablename__ = "ano_letivo"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Descrição
    descricao = Column(String(100), nullable=False, unique=True)

    # Data de início
    data_inicio = Column(Date, nullable=False)

    # Data de fim
    data_fim = Column(Date, nullable=False)

    # Restrição de datas
    __table_args__ = (
        CheckConstraint("data_inicio <= data_fim", name="ck_ano_letivo_datas"),
    )
