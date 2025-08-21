from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.routes.usuarios import token_data_from_request
from backend.services.permissions import get_effective_permissions

router = APIRouter(prefix="/me", tags=["Me"])

@router.get("/permissions/effective")
def permissions_effective(request: Request, db: Session = Depends(get_db)):
    token = token_data_from_request(request)
    return get_effective_permissions(db, token.id_usuario, token.tipo_perfil)
