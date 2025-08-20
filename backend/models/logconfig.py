from sqlalchemy import Column, String, Boolean

from .base import Base


class LogConfig(Base):
    """Tabela de configuração de logs por tela."""

    __tablename__ = "logconfig"

    entidade = Column(String(80), primary_key=True)
    habilitado = Column(Boolean, nullable=False, default=True)
