from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from zoneinfo import ZoneInfo

from .base import Base

BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")

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
    data_evento = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(BRAZIL_TZ)
    )
    ip_origem = Column(String(50))
    user_agent = Column(String)
