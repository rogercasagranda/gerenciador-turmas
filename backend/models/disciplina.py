from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text

Base = declarative_base()

class Disciplina(Base):
    __tablename__ = "disciplina"
    id_disciplina = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(120), nullable=False)
    descricao = Column(Text)
