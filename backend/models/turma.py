# backend/models/turma.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, String, ForeignKey


# Modelo de turma
class Turma(Base):
    # Nome da tabela
    __tablename__ = "turma"

    # Identificador (nome da coluna no banco segue padrão legado id_turma)
    id = Column("id_turma", Integer, primary_key=True, autoincrement=True)

    # Nome da turma
    nome = Column(String(255), nullable=False)

    # Referência ao ano letivo
    ano_letivo_id = Column(Integer, ForeignKey("ano_letivo.id"), nullable=False)

    # Referência ao turno
    turno_id = Column(Integer, ForeignKey("turno.id"), nullable=False)

    # Referência ao coordenador
    coordenador_id = Column(Integer, ForeignKey("professor.id"), nullable=True)
