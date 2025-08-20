# backend/models/responsavel.py

# Importa Base compartilhada
from .base import Base

# Importa tipos de coluna
from sqlalchemy import Column, Integer, ForeignKey, Text

# Modelo de responsável
class Responsavel(Base):
    # Nome da tabela
    __tablename__ = "responsavel"

    # Identificador
    id_responsavel = Column(Integer, primary_key=True, autoincrement=True)

    # Referência ao usuário
    user_id = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)

    # Parentesco
    parentesco = Column(Text, nullable=True)
