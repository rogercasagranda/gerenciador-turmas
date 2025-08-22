from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.routes.usuarios import token_data_from_request
from backend.services.permissions import get_effective_permissions
from backend.models.usuarios import Usuarios
from backend.models.permissoes import Grupo, UsuarioGrupo

router = APIRouter(prefix="/me", tags=["Me"])

@router.get("")
def read_me(request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    user = db.query(Usuarios).filter(Usuarios.id_usuario == token.id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    grupos = [
        g.nome
        for g in db.query(Grupo)
        .join(UsuarioGrupo, UsuarioGrupo.grupo_id == Grupo.id)
        .filter(UsuarioGrupo.usuario_id == user.id_usuario)
        .all()
    ]
    permissoes = get_effective_permissions(db, user.id_usuario, user.tipo_perfil)
    is_master = bool(user.is_master or (user.tipo_perfil or "").lower() == "master")
    role = "Master" if is_master else user.tipo_perfil
    return {
        "id": user.id_usuario,
        "email": user.email,
        "role": role,
        "grupos": grupos,
        "permissoes": permissoes,
        "is_master": is_master,
    }

@router.get("/permissions/effective")
def permissions_effective(request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    if token.is_master or (token.tipo_perfil or "").lower() == "master":
        return ["*"]
    return get_effective_permissions(db, token.id_usuario, token.tipo_perfil)
