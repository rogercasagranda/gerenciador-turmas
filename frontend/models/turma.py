from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text, ForeignKey

Base = declarative_base()

class Turma(Base):
    __tablename__ = "turma"
    id_turma = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(120), nullable=False)
    descricao = Column(Text)
    ano_letivo = Column(String(10), nullable=False)
    id_diretor = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
