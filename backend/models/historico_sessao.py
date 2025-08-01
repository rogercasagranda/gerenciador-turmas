from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime

Base = declarative_base()

class HistoricoSessao(Base):
    __tablename__ = "historico_sessao"
    id_historico_sessao = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_sessao = Column(Integer, ForeignKey("sessao.id_sessao"))
    acao = Column(String(40), nullable=False)
    data_evento = Column(DateTime, nullable=False, default=datetime.utcnow)
    ip_origem = Column(String(50))
    user_agent = Column(String)
    detalhe = Column(Text)
