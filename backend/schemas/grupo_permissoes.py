from typing import Dict
from pydantic import BaseModel


class GrupoOut(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True


class GrupoPermissaoIn(BaseModel):
    tela_id: int
    operacoes: Dict[str, bool]


class GrupoPermissaoOut(GrupoPermissaoIn):
    class Config:
        from_attributes = True
