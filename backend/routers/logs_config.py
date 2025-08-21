from datetime import datetime
import json
from typing import List

from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.routes.usuarios import token_data_from_request, to_canonical
from backend.models.logconfig import LogConfig
from backend.models.logauditoria import LogAuditoria
from backend.models.usuarios import Usuarios
from backend.schemas.logs_config import LogConfigIn, LogConfigOut
from backend.utils.audit import registrar_log

router = APIRouter(prefix="/logs", tags=["LogsConfig"])


def _known_screens(db: Session) -> List[str]:
    logs = [r[0] for r in db.query(LogAuditoria.entidade).distinct().all()]
    cfg = [r[0] for r in db.query(LogConfig.screen).distinct().all()]
    return sorted(set(logs + cfg))


@router.get("/config/screens")
def listar_telas(request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil not in {"master", "diretor"}:
        raise HTTPException(status_code=403, detail="Sem permissão para listar telas")
    telas = _known_screens(db)
    return [{"key": t, "label": t.replace("/", " > ")} for t in telas]


@router.get("/config", response_model=LogConfigOut)
def obter_config(screen: str, request: Request, db: Session = Depends(get_db)):
    token_data_from_request(request)
    row = (
        db.query(LogConfig, Usuarios.nome)
        .outerjoin(Usuarios, Usuarios.id_usuario == LogConfig.updated_by)
        .filter(LogConfig.screen == screen)
        .first()
    )
    if row:
        cfg, nome = row
        return LogConfigOut(
            screen=cfg.screen,
            create=cfg.create,
            read=cfg.read,
            update=cfg.update,
            delete=cfg.delete,
            updated_at=cfg.updated_at,
            updated_by_name=nome or "—",
        )
    return LogConfigOut(
        screen=screen,
        create=False,
        read=False,
        update=False,
        delete=False,
        updated_at=None,
        updated_by_name="—",
    )


@router.put("/config", response_model=LogConfigOut)
def atualizar_config(payload: LogConfigIn, request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil not in {"master", "diretor"}:
        raise HTTPException(status_code=403, detail="Sem permissão para configurar logs")

    telas = _known_screens(db) if payload.applyAll else [payload.screen]
    now = datetime.utcnow()
    before_after = []
    for tela in telas:
        cfg = db.query(LogConfig).filter(LogConfig.screen == tela).first()
        if cfg:
            before = {
                "create": cfg.create,
                "read": cfg.read,
                "update": cfg.update,
                "delete": cfg.delete,
            }
            cfg.create = payload.create
            cfg.read = payload.read
            cfg.update = payload.update
            cfg.delete = payload.delete
            cfg.updated_at = now
            cfg.updated_by = token.id_usuario
            after = {
                "create": cfg.create,
                "read": cfg.read,
                "update": cfg.update,
                "delete": cfg.delete,
            }
        else:
            before = {"create": False, "read": False, "update": False, "delete": False}
            cfg = LogConfig(
                screen=tela,
                create=payload.create,
                read=payload.read,
                update=payload.update,
                delete=payload.delete,
                updated_at=now,
                updated_by=token.id_usuario,
            )
            db.add(cfg)
            after = {
                "create": cfg.create,
                "read": cfg.read,
                "update": cfg.update,
                "delete": cfg.delete,
            }
        before_after.append((tela, before, after))
    db.commit()
    for tela, before, after in before_after:
        registrar_log(
            db,
            token.id_usuario,
            "UPDATE",
            "log_config",
            descricao=f"{tela} {json.dumps(before, sort_keys=True)}→{json.dumps(after, sort_keys=True)}",
        )

    return obter_config(payload.screen, request, db)


@router.get("/summary")
def resumo(
    request: Request,
    page: int = 1,
    pageSize: int = 20,
    screen: str | None = None,
    action: str | None = None,
    onlyActive: bool = False,
    db: Session = Depends(get_db),
):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil not in {"master", "diretor"}:
        raise HTTPException(status_code=403, detail="Sem permissão para acessar visão geral de logs")
    telas = _known_screens(db)
    rows = (
        db.query(LogConfig, Usuarios.nome)
        .outerjoin(Usuarios, Usuarios.id_usuario == LogConfig.updated_by)
        .all()
    )
    mapa = {cfg.screen: (cfg, nome) for cfg, nome in rows}
    itens = []
    for tela in telas:
        cfg, nome = mapa.get(tela, (None, None))
        create = cfg.create if cfg else False
        read = cfg.read if cfg else False
        update = cfg.update if cfg else False
        delete = cfg.delete if cfg else False
        updated_at = cfg.updated_at if cfg else None
        updated_by_name = nome or "—"
        if screen and screen.lower() not in tela.lower():
            continue
        if action and not locals()[action.lower()]:
            continue
        if onlyActive and not (create or read or update or delete):
            continue
        itens.append(
            {
                "screen": tela,
                "CREATE": create,
                "READ": read,
                "UPDATE": update,
                "DELETE": delete,
                "updated_by_name": updated_by_name,
                "updated_at": updated_at,
            }
        )
    total = len(itens)
    inicio = (page - 1) * pageSize
    fim = inicio + pageSize
    return {
        "page": page,
        "pageSize": pageSize,
        "total": total,
        "items": itens[inicio:fim],
    }
