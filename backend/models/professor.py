# backend/models/professor.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, ForeignKey, Text

# Modelo de professor
class Professor(Base):
    # Nome da tabela
    __tablename__ = "professor"

    # Identificador
    id_professor = Column(Integer, primary_key=True, autoincrement=True)

    # Referência ao usuário
    user_id = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)

    # Área de atuação
    area_atuacao = Column(Text, nullable=True)
