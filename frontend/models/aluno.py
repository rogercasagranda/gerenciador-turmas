from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey

Base = declarative_base()

class Aluno(Base):
    __tablename__ = "aluno"
    id_aluno = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    matricula = Column(String(40), nullable=False)
    id_turma = Column(Integer, ForeignKey("turma.id_turma"))
