from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey

Base = declarative_base()

class AlunoResponsavel(Base):
    __tablename__ = "aluno_responsavel"
    id_aluno_responsavel = Column(Integer, primary_key=True, autoincrement=True)
    id_aluno = Column(Integer, ForeignKey("aluno.id_aluno"), nullable=False)
    id_responsavel = Column(Integer, ForeignKey("responsavel.id_responsavel"), nullable=False)
    tipo_vinculo = Column(String(40), nullable=False)
