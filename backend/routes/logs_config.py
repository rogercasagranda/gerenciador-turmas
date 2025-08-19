from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.logauditoria import LogAuditoria
from backend.models.logconfig import LogConfig
from backend.routes.usuarios import token_data_from_request, to_canonical


class LogConfigOut(BaseModel):
    entidade: str
    habilitado: bool

    class Config:
        from_attributes = True


class LogConfigUpdate(BaseModel):
    habilitado: bool


router = APIRouter(prefix="", tags=["ConfigLogs"])


@router.get("/logs/entidades", response_model=list[str])
def listar_entidades(request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil != "master":
        raise HTTPException(status_code=403, detail="Sem permissão para listar telas")
    telas_logs = [t[0] for t in db.query(LogAuditoria.entidade).distinct().all()]
    telas_cfg = [t[0] for t in db.query(LogConfig.entidade).distinct().all()]
    return list({*telas_logs, *telas_cfg})


@router.get("/logs/config", response_model=list[LogConfigOut])
def listar_config(request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil != "master":
        raise HTTPException(status_code=403, detail="Sem permissão para configurar logs")
    return db.query(LogConfig).all()


@router.put("/logs/config/all")
def atualizar_todos(data: LogConfigUpdate, request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil != "master":
        raise HTTPException(status_code=403, detail="Sem permissão para configurar logs")
    cfg = db.query(LogConfig).filter(LogConfig.entidade == "__all__").first()
    if cfg:
        cfg.habilitado = data.habilitado
    else:
        cfg = LogConfig(entidade="__all__", habilitado=data.habilitado)
        db.add(cfg)
    db.commit()
    return {"habilitado": cfg.habilitado}


@router.put("/logs/config/{entidade}")
def atualizar_config(entidade: str, data: LogConfigUpdate, request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil != "master":
        raise HTTPException(status_code=403, detail="Sem permissão para configurar logs")
    cfg = db.query(LogConfig).filter(LogConfig.entidade == entidade).first()
    if cfg:
        cfg.habilitado = data.habilitado
    else:
        cfg = LogConfig(entidade=entidade, habilitado=data.habilitado)
        db.add(cfg)
    db.commit()
    return {"entidade": entidade, "habilitado": cfg.habilitado}


@router.delete("/logs")
def excluir_logs(
    request: Request,
    data_inicio: datetime | None = None,
    data_fim: datetime | None = None,
    db: Session = Depends(get_db),
):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil != "master":
        raise HTTPException(status_code=403, detail="Sem permissão para excluir logs")
    query = db.query(LogAuditoria)
    if data_inicio:
        query = query.filter(LogAuditoria.data_evento >= data_inicio)
    if data_fim:
        query = query.filter(LogAuditoria.data_evento <= data_fim)
    removidos = query.delete()
    db.commit()
    return {"removidos": removidos}
