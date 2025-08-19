from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime

# Reuse the same declarative base as the Usuarios model so that the
# metadata includes both tables and SQLAlchemy can resolve the foreign
# key correctly.
from backend.models.usuarios import Base

class LogAuditoria(Base):
    __tablename__ = "logauditoria"
    id_log = Column(Integer, primary_key=True, autoincrement=True)
    # Reference the "usuarios" table (plural) – the actual table name in the
    # database – to avoid "NoReferencedTableError" during flush/commit.
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    acao = Column(String(50), nullable=False)
    entidade = Column(String(80), nullable=False)
    id_referencia = Column(Integer)
    descricao = Column(Text)
    data_evento = Column(DateTime, nullable=False, default=datetime.utcnow)
    ip_origem = Column(String(50))
    user_agent = Column(String)
