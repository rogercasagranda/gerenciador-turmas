from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from .base import Base


class Lancamento(Base):
    __tablename__ = "lancamento"
    id_lancamento = Column(Integer, primary_key=True, autoincrement=True)
    turma_disciplina_id = Column(
        Integer, ForeignKey("turma_disciplina.id_turma_disciplina"), nullable=False
    )
    id_aluno = Column(Integer, ForeignKey("aluno.id_aluno"), nullable=False)
    tipo = Column(String(40), nullable=False)
    valor = Column(String(40), nullable=False)
    data_lancamento = Column(DateTime, nullable=False, default=datetime.utcnow)
