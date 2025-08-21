from pydantic import BaseModel


class TelaOut(BaseModel):
    id: int
    name: str
    path: str
    restrita_professor: bool

    class Config:
        from_attributes = True
