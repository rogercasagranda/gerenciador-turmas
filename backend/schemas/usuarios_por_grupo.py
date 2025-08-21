from datetime import datetime
from pydantic import BaseModel


class UsuarioGrupoOut(BaseModel):
    id_usuario: int
    nome: str
    email: str
    perfil: str | None = None
    grupos: list[str]
    ultimo_acesso: datetime | None = None
    status: str

    class Config:
        from_attributes = True


class UsuariosPorGrupoResponse(BaseModel):
    items: list[UsuarioGrupoOut]
    total: int
    page: int
    limit: int
