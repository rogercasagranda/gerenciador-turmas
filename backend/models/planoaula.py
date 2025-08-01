from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from datetime import datetime

Base = declarative_base()

class PlanoAula(Base):
    __tablename__ = "planoaula"
    id_plano = Column(Integer, primary_key=True, autoincrement=True)
    id_prof_disc_turma = Column(Integer, ForeignKey("professor_disciplina_turma.id_prof_disc_turma"), nullable=False)
    descricao = Column(Text, nullable=False)
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)
