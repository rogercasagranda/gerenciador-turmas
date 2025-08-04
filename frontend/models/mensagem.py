from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from datetime import datetime

Base = declarative_base()

class Mensagem(Base):
    __tablename__ = "mensagem"
    id_mensagem = Column(Integer, primary_key=True, autoincrement=True)
    id_remetente = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_destinatario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    mensagem = Column(Text, nullable=False)
    data_envio = Column(DateTime, nullable=False, default=datetime.utcnow)
