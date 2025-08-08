# backend/models/usuarios.py

# Importa o declarative_base para modelos ORM
from sqlalchemy.ext.declarative import declarative_base

# Importa os tipos de coluna do SQLAlchemy
from sqlalchemy import Column, Integer, String, Boolean, DateTime

# Importa datetime para timestamps
from datetime import datetime

# Cria a base para os modelos
Base = declarative_base()

# ✅ Define o modelo oficial de usuário
class Usuarios(Base):
    # ✅ Nome real da tabela no banco (em plural)
    __tablename__ = "usuarios"

    # ID do usuário (chave primária)
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)

    # Nome completo do usuário
    nome = Column(String(120), nullable=False)

    # E-mail único (usado no login)
    email = Column(String(120), nullable=False, unique=True)

    # Hash da senha (bcrypt)
    senha_hash = Column(String(256), nullable=False)

    # Perfil (ex: ADMIN, PROFESSOR, etc)
    tipo_perfil = Column(String(30), nullable=False)

    # Ativo ou não (booleano)
    ativo = Column(Boolean, nullable=False, default=True)

    # Timestamp de criação do usuário
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)
