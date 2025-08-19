from datetime import datetime
from sqlalchemy.orm import Session
from backend.models.logauditoria import LogAuditoria
from backend.models.logconfig import LogConfig
from backend.models.usuarios import Usuarios


def registrar_log(
    db: Session,
    id_usuario: int,
    acao: str,
    entidade: str,
    id_referencia: int | None = None,
    descricao: str | None = None,
) -> None:
    """Registra uma entrada na tabela de auditoria."""

    # Ignora ações de leitura para reduzir ruído nos logs
    if acao.upper() == "READ":
        return

    # Verifica se logging está habilitado globalmente ou para a entidade
    global_cfg = db.query(LogConfig).filter(LogConfig.entidade == "__all__").first()
    if global_cfg and not global_cfg.habilitado:
        return
    entidade_cfg = db.query(LogConfig).filter(LogConfig.entidade == entidade).first()
    if entidade_cfg and not entidade_cfg.habilitado:
        return

    # Obtém e-mail do usuário executor para detalhar o evento
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
        data_evento=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
