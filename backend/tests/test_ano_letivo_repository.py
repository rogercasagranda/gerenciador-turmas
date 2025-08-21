from datetime import date
import os
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.models import Base
from backend.repositories import ano_letivo_repository as repo


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    with Session() as session:
        yield session


def test_create_trims_and_persists(db):
    ano = repo.create(
        db,
        {"descricao": "  Ano 2025  ", "inicio": date(2025, 1, 1), "fim": date(2025, 12, 31)},
        user_id=1,
        perfil="master",
    )
    assert ano.descricao == "Ano 2025"
    assert repo.get_all(db) == [ano]


def test_create_invalid_dates(db):
    with pytest.raises(ValueError):
        repo.create(
            db,
            {"descricao": "Ano", "inicio": date(2025, 12, 31), "fim": date(2025, 1, 1)},
            1,
            "master",
        )
    with pytest.raises(ValueError):
        repo.create(
            db,
            {"descricao": "Ano", "inicio": date(2025, 1, 1), "fim": date(2025, 1, 1)},
            1,
            "master",
        )


def test_descricao_unique_case_insensitive(db):
    repo.create(
        db,
        {"descricao": "Ano 2025", "inicio": date(2025, 1, 1), "fim": date(2025, 12, 31)},
        1,
        "master",
    )
    with pytest.raises(ValueError):
        repo.create(
            db,
            {"descricao": "ano 2025", "inicio": date(2026, 1, 1), "fim": date(2026, 12, 31)},
            1,
            "master",
        )


def test_update_validations(db):
    ano1 = repo.create(
        db,
        {"descricao": "Ano 2025", "inicio": date(2025, 1, 1), "fim": date(2025, 12, 31)},
        1,
        "master",
    )
    ano2 = repo.create(
        db,
        {"descricao": "Ano 2026", "inicio": date(2026, 1, 1), "fim": date(2026, 12, 31)},
        1,
        "master",
    )
    with pytest.raises(ValueError):
        repo.update(db, ano2.id, {"descricao": "ano 2025"}, 1, "master")
    with pytest.raises(ValueError):
        repo.update(
            db,
            ano2.id,
            {"inicio": date(2027, 1, 1), "fim": date(2026, 1, 1)},
            1,
            "master",
        )
