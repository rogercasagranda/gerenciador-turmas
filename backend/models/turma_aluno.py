# backend/models/turma_aluno.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, ForeignKey, Date


# Modelo de vínculo turma-aluno
class TurmaAluno(Base):
    # Nome da tabela
    __tablename__ = "turma_aluno"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Referência à turma (FK ajustada para coluna legada id_turma)
    turma_id = Column(Integer, ForeignKey("turma.id_turma"), nullable=False)

    # Referência ao aluno
    aluno_id = Column(Integer, ForeignKey("aluno.id"), nullable=False)

    # Data de matrícula
    dt_matricula = Column(Date, nullable=False)
