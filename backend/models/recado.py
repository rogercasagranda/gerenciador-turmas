from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from datetime import datetime

from .base import Base


class Recado(Base):
    __tablename__ = "recado"
    id_recado = Column(Integer, primary_key=True, autoincrement=True)
    id_professor = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_aluno = Column(Integer, ForeignKey("aluno.id_aluno"))
    id_responsavel = Column(Integer, ForeignKey("responsavel.id_responsavel"))
    mensagem = Column(Text, nullable=False)
    data_envio = Column(DateTime, nullable=False, default=datetime.utcnow)
