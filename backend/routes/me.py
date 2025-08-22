from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
import logging

from backend.database import get_db
from backend.security import get_current_user
from backend.services.permissions import get_effective_permissions
from backend.routes.usuarios import token_data_from_request, to_canonical

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

