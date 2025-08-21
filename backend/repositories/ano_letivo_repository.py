"""Operações de acesso a dados para ``AnoLetivo``."""

from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.ano_letivo import AnoLetivo
from backend.utils.audit import registrar_log


# ---------------------------------------------------------------------------
# Funções de consulta
# ---------------------------------------------------------------------------

def get_all(db: Session):
    """Retorna todos os anos letivos em ordem decrescente de início."""
    return db.query(AnoLetivo).order_by(AnoLetivo.inicio.desc()).all()


def get_by_id(db: Session, id: int):
    """Busca ano letivo pelo identificador."""
    return db.get(AnoLetivo, id)


def get_by_descricao_ci(db: Session, descricao: str):
    """Busca por descrição ignorando caixa."""
    return (
        db.query(AnoLetivo)
        .filter(func.lower(AnoLetivo.descricao) == descricao.strip().lower())
        .first()
    )


# ---------------------------------------------------------------------------
# Funções de escrita
# ---------------------------------------------------------------------------

def _extract_payload(dto: Any) -> dict:
    """Converte o DTO em ``dict`` independente do tipo."""
    return dto.dict() if hasattr(dto, "dict") else dict(dto)


def create(db: Session, dto: Any, user_id: int, perfil: str):
    """Cria um novo ano letivo após validar regras."""
    data = _extract_payload(dto)
    descricao = data["descricao"].strip()
    inicio = data["inicio"]
    fim = data["fim"]

    if inicio >= fim:
        raise ValueError("inicio deve ser menor que fim")
    if get_by_descricao_ci(db, descricao):
        raise ValueError("descricao já cadastrada")

    ano = AnoLetivo(descricao=descricao, inicio=inicio, fim=fim)
    db.add(ano)
    db.commit()
    db.refresh(ano)

    registrar_log(
        db,
        user_id,
        "CREATE",
        "ano_letivo",
        ano.id,
        f"{perfil} criou ano letivo {descricao} ({inicio} a {fim})",
    )
    return ano


def update(db: Session, id: int, dto: Any, user_id: int, perfil: str):
    """Atualiza um ano letivo existente."""
    ano = get_by_id(db, id)
    if not ano:
        raise ValueError("Ano letivo não encontrado")

    data = _extract_payload(dto)
    if "descricao" in data and data["descricao"] is not None:
        nova_descricao = data["descricao"].strip()
        existente = (
            db.query(AnoLetivo)
            .filter(func.lower(AnoLetivo.descricao) == nova_descricao.lower(), AnoLetivo.id != id)
            .first()
        )
        if existente:
            raise ValueError("descricao já cadastrada")
        ano.descricao = nova_descricao
    if "inicio" in data and data["inicio"] is not None:
        ano.inicio = data["inicio"]
    if "fim" in data and data["fim"] is not None:
        ano.fim = data["fim"]

    if ano.inicio >= ano.fim:
        raise ValueError("inicio deve ser menor que fim")

    db.commit()
    db.refresh(ano)

    registrar_log(
        db,
        user_id,
        "UPDATE",
        "ano_letivo",
        ano.id,
        f"{perfil} atualizou ano letivo {ano.descricao} ({ano.inicio} a {ano.fim})",
    )
    return ano


def delete(db: Session, id: int, user_id: int, perfil: str):
    """Remove um ano letivo."""
    ano = get_by_id(db, id)
    if not ano:
        raise ValueError("Ano letivo não encontrado")

    db.delete(ano)
    db.commit()

    registrar_log(
        db,
        user_id,
        "DELETE",
        "ano_letivo",
        id,
        f"{perfil} excluiu ano letivo {ano.descricao} ({ano.inicio} a {ano.fim})",
    )
    return True
