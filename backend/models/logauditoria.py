from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime

Base = declarative_base()

class LogAuditoria(Base):
    __tablename__ = "logauditoria"
    id_log = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    acao = Column(String(50), nullable=False)
    entidade = Column(String(80), nullable=False)
    id_referencia = Column(Integer)
    descricao = Column(Text)
    data_evento = Column(DateTime, nullable=False, default=datetime.utcnow)
    ip_origem = Column(String(50))
    user_agent = Column(String)
