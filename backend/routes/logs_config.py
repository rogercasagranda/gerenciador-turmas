from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.logauditoria import LogAuditoria
from backend.models.logconfig import LogConfig
from backend.models.usuarios import Usuarios
from backend.routes.usuarios import token_data_from_request, to_canonical


class LogConfigOut(BaseModel):
    screen: str
    create_enabled: bool
    read_enabled: bool
    update_enabled: bool
    delete_enabled: bool
    updated_by: str | None = None
    updated_at: datetime

    class Config:
        from_attributes = True


class LogConfigUpdate(BaseModel):
    create_enabled: bool
    read_enabled: bool
    update_enabled: bool
    delete_enabled: bool


router = APIRouter(prefix="", tags=["ConfigLogs"])


@router.get("/logs/entidades", response_model=list[str])
def listar_entidades(request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil != "master":
        raise HTTPException(status_code=403, detail="Sem permissão para listar telas")
    telas_logs = [t[0] for t in db.query(LogAuditoria.entidade).distinct().all()]
    telas_cfg = [t[0] for t in db.query(LogConfig.screen).distinct().all()]
    return list({*telas_logs, *telas_cfg})


@router.get("/logs/config", response_model=list[LogConfigOut])
def listar_config(request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil != "master":
        raise HTTPException(status_code=403, detail="Sem permissão para configurar logs")
    rows = (
        db.query(LogConfig, Usuarios.nome)
        .outerjoin(Usuarios, LogConfig.updated_by == Usuarios.id_usuario)
        .all()
    )
    return [
        LogConfigOut(
            screen=cfg.screen,
            create_enabled=cfg.create_enabled,
            read_enabled=cfg.read_enabled,
            update_enabled=cfg.update_enabled,
            delete_enabled=cfg.delete_enabled,
            updated_by=nome,
            updated_at=cfg.updated_at,
        )
        for cfg, nome in rows
    ]


@router.put("/logs/config/all", response_model=LogConfigOut)
def atualizar_todos(data: LogConfigUpdate, request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil != "master":
        raise HTTPException(status_code=403, detail="Sem permissão para configurar logs")
    cfg = db.query(LogConfig).filter(LogConfig.screen == "__all__").first()
    if not cfg:
        cfg = LogConfig(screen="__all__")
        db.add(cfg)
    cfg.create_enabled = data.create_enabled
    cfg.read_enabled = data.read_enabled
    cfg.update_enabled = data.update_enabled
    cfg.delete_enabled = data.delete_enabled
    cfg.updated_by = token.id_usuario
    db.commit()
    db.refresh(cfg)
    nome = db.query(Usuarios.nome).filter(Usuarios.id_usuario == cfg.updated_by).scalar()
    return LogConfigOut(
        screen=cfg.screen,
        create_enabled=cfg.create_enabled,
        read_enabled=cfg.read_enabled,
        update_enabled=cfg.update_enabled,
        delete_enabled=cfg.delete_enabled,
        updated_by=nome,
        updated_at=cfg.updated_at,
    )


@router.put("/logs/config/{screen}", response_model=LogConfigOut)
def atualizar_config(screen: str, data: LogConfigUpdate, request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil != "master":
        raise HTTPException(status_code=403, detail="Sem permissão para configurar logs")
    cfg = db.query(LogConfig).filter(LogConfig.screen == screen).first()
    if not cfg:
        cfg = LogConfig(screen=screen)
        db.add(cfg)
    cfg.create_enabled = data.create_enabled
    cfg.read_enabled = data.read_enabled
    cfg.update_enabled = data.update_enabled
    cfg.delete_enabled = data.delete_enabled
    cfg.updated_by = token.id_usuario
    db.commit()
    db.refresh(cfg)
    nome = db.query(Usuarios.nome).filter(Usuarios.id_usuario == cfg.updated_by).scalar()
    return LogConfigOut(
        screen=cfg.screen,
        create_enabled=cfg.create_enabled,
        read_enabled=cfg.read_enabled,
        update_enabled=cfg.update_enabled,
        delete_enabled=cfg.delete_enabled,
        updated_by=nome,
        updated_at=cfg.updated_at,
    )
