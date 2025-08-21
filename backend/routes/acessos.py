from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.permissoes import (
    Grupo,
    UsuarioGrupo,
    UsuarioPermissaoTemp,
    PermissaoStatus,
)
from backend.models.tela import Tela
from backend.routes.usuarios import token_data_from_request, to_canonical

router = APIRouter(prefix="/acessos", tags=["Acessos"])

FORBIDDEN_PROFILES = {"aluno", "responsavel"}


def require_consultar(request: Request):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil in FORBIDDEN_PROFILES:
        raise HTTPException(status_code=403, detail="Perfil sem acesso")
    return token


@router.get("/usuarios/{usuario_id}/grupos", response_model=list[str])
def listar_grupos_usuario(
    usuario_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    require_consultar(request)
    grupos = (
        db.query(Grupo.nome)
        .join(UsuarioGrupo, UsuarioGrupo.grupo_id == Grupo.id)
        .filter(UsuarioGrupo.usuario_id == usuario_id)
        .all()
    )
    return [g[0] for g in grupos]


class PermissaoTempOut(dict):
    tela: str
    operacoes: dict
    inicio: datetime
    fim: datetime
    status: str


@router.get("/usuarios/{usuario_id}/temporarias")
def listar_perm_temp(
    usuario_id: int,
    status: str = "ativas",
    request: Request = None,
    db: Session = Depends(get_db),
):
    require_consultar(request)
    q = (
        db.query(UsuarioPermissaoTemp, Tela)
        .join(Tela, Tela.id == UsuarioPermissaoTemp.tela_id)
        .filter(UsuarioPermissaoTemp.usuario_id == usuario_id)
    )
    if status == "ativas":
        now = datetime.utcnow()
        q = q.filter(
            UsuarioPermissaoTemp.status == PermissaoStatus.ATIVA,
            UsuarioPermissaoTemp.inicio <= now,
            UsuarioPermissaoTemp.fim >= now,
        )
    perms = []
    for perm, tela in q.all():
        perms.append(
            {
                "tela": tela.path,
                "operacoes": perm.operacoes,
                "inicio": perm.inicio,
                "fim": perm.fim,
                "status": perm.status.value,
            }
        )
    return perms


@router.get("/export/usuario-temporarias")
def export_usuario_temporarias(
    usuario_id: int,
    status: str = "ativas",
    format: str = "csv",
    request: Request = None,
    db: Session = Depends(get_db),
):
    from io import StringIO
    import csv
    from fastapi.responses import Response

    require_consultar(request)
    dados = listar_perm_temp(usuario_id, status, request, db)
    if format != "csv":
        raise HTTPException(status_code=400, detail="Formato não suportado")
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Tela", "Operacoes", "Inicio", "Fim", "Status"])
    for p in dados:
        writer.writerow([
            p["tela"],
            ",".join(p["operacoes"].keys()),
            p["inicio"].isoformat(),
            p["fim"].isoformat(),
            p["status"],
        ])
    content = output.getvalue()
    return Response(
        content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=temporarias.csv"},
    )
