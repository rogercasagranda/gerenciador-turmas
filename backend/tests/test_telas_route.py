import os
import sys
import os
import sys
from fastapi.testclient import TestClient
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.models import Base, Tela
from backend.routes.telas import router, get_db_dep


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
    return TestClient(app), TestingSessionLocal


def test_listar_telas_retorna_seed():
    client, SessionLocal = _create_client()
    with SessionLocal() as db:
        db.add(Tela(name="Login", path="/login", restrita_professor=False))
        db.commit()
    resp = client.get("/telas")
    assert resp.status_code == 200
    data = resp.json()
    assert any(t["path"] == "/login" for t in data)
