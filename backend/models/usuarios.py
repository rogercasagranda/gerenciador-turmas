# backend/models/usuarios.py

# Importa os tipos de coluna do SQLAlchemy
from sqlalchemy import Column, Integer, String, Boolean, DateTime

# Importa datetime para timestamps
from datetime import datetime

# Importa a base compartilhada dos modelos
from .base import Base

# ✅ Define o modelo oficial de usuário
class Usuarios(Base):
    # Define o nome real da tabela no banco (em plural)
    __tablename__ = "usuarios"

    # ID do usuário (chave primária)
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)

    # Nome completo do usuário
    nome = Column(String(120), nullable=False)

    # E-mail único (usado no login)
    email = Column(String(120), nullable=False, unique=True)

    # Hash da senha (bcrypt) – permite nulo quando login for apenas Google
    senha_hash = Column(String(256), nullable=True)

    # Perfil (ex: ADMIN, PROFESSOR, DIREÇÃO, etc)
    tipo_perfil = Column(String(30), nullable=False)

    # Ativo ou não (booleano)
    ativo = Column(Boolean, nullable=False, default=True)

    # DDI do telefone (ex: 55)
    ddi = Column(String(5), nullable=False, default="55")

    # DDD do telefone (ex: 54)
    ddd = Column(String(5), nullable=False, default="54")

    # Número de celular
    numero_celular = Column(String(20), nullable=False)

    # ID do Google (login via OAuth) – opcional
    google_id = Column(String(255), nullable=True)

    # Flag de usuário master
    is_master = Column(Boolean, nullable=False, default=False)

    # Timestamp de criação do usuário
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Timestamp de atualização do usuário
    atualizado_em = Column(DateTime, nullable=True, default=None)
