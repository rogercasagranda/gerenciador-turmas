from datetime import datetime
from typing import Dict
from pydantic import BaseModel, Field
from backend.models.permissoes import PermissaoStatus

class PermissaoTempIn(BaseModel):
    tela_id: int
    operacoes: Dict[str, bool]
    inicio: datetime
    fim: datetime

class PermissaoTempOut(BaseModel):
    id: int
    tela_id: int
    operacoes: Dict[str, bool]
    inicio: datetime
    fim: datetime
    status: PermissaoStatus = Field(..., serialization_alias="status")

    class Config:
        from_attributes = True
