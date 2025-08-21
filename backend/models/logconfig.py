from sqlalchemy import Column, Integer, Text, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from .base import Base


class LogConfig(Base):
    """Tabela de configuração de logs por tela."""

    __tablename__ = "log_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    screen = Column(Text, unique=True, nullable=False)
    create_enabled = Column(Boolean, nullable=False, default=False)
    read_enabled = Column(Boolean, nullable=False, default=False)
    update_enabled = Column(Boolean, nullable=False, default=False)
    delete_enabled = Column(Boolean, nullable=False, default=False)
    updated_by = Column(Integer, ForeignKey("usuarios.id_usuario"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    updated_by_user = relationship("Usuarios", foreign_keys=[updated_by])
