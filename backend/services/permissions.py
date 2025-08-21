from __future__ import annotations

from datetime import datetime
from typing import Dict

from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
from zoneinfo import ZoneInfo

from backend.models import (
    PerfilEnum,
    PerfilWhitelist,
    PermissaoStatus,
    Tela,
    UsuarioGrupo,
    GrupoPermissao,
    UsuarioPermissaoTemp,
)
import os
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
import logging

logger = logging.getLogger(__name__)

BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")
OPERATIONS = ["view", "create", "update", "delete", "export"]

CANON_TO_ENUM = {
    "master": PerfilEnum.MASTER,
    "diretor": PerfilEnum.DIRETOR,
    "coordenador": PerfilEnum.COORDENADOR,
    "secretaria": PerfilEnum.SECRETARIA,
    "professor": PerfilEnum.PROFESSOR,
    "aluno": PerfilEnum.ALUNO,
    "responsavel": PerfilEnum.RESPONSAVEL,
}


SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")
ALGORITHM = "HS256"


class TokenData(BaseModel):
    id_usuario: int
    email: EmailStr
    tipo_perfil: str | None = None


def to_canonical(perfil: str | None) -> str:
    p = (perfil or "").strip().lower()
    if p.startswith("diretor"):
        return "diretor"
    if p.startswith("coordenador"):
        return "coordenador"
    if p.startswith("professor"):
        return "professor"
    if p in {"aluno", "aluna"}:
        return "aluno"
    return p


def token_data_from_request(request: Request) -> TokenData:
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Token ausente.")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        id_usuario = payload.get("id_usuario")
        tipo_perfil = payload.get("tipo_perfil")
        if sub is None or id_usuario is None:
            raise HTTPException(status_code=401, detail="Token inválido.")
        return TokenData(id_usuario=int(id_usuario), email=str(sub), tipo_perfil=tipo_perfil)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido.")

def _active_override(db: Session, user_id: int, tela_id: int) -> Dict[str, bool] | None:
    now = datetime.now(BRAZIL_TZ)
    q = (
        db.query(UsuarioPermissaoTemp)
        .filter(
            UsuarioPermissaoTemp.usuario_id == user_id,
            UsuarioPermissaoTemp.tela_id == tela_id,
            UsuarioPermissaoTemp.status == PermissaoStatus.ATIVA,
        )
        .all()
    )
    updated = False
    for p in q:
        fim = p.fim
        if (
            fim.hour == 0
            and fim.minute == 0
            and fim.second == 0
            and fim.microsecond == 0
        ):
            fim = fim.replace(hour=23, minute=59, second=59)
        if now > fim:
            p.status = PermissaoStatus.EXPIRADA
            updated = True
            continue
        if p.inicio <= now <= fim:
            if updated:
                db.commit()
            return p.operacoes or {}
    if updated:
        db.commit()
    return None

def has_permission(
    db: Session, user_id: int, perfil: str, tela_path: str, operation: str
) -> tuple[bool, str]:
    perfil = to_canonical(perfil)
    if perfil == "master":
        return True, "master"

    tela = db.query(Tela).filter(Tela.path == tela_path, Tela.ativo == True).first()
    if not tela:
        if perfil == "diretor":
            return True, "perfil_default"
        return False, "default"

    op = operation.lower()

    if perfil in {"aluno", "responsavel"}:
        enum_val = CANON_TO_ENUM.get(perfil)
        wl = (
            db.query(PerfilWhitelist)
            .filter(
                PerfilWhitelist.perfil == enum_val,
                PerfilWhitelist.tela_id == tela.id,
            )
            .first()
        )
        allowed = bool(wl and wl.operacoes.get(op))
        if not allowed:
            return False, "perfil_whitelist"
        override = _active_override(db, user_id, tela.id)
        if override and op in override:
            return (bool(override[op]), "override")
        return True, "whitelist"

    if perfil == "secretaria" and tela.restrita_professor:
        return False, "restrita_professor"

    override = _active_override(db, user_id, tela.id)
    if override and op in override:
        return (bool(override[op]), "override")

    grp = (
        db.query(GrupoPermissao)
        .join(UsuarioGrupo, UsuarioGrupo.grupo_id == GrupoPermissao.grupo_id)
        .filter(
            UsuarioGrupo.usuario_id == user_id,
            GrupoPermissao.tela_id == tela.id,
        )
        .all()
    )
    for g in grp:
        if g.operacoes.get(op):
            return True, "grupo"
    if perfil == "diretor":
        return True, "perfil_default"
    return False, "default"

def get_effective_permissions(db: Session, user_id: int, perfil: str) -> Dict[str, Dict[str, bool]]:
    perfil = to_canonical(perfil)
    telas = db.query(Tela).filter(Tela.ativo == True).all()
    perms: Dict[str, Dict[str, bool]] = {}
    for tela in telas:
        tela_perms = {}
        for op in OPERATIONS:
            allow, _ = has_permission(db, user_id, perfil, tela.path, op)
            tela_perms[op] = allow
        perms[tela.path] = tela_perms
    return perms

def log_denied(user_id: int, perfil: str, path: str, operacao: str, motivo: str) -> None:
    ts = datetime.now(BRAZIL_TZ).isoformat()
    logger.warning(
        "DENY user=%s perfil=%s path=%s op=%s motivo=%s ts=%s",
        user_id,
        perfil,
        path,
        operacao,
        motivo,
        ts,
    )

def check_permission(
    request: Request,
    db: Session,
    tela_path: str,
    operation: str,
):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)
    allowed, motivo = has_permission(db, token.id_usuario, perfil, tela_path, operation)
    if not allowed:
        log_denied(token.id_usuario, perfil, tela_path, operation, motivo)
        raise HTTPException(status_code=403, detail="Sem permissão")
    return token
