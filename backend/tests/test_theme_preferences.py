import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# ensure repository root on path
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("SECRET_KEY", "test-secret")

import types

fake_db = types.SimpleNamespace(get_db=lambda: None)
orig_db_module = sys.modules.get("backend.database")
sys.modules["backend.database"] = fake_db

from backend.models import Base, Usuarios  # noqa: E402
import backend.routes.me as me  # noqa: E402
from backend.security import get_current_user  # noqa: E402

if orig_db_module is not None:
    sys.modules["backend.database"] = orig_db_module
else:
    del sys.modules["backend.database"]

def _create_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    app = FastAPI()
    app.include_router(me.router)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[me.get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: {"id": 1, "email": "user@example.com"}

    return TestClient(app), TestingSessionLocal

def _seed_user(SessionLocal):
    with SessionLocal() as db:
        db.add(
            Usuarios(
                id_usuario=1,
                nome="User",
                email="user@example.com",
                senha_hash="x",
                tipo_perfil="Admin",
                numero_celular="1",
                ddd="11",
                ddi="55",
            )
        )
        db.commit()


def test_get_theme_preference_default():
    client, SessionLocal = _create_client()
    _seed_user(SessionLocal)

    resp = client.get("/me/preferences/theme")
    assert resp.status_code == 200
    assert resp.json() == {"themeName": "roxo", "themeMode": "light"}


def test_update_and_get_theme_preference():
    client, SessionLocal = _create_client()
    _seed_user(SessionLocal)

    resp = client.put("/me/preferences/theme", json={"themeName": "azul", "themeMode": "dark"})
    assert resp.status_code == 204

    resp = client.get("/me/preferences/theme")
    assert resp.status_code == 200
    assert resp.json() == {"themeName": "azul", "themeMode": "dark"}

    with SessionLocal() as db:
        user = db.query(Usuarios).filter_by(id_usuario=1).first()
        assert user.preferences["themeName"] == "azul"
        assert user.preferences["themeMode"] == "dark"



def test_get_theme_preference():
    client, SessionLocal = _create_client()
    with SessionLocal() as db:
        db.add(
            Usuarios(
                id_usuario=1,
                nome="User",
                email="user@example.com",
                senha_hash="x",
                tipo_perfil="Admin",
                numero_celular="1",
                ddd="11",
                ddi="55",
                preferences={"themeName": "verde", "themeMode": "light"},
            )
        )
        db.commit()

    resp = client.get("/me/preferences/theme")
    assert resp.status_code == 200
    assert resp.json() == {"themeName": "verde", "themeMode": "light"}


def test_update_theme_preference_invalid():
    client, SessionLocal = _create_client()
    with SessionLocal() as db:
        db.add(
            Usuarios(
                id_usuario=1,
                nome="User",
                email="user@example.com",
                senha_hash="x",
                tipo_perfil="Admin",
                numero_celular="1",
                ddd="11",
                ddi="55",
            )
        )
        db.commit()


    resp = client.put("/me/preferences/theme", json={"themeName": "invalido", "themeMode": "dark"})
    assert resp.status_code == 400
