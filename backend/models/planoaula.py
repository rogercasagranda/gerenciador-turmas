from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from datetime import datetime

from .base import Base


class PlanoAula(Base):
    __tablename__ = "planoaula"
    id_plano = Column(Integer, primary_key=True, autoincrement=True)
    turma_disciplina_id = Column(
        Integer, ForeignKey("turma_disciplina.id_turma_disciplina"), nullable=False
    )
    descricao = Column(Text, nullable=False)
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)
