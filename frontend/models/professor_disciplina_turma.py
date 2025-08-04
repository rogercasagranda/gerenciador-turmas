from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, ForeignKey

Base = declarative_base()

class ProfessorDisciplinaTurma(Base):
    __tablename__ = "professor_disciplina_turma"
    id_prof_disc_turma = Column(Integer, primary_key=True, autoincrement=True)
    id_professor = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_disciplina = Column(Integer, ForeignKey("disciplina.id_disciplina"), nullable=False)
    id_turma = Column(Integer, ForeignKey("turma.id_turma"), nullable=False)
