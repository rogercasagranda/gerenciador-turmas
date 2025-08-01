from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

Base = declarative_base()

class Lancamento(Base):
    __tablename__ = "lancamento"
    id_lancamento = Column(Integer, primary_key=True, autoincrement=True)
    id_prof_disc_turma = Column(Integer, ForeignKey("professor_disciplina_turma.id_prof_disc_turma"), nullable=False)
    id_aluno = Column(Integer, ForeignKey("aluno.id_aluno"), nullable=False)
    tipo = Column(String(40), nullable=False)
    valor = Column(String(40), nullable=False)
    data_lancamento = Column(DateTime, nullable=False, default=datetime.utcnow)
