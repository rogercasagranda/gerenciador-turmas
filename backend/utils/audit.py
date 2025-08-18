from datetime import datetime
from sqlalchemy.orm import Session
from backend.models.logauditoria import LogAuditoria


def registrar_log(db: Session, id_usuario: int, acao: str, entidade: str, id_referencia: int | None = None, descricao: str | None = None) -> None:
    """Registra uma entrada na tabela de auditoria."""
    log = LogAuditoria(
        id_usuario=id_usuario,
        acao=acao,
        entidade=entidade,
        id_referencia=id_referencia,
        descricao=descricao,
        data_evento=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
