from datetime import datetime
from zoneinfo import ZoneInfo
import os

import os
from datetime import datetime
from io import BytesIO, StringIO
import csv

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy import func, or_, cast, String
from sqlalchemy.orm import Session
from openpyxl import Workbook

from backend.database import get_db
from backend.models.permissoes import (
    Grupo,
    UsuarioGrupo,
    GrupoPermissao,
    UsuarioPermissaoTemp,
    PermissaoStatus,
)
from backend.models.tela import Tela
from backend.models.usuarios import Usuarios as UsuariosModel
from backend.models.sessao import Sessao
from backend.routes.usuarios import token_data_from_request, to_canonical
from backend.utils.pdf import generate_pdf
from backend.schemas.permissoes_temp import PermissaoTempIn, PermissaoTempOut
from backend.schemas.grupo_permissoes import (
    GrupoOut,
    GrupoPermissaoIn,
    GrupoPermissaoOut,
)
from backend.schemas.usuarios_por_grupo import (
    UsuarioGrupoOut,
    UsuariosPorGrupoResponse,
)

BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")

router = APIRouter(prefix="/acessos", tags=["Acessos"])

FORBIDDEN_PROFILES = {"aluno", "responsavel"}


def require_consultar(request: Request):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil in FORBIDDEN_PROFILES:
        raise HTTPException(status_code=403, detail="Perfil sem acesso")
    return token


def require_admin(request: Request):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    if perfil not in {"master", "diretor"}:
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


@router.get("/grupos", response_model=list[GrupoOut])
def listar_grupos(
    request: Request,
    db: Session = Depends(get_db),
):
    require_admin(request)
    grupos = db.query(Grupo).filter(Grupo.nome != "Master").all()
    return grupos


@router.get("/usuarios-por-grupo", response_model=UsuariosPorGrupoResponse)
def usuarios_por_grupo(
    request: Request,
    group_ids: str | None = None,
    perfil: str | None = None,
    status: str | None = None,
    q: str | None = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    require_consultar(request)

    query = (
        db.query(UsuariosModel)
        .join(UsuarioGrupo, UsuarioGrupo.usuario_id == UsuariosModel.id_usuario)
    )

    if group_ids:
        ids = [int(i) for i in group_ids.split(",") if i]
        if ids:
            query = query.filter(UsuarioGrupo.grupo_id.in_(ids))

    if perfil:
        query = query.filter(
            func.lower(UsuariosModel.tipo_perfil) == to_canonical(perfil)
        )

    if status:
        ativo = status.lower() == "ativo"
        query = query.filter(UsuariosModel.ativo == ativo)

    if q:
        termo = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(UsuariosModel.nome).like(termo),
                func.lower(UsuariosModel.email).like(termo),
                cast(UsuariosModel.id_usuario, String).like(termo),
            )
        )

    total = query.distinct().count()
    usuarios = (
        query.distinct().order_by(UsuariosModel.nome)
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items: list[UsuarioGrupoOut] = []
    for u in usuarios:
        grupos = [
            g[0]
            for g in (
                db.query(Grupo.nome)
                .join(UsuarioGrupo, UsuarioGrupo.grupo_id == Grupo.id)
                .filter(UsuarioGrupo.usuario_id == u.id_usuario)
                .all()
            )
        ]
        ultimo = (
            db.query(func.max(Sessao.data_login))
            .filter(Sessao.id_usuario == u.id_usuario)
            .scalar()
        )
        items.append(
            UsuarioGrupoOut(
                id_usuario=u.id_usuario,
                nome=u.nome,
                email=u.email,
                perfil=u.tipo_perfil,
                grupos=grupos,
                ultimo_acesso=ultimo,
                status="Ativo" if u.ativo else "Inativo",
            )
        )

    return UsuariosPorGrupoResponse(items=items, total=total, page=page, limit=limit)


@router.get("/export/usuarios-por-grupo")
def exportar_usuarios_por_grupo(
    request: Request,
    format: str = "csv",
    group_ids: str | None = None,
    perfil: str | None = None,
    status: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    token = require_consultar(request)

    query = (
        db.query(UsuariosModel)
        .join(UsuarioGrupo, UsuarioGrupo.usuario_id == UsuariosModel.id_usuario)
    )

    if group_ids:
        ids = [int(i) for i in group_ids.split(",") if i]
        if ids:
            query = query.filter(UsuarioGrupo.grupo_id.in_(ids))

    if perfil:
        query = query.filter(
            func.lower(UsuariosModel.tipo_perfil) == to_canonical(perfil)
        )

    if status:
        ativo = status.lower() == "ativo"
        query = query.filter(UsuariosModel.ativo == ativo)

    if q:
        termo = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(UsuariosModel.nome).like(termo),
                func.lower(UsuariosModel.email).like(termo),
                cast(UsuariosModel.id_usuario, String).like(termo),
            )
        )

    usuarios = query.distinct().order_by(UsuariosModel.nome).all()

    rows: list[list[str]] = []
    for u in usuarios:
        grupos = [
            g[0]
            for g in (
                db.query(Grupo.nome)
                .join(UsuarioGrupo, UsuarioGrupo.grupo_id == Grupo.id)
                .filter(UsuarioGrupo.usuario_id == u.id_usuario)
                .all()
            )
        ]
        ultimo = (
            db.query(func.max(Sessao.data_login))
            .filter(Sessao.id_usuario == u.id_usuario)
            .scalar()
        )
        rows.append(
            [
                u.nome,
                u.email,
                u.tipo_perfil or "",
                ", ".join(grupos),
                ultimo.isoformat() if ultimo else "",
                "Ativo" if u.ativo else "Inativo",
            ]
        )

    columns = [
        "Nome",
        "Email",
        "Perfil",
        "Grupos",
        "Último acesso",
        "Status",
    ]

    if format == "csv":
        buf = StringIO()
        writer = csv.writer(buf)
        writer.writerow(columns)
        writer.writerows(rows)
        return Response(
            buf.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=usuarios_por_grupo.csv"},
        )
    if format == "xlsx":
        wb = Workbook()
        ws = wb.active
        ws.append(columns)
        for r in rows:
            ws.append(r)
        buf = BytesIO()
        wb.save(buf)
        return Response(
            buf.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=usuarios_por_grupo.xlsx"},
        )
    if format == "pdf":
        pdf_bytes = generate_pdf(
            title="Usuários por Grupo",
            user=token.email,
            columns=columns,
            rows=rows,
            orientation="landscape",
            logo_path=os.getenv("SYSTEM_LOGO_PATH"),
        )
        return Response(
            pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=usuarios_por_grupo.pdf"},
        )

    raise HTTPException(status_code=400, detail="Formato não suportado")


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


