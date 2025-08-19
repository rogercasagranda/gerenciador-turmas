# backend/models/aluno_responsavel.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint

# Modelo de vínculo aluno-responsável
class AlunoResponsavel(Base):
    # Nome da tabela
    __tablename__ = "aluno_responsavel"

    # Identificador
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Referência ao aluno
    aluno_id = Column(Integer, ForeignKey("aluno.id"), nullable=False)

    # Referência ao responsável
    responsavel_id = Column(Integer, ForeignKey("responsavel.id"), nullable=False)

    # Restrição de unicidade
    __table_args__ = (
        UniqueConstraint("aluno_id", "responsavel_id", name="uq_aluno_responsavel"),
    )
