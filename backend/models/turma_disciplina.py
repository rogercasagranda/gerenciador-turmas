# backend/models/turma_disciplina.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint


# Modelo de ligação turma-disciplina
class TurmaDisciplina(Base):
    # Nome da tabela
    __tablename__ = "turma_disciplina"

    # Identificador
    id_turma_disciplina = Column(Integer, primary_key=True, autoincrement=True)

    # Referência à turma (FK ajustada para coluna legada id_turma)
    turma_id = Column(Integer, ForeignKey("turma.id_turma"), nullable=False)

    # Referência à disciplina
    disciplina_id = Column(Integer, ForeignKey("disciplina.id_disciplina"), nullable=False)

    # Referência ao professor responsável
    professor_responsavel_id = Column(
        Integer, ForeignKey("professor.id_professor"), nullable=False
    )

    # Restrição de unicidade
    __table_args__ = (
        UniqueConstraint("turma_id", "disciplina_id", name="uq_turma_disciplina"),
    )
