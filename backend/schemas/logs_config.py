from datetime import datetime
from pydantic import BaseModel


class LogConfigIn(BaseModel):
    screen: str
    create: bool
    read: bool
    update: bool
    delete: bool
    applyAll: bool = False


class LogConfigOut(BaseModel):
    screen: str
    create: bool
    read: bool
    update: bool
    delete: bool
    updated_at: datetime | None
    updated_by_name: str
