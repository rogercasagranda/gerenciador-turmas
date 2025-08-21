from datetime import datetime
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.permissoes import (
    Grupo,
    UsuarioGrupo,
    UsuarioPermissaoTemp,
    PermissaoStatus,
)
from backend.models.tela import Tela
from backend.models.usuarios import Usuarios as UsuariosModel
from backend.routes.usuarios import token_data_from_request, to_canonical
from backend.utils.pdf import generate_pdf
from fastapi.responses import Response

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


@router.get("/grupos/{grupo_id}/usuarios/export")
def exportar_usuarios_grupo(
    grupo_id: int,
    request: Request,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    """Exporta os usuários pertencentes a um grupo em formato PDF."""
    token = require_consultar(request)
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    query = (
        db.query(UsuariosModel)
        .join(UsuarioGrupo, UsuarioGrupo.usuario_id == UsuariosModel.id_usuario)
        .filter(UsuarioGrupo.grupo_id == grupo_id)
    )
    if q:
        termo = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(UsuariosModel.nome).like(termo),
                func.lower(UsuariosModel.email).like(termo),
                func.lower(UsuariosModel.tipo_perfil).like(termo),
            )
        )
    usuarios = query.all()

    rows = []
    for u in usuarios:
        telefone = " ".join(filter(None, [u.ddi, u.ddd, u.numero_celular]))
        rows.append([u.nome, u.email, (u.tipo_perfil or "").upper(), telefone])

    columns = ["Nome", "E-mail", "Perfil", "Celular"]
    orientation = "landscape" if len(columns) > 6 else "portrait"
    pdf_bytes = generate_pdf(
        title=f"Usuários do Grupo {grupo.nome}",
        user=token.email,
        columns=columns,
        rows=rows,
        orientation=orientation,
        logo_path=os.getenv("SYSTEM_LOGO_PATH"),
    )

    return Response(
        pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=usuarios_grupo.pdf"},
    )


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
