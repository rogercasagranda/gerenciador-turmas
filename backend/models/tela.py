from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, text

from .base import Base


class Tela(Base):
    """Tabela de telas oficiais do frontend."""

    __tablename__ = "telas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False, unique=True)
    path = Column(String(255), nullable=False, unique=True)
    restrita_professor = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    ativo = Column(Boolean, nullable=False, default=True, server_default=text("true"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
