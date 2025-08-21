from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from datetime import datetime
from zoneinfo import ZoneInfo

from .base import Base

BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")


class LogConfigScreen(Base):
    """Tabela de configuração de logs por tela com flags CRUD."""

    __tablename__ = "log_config"

    screen = Column(String(120), primary_key=True)
    create = Column(Boolean, nullable=False, default=False)
    read = Column(Boolean, nullable=False, default=False)
    update = Column(Boolean, nullable=False, default=False)
    delete = Column(Boolean, nullable=False, default=False)
    updated_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(BRAZIL_TZ)
    )
    updated_by = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