@router.get("/grupos/{grupo_id}/permissoes", response_model=list[GrupoPermissaoOut])
def listar_permissoes_grupo(
    grupo_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    require_admin(request)
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    perms = (
        db.query(GrupoPermissao)
        .filter(GrupoPermissao.grupo_id == grupo_id)
        .all()
    )
    return perms


@router.post("/grupos/{grupo_id}/permissoes", response_model=list[GrupoPermissaoOut])
def salvar_permissoes_grupo(
    grupo_id: int,
    permissoes: list[GrupoPermissaoIn] | GrupoPermissaoIn,
    request: Request,
    db: Session = Depends(get_db),
):
    require_admin(request)
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    if not isinstance(permissoes, list):
        permissoes = [permissoes]
    tela_ids = [p.tela_id for p in permissoes]
    telas = db.query(Tela).filter(Tela.id.in_(tela_ids)).all()
    telas_map = {t.id: t for t in telas}
    has_secretaria = (
        db.query(UsuarioGrupo)
        .join(UsuariosModel, UsuariosModel.id_usuario == UsuarioGrupo.usuario_id)
        .filter(UsuarioGrupo.grupo_id == grupo_id)
        .filter(func.lower(UsuariosModel.tipo_perfil).like("secretaria%"))
        .first()
        is not None
    )
    if has_secretaria:
        for p in permissoes:
            tela = telas_map.get(p.tela_id)
            if tela and tela.restrita_professor:
                raise HTTPException(status_code=400, detail="Tela restrita a professores")
    db.query(GrupoPermissao).filter(GrupoPermissao.grupo_id == grupo_id).delete()
    for p in permissoes:
        if p.tela_id not in telas_map:
            raise HTTPException(status_code=404, detail=f"Tela {p.tela_id} não encontrada")
        db.add(
            GrupoPermissao(
                grupo_id=grupo_id,
                tela_id=p.tela_id,
                operacoes={k: v for k, v in p.operacoes.items() if v},
            )
        )
    db.commit()
    return (
        db.query(GrupoPermissao)
        .filter(GrupoPermissao.grupo_id == grupo_id)
        .all()
    )


@router.post(
    "/usuarios/{usuario_id}/temporarias",
    response_model=list[PermissaoTempOut],
    status_code=201,
)
def criar_perm_temp(
    usuario_id: int,
    permissoes: list[PermissaoTempIn] | PermissaoTempIn,
    request: Request,
    db: Session = Depends(get_db),
):
    """Cria permissões temporárias para um usuário."""
    require_consultar(request)
    user = (
        db.query(UsuariosModel)
        .filter(UsuariosModel.id_usuario == usuario_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    perfil = to_canonical(user.tipo_perfil)
    if perfil in {"aluno", "responsavel"}:
        raise HTTPException(status_code=400, detail="Perfil não permite permissões temporárias")
    if not isinstance(permissoes, list):
        permissoes = [permissoes]
    now = datetime.now(BRAZIL_TZ)
    expiradas = (
        db.query(UsuarioPermissaoTemp)
        .filter(
            UsuarioPermissaoTemp.usuario_id == usuario_id,
            UsuarioPermissaoTemp.status == PermissaoStatus.ATIVA,
            UsuarioPermissaoTemp.fim < now,
        )
        .all()
    )
    for e in expiradas:
        e.status = PermissaoStatus.EXPIRADA
    resultados: list[PermissaoTempOut] = []
    for perm in permissoes:
        tela = db.query(Tela).filter(Tela.id == perm.tela_id).first()
        if not tela:
            raise HTTPException(status_code=404, detail=f"Tela {perm.tela_id} não encontrada")
        if perfil == "secretaria" and tela.restrita_professor:
            raise HTTPException(status_code=400, detail="Tela restrita a professores")
        if perm.fim < perm.inicio:
            raise HTTPException(status_code=400, detail="Período inválido")
        overlap = (
            db.query(UsuarioPermissaoTemp)
            .filter(
                UsuarioPermissaoTemp.usuario_id == usuario_id,
                UsuarioPermissaoTemp.tela_id == perm.tela_id,
                UsuarioPermissaoTemp.status == PermissaoStatus.ATIVA,
                UsuarioPermissaoTemp.fim >= perm.inicio,
                UsuarioPermissaoTemp.inicio <= perm.fim,
            )
            .first()
        )
        if overlap:
            raise HTTPException(status_code=400, detail="Período sobreposto")
        novo = UsuarioPermissaoTemp(
            usuario_id=usuario_id,
            tela_id=perm.tela_id,
            operacoes={k: v for k, v in perm.operacoes.items() if v},
            inicio=perm.inicio,
            fim=perm.fim,
            status=PermissaoStatus.ATIVA,
        )
        db.add(novo)
        db.flush()
        resultados.append(
            PermissaoTempOut(
                id=novo.id,
                tela_id=novo.tela_id,
                operacoes=novo.operacoes,
                inicio=novo.inicio,
                fim=novo.fim,
                status=novo.status,
            )
        )
    db.commit()
    return resultados


@router.patch(
    "/usuarios/{usuario_id}/temporarias/{perm_id}",
    response_model=PermissaoTempOut,
)
def revogar_perm_temp(
    usuario_id: int,
    perm_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    require_consultar(request)
    perm = (
        db.query(UsuarioPermissaoTemp)
        .filter(
            UsuarioPermissaoTemp.id == perm_id,
            UsuarioPermissaoTemp.usuario_id == usuario_id,
        )
        .first()
    )
    if not perm:
        raise HTTPException(status_code=404, detail="Permissão não encontrada")
    perm.status = PermissaoStatus.REVOGADA
    perm.fim = datetime.now(BRAZIL_TZ)
    db.commit()
    db.refresh(perm)
    return PermissaoTempOut.model_validate(perm)


@router.get("/usuarios/{usuario_id}/temporarias")
def listar_perm_temp(
    usuario_id: int,
    status: str = "ativas",
    request: Request = None,
    db: Session = Depends(get_db),
):
    require_consultar(request)
    now = datetime.now(BRAZIL_TZ)
    expiradas = (
        db.query(UsuarioPermissaoTemp)
        .filter(
            UsuarioPermissaoTemp.usuario_id == usuario_id,
            UsuarioPermissaoTemp.status == PermissaoStatus.ATIVA,
            UsuarioPermissaoTemp.fim < now,
        )
        .all()
    )
    for e in expiradas:
        e.status = PermissaoStatus.EXPIRADA
    if expiradas:
        db.commit()
    q = (
        db.query(UsuarioPermissaoTemp, Tela)
        .join(Tela, Tela.id == UsuarioPermissaoTemp.tela_id)
        .filter(UsuarioPermissaoTemp.usuario_id == usuario_id)
    )
    if status == "ativas":
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
