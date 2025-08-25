from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session

from pydantic import BaseModel
from typing import ClassVar, Set

import logging

from backend.database import get_db
from backend.security import get_current_user
from backend.services.permissions import get_effective_permissions
from backend.routes.usuarios import token_data_from_request, to_canonical
from backend.models.usuarios import Usuarios

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/me")
def read_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "nome": current_user.get("nome"),
        "perfis": current_user.get("perfis", []),
        "permissoes": current_user.get("permissoes", []),
    }


@router.get("/me/permissions/effective")
def effective_permissions(request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    perfil = to_canonical(token.tipo_perfil)

    if token.is_master or perfil == "master":
        role = "MASTER"
        perms: list | dict = ["*"]
    else:
        role = token.tipo_perfil or perfil
        perms = get_effective_permissions(db, token.id_usuario, perfil)

    logger.info("\U0001F512 Auth OK: %s, role=%s", token.email, role)
    logger.info("\U0001F9E9 Effective permissions: %s", perms)

    return {
        "id": token.id_usuario,
        "email": token.email,
        "role": role,
        "permissions": perms,
    }


class ThemePreference(BaseModel):

    """Schema de preferência de tema do usuário."""

    themeName: str
    themeMode: str


    allowed_names: ClassVar[Set[str]] = {
        "roxo",
        "azul",
        "verde",
        "laranja",
        "cinza",
        "teal",
        "ciano",
        "rosa",
        "violeta",
        "ambar",
    }
    allowed_modes: ClassVar[Set[str]] = {"light", "dark"}

    @classmethod
    def validate_values(cls, data: "ThemePreference") -> None:
        if data.themeName not in cls.allowed_names or data.themeMode not in cls.allowed_modes:
            raise HTTPException(status_code=400, detail="Valores de tema inválidos")


@router.get("/me/preferences/theme", response_model=ThemePreference)
def read_theme(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna a preferência de tema do usuário autenticado."""

    user_id = int(current_user["id"])
    user = db.query(Usuarios).filter(Usuarios.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    prefs = user.preferences or {}
    return {
        "themeName": prefs.get("themeName", "roxo"),
        "themeMode": prefs.get("themeMode", "light"),
    }


@router.put("/me/preferences/theme", status_code=status.HTTP_204_NO_CONTENT)
def update_theme(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    ThemePreference.validate_values(payload)


    user_id = int(current_user["id"])
    user = db.query(Usuarios).filter(Usuarios.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    prefs = user.preferences or {}
    prefs["themeName"] = pref.themeName
    prefs["themeMode"] = pref.themeMode
    user.preferences = prefs
    db.commit()


@router.get("/me/preferences/theme")
def get_theme(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = int(current_user["id"])
    user = db.query(Usuarios).filter(Usuarios.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    prefs = user.preferences or {}
    return {
        "themeName": prefs.get("themeName", "roxo"),
        "themeMode": prefs.get("themeMode", "light"),
    }


