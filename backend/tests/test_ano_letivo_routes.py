"""Testes das rotas de Ano Letivo."""

import os
import sys
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from jose import jwt

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.models import Base
from backend.routes.calendario import router, get_db_dep


SECRET_KEY = "change-me-in-prod"
ALGORITHM = "HS256"


def _token(perfil: str) -> str:
    payload = {"sub": "user@example.com", "id_usuario": 1, "tipo_perfil": perfil}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _create_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    app = FastAPI()
    app.include_router(router)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db_dep] = override_get_db
    return TestClient(app)


def test_get_requires_token():
    client = _create_client()
    resp = client.get("/ano-letivo")
    assert resp.status_code == 401


def test_crud_flow_master():
    client = _create_client()
    headers = {"Authorization": f"Bearer {_token('master')}"}

    payload = {"descricao": "2024", "data_inicio": "2024-01-01", "data_fim": "2024-12-31"}
    resp = client.post("/ano-letivo", json=payload, headers=headers)
    assert resp.status_code == 201
    ano_id = resp.json()["id"]

    resp = client.get("/ano-letivo", headers=headers)
    assert resp.status_code == 200
    assert any(a["id"] == ano_id for a in resp.json())

    update = {"descricao": "2024 Atualizado", "data_inicio": "2024-01-02", "data_fim": "2024-12-31"}
    resp = client.put(f"/ano-letivo/{ano_id}", json=update, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["descricao"] == "2024 Atualizado"

    resp = client.delete(f"/ano-letivo/{ano_id}", headers=headers)
    assert resp.status_code == 200


def test_duplicate_descricao_returns_400():
    client = _create_client()
    headers = {"Authorization": f"Bearer {_token('master')}"}

    base_payload = {"descricao": "Ano X", "data_inicio": "2025-01-01", "data_fim": "2025-12-31"}
    assert client.post("/ano-letivo", json=base_payload, headers=headers).status_code == 201

    dup_payload = {"descricao": "ano x", "data_inicio": "2026-01-01", "data_fim": "2026-12-31"}
    resp = client.post("/ano-letivo", json=dup_payload, headers=headers)
    assert resp.status_code == 400


def test_create_requires_permission():
    client = _create_client()
    headers = {"Authorization": f"Bearer {_token('aluno')}"}

    payload = {"descricao": "2027", "data_inicio": "2027-01-01", "data_fim": "2027-12-31"}
    resp = client.post("/ano-letivo", json=payload, headers=headers)
    assert resp.status_code == 403


def test_invalid_dates_return_400():
    client = _create_client()
    headers = {"Authorization": f"Bearer {_token('diretor')}"}

    payload = {"descricao": "2028", "data_inicio": "2028-12-31", "data_fim": "2028-01-01"}
    resp = client.post("/ano-letivo", json=payload, headers=headers)
    assert resp.status_code == 400

