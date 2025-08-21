from datetime import datetime
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from backend.models.logauditoria import LogAuditoria
from backend.models.logconfig import LogConfig
from backend.models.usuarios import Usuarios

BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")


def registrar_log(
    db: Session,
    id_usuario: int,
    acao: str,
    entidade: str,
    id_referencia: int | None = None,
    descricao: str | None = None,
) -> None:
    """Registra uma entrada na tabela de auditoria."""

    action = acao.lower()
    if action not in {"create", "read", "update", "delete"}:
        action = "read"

    global_cfg = db.query(LogConfig).filter(LogConfig.screen == "__all__").first()
    if global_cfg and not getattr(global_cfg, f"{action}_enabled"):
        return
    entidade_cfg = db.query(LogConfig).filter(LogConfig.screen == entidade).first()
    if entidade_cfg and not getattr(entidade_cfg, f"{action}_enabled"):
        return

    usuario = db.query(Usuarios).filter(Usuarios.id_usuario == id_usuario).first()
    email_executor = usuario.email if usuario else str(id_usuario)
    if descricao:
        descricao = f"{email_executor} {descricao}"
    else:
        descricao = email_executor

    log = LogAuditoria(
        id_usuario=id_usuario,
        acao=acao,
        entidade=entidade,
        id_referencia=id_referencia,
        descricao=descricao,
        data_evento=datetime.now(BRAZIL_TZ),
    )
    db.add(log)
    db.commit()
