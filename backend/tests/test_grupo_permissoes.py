import os
import sys
import types
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

fake_db = types.SimpleNamespace(get_db=lambda: None)
sys.modules["backend.database"] = fake_db

from backend.models import Base, Grupo, Tela, UsuarioGrupo
from backend.models.usuarios import Usuarios
from backend.services.permissions import has_permission
from backend.routes import acessos
from backend.routes.acessos import router


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

    app.dependency_overrides[acessos.get_db] = override_get_db

    class DummyToken:
        def __init__(self):
            self.id_usuario = 0
            self.email = "adm@example.com"
            self.tipo_perfil = "Master"

    acessos.token_data_from_request = lambda request: DummyToken()
    acessos.to_canonical = lambda p: p.lower()
    return TestClient(app), TestingSessionLocal


def test_grupo_permissoes_flow():
    client, SessionLocal = _create_client()
    with SessionLocal() as db:
        user = Usuarios(
            id_usuario=1,
            nome="P",
            email="p@example.com",
            senha_hash="x",
            tipo_perfil="Professor",
            numero_celular="1",
            ddd="11",
            ddi="55",
        )
        tela = Tela(name="TelaX", path="/x", restrita_professor=False)
        grupo = Grupo(id=1, nome="G1")
        db.add_all([user, tela, grupo, UsuarioGrupo(usuario_id=1, grupo_id=1)])
        db.commit()
    assert client.get("/acessos/grupos/1/permissoes").json() == []
    payload = [{"tela_id": 1, "operacoes": {"view": True}}]
    resp = client.post("/acessos/grupos/1/permissoes", json=payload)
    assert resp.status_code == 200
    assert resp.json()[0]["tela_id"] == 1
    with SessionLocal() as db:
        allowed, fonte = has_permission(db, 1, "professor", "/x", "view")
        assert allowed and fonte == "grupo"


def test_bloqueia_secretaria_restrita():
    client, SessionLocal = _create_client()
    with SessionLocal() as db:
        user = Usuarios(
            id_usuario=1,
            nome="S",
            email="s@example.com",
            senha_hash="x",
            tipo_perfil="Secretaria",
            numero_celular="1",
            ddd="11",
            ddi="55",
        )
        tela = Tela(name="TelaY", path="/y", restrita_professor=True)
        grupo = Grupo(id=1, nome="G1")
        db.add_all([user, tela, grupo, UsuarioGrupo(usuario_id=1, grupo_id=1)])
        db.commit()
    payload = [{"tela_id": 1, "operacoes": {"view": True}}]
    resp = client.post("/acessos/grupos/1/permissoes", json=payload)
    assert resp.status_code == 400
