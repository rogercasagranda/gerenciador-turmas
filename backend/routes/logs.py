from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models.logauditoria import LogAuditoria
from backend.routes.usuarios import token_data_from_request, to_canonical, ALLOWED_PERFIS


class LogOut(BaseModel):
    id_log: int
    id_usuario: int
    acao: str
    entidade: str
    id_referencia: Optional[int] = None
    descricao: Optional[str] = None
    data_evento: datetime

    class Config:
        from_attributes = True


router = APIRouter(prefix="", tags=["Logs"])


@router.get("/logs", response_model=list[LogOut])
def listar_logs(
    request: Request,
    data_inicio: Optional[datetime] = None,
    data_fim: Optional[datetime] = None,
    id_usuario: Optional[int] = None,
    entidade: Optional[str] = None,
    db: Session = Depends(get_db),
):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil not in ALLOWED_PERFIS:
        raise HTTPException(status_code=403, detail="Sem permissão para acessar logs")

    query = db.query(LogAuditoria)
    if data_inicio:
        query = query.filter(LogAuditoria.data_evento >= data_inicio)
    if data_fim:
        query = query.filter(LogAuditoria.data_evento <= data_fim)
    if id_usuario:
        query = query.filter(LogAuditoria.id_usuario == id_usuario)
    if entidade:
        query = query.filter(LogAuditoria.entidade == entidade)
    return query.order_by(LogAuditoria.data_evento.desc()).all()
