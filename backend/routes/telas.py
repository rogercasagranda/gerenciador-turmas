from typing import Generator

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.models.tela import Tela
from backend.schemas.tela import TelaOut

router = APIRouter(prefix="", tags=["Telas"])


def get_db_dep() -> Generator[Session, None, None]:
    from backend.database import get_db as _get_db
    yield from _get_db()


@router.get("/telas", response_model=list[TelaOut])
def listar_telas(db: Session = Depends(get_db_dep)):
    return db.query(Tela).filter(Tela.ativo.is_(True)).all()
