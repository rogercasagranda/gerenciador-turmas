# backend/models/aluno.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, ForeignKey, Text

# Modelo de aluno
class Aluno(Base):
    # Nome da tabela
    __tablename__ = "aluno"

    # Identificador (nome da coluna no banco segue padrão legado id_aluno)
    id_aluno = Column(Integer, primary_key=True, autoincrement=True)

    # Referência ao usuário
    user_id = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)

    # Registro acadêmico
    ra = Column(Text, unique=True, nullable=True)
