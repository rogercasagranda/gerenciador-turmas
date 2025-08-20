from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime

from .base import Base


class Sessao(Base):
    __tablename__ = "sessao"
    id_sessao = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    token_jwt = Column(String(256), nullable=False)
    data_login = Column(DateTime, nullable=False, default=datetime.utcnow)
    data_expiracao = Column(DateTime, nullable=False)
    ip_origem = Column(String(50))
    user_agent = Column(String)
    manter_conectado = Column(Boolean, nullable=False, default=False)
    data_logout = Column(DateTime)
    status = Column(String(20), nullable=False)
