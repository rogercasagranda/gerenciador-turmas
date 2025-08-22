import os
import sys
from datetime import datetime, timedelta
import types

from fastapi.testclient import TestClient
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.models import Base, Tela, UsuarioPermissaoTemp, PermissaoStatus
from backend.models.usuarios import Usuarios
from backend.services.permissions import has_permission
import backend.services.permissions as perms

fake_db = types.SimpleNamespace(get_db=lambda: None)
sys.modules["backend.database"] = fake_db
from backend.routes import acessos
from backend.routes.acessos import router, BRAZIL_TZ


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
            self.is_master = True

    acessos.token_data_from_request = lambda request: DummyToken()
    acessos.to_canonical = lambda p: p.lower()
    return TestClient(app), TestingSessionLocal


def _seed_base(db):
    user = Usuarios(
        id_usuario=1,
        nome="Prof",
        email="p@example.com",
        senha_hash="x",
        tipo_perfil="Professor",
        numero_celular="123",
        ddd="11",
        ddi="55",
    )
    tela = Tela(name="TelaX", path="/x", restrita_professor=False)
    db.add_all([user, tela])
    db.commit()
    return user, tela


def test_criar_e_revogar():
    client, SessionLocal = _create_client()
    perms.BRAZIL_TZ = None
    with SessionLocal() as db:
        user, tela = _seed_base(db)
    inicio = datetime.now()
    fim = inicio + timedelta(hours=1)
    payload = {
        "tela_id": 1,
        "operacoes": {"view": True},
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
    }
    resp = client.post("/acessos/usuarios/1/temporarias", json=payload)
    assert resp.status_code == 201
    perm_id = resp.json()[0]["id"]
    # Ativa concede acesso
    with SessionLocal() as db:
        allowed, fonte = has_permission(db, 1, "professor", "/x", "view")
        assert allowed and fonte == "override"
    resp2 = client.patch(f"/acessos/usuarios/1/temporarias/{perm_id}")
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "REVOGADA"
    # Revogada bloqueia acesso
    with SessionLocal() as db:
        allowed, _ = has_permission(db, 1, "professor", "/x", "view")
        assert not allowed


def test_sobreposicao_rejeitada():
    client, SessionLocal = _create_client()
    with SessionLocal() as db:
        _seed_base(db)
    inicio = datetime.now(BRAZIL_TZ)
    fim = inicio + timedelta(hours=2)
    payload = {
        "tela_id": 1,
        "operacoes": {"view": True},
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
    }
    assert client.post("/acessos/usuarios/1/temporarias", json=payload).status_code == 201
    resp = client.post("/acessos/usuarios/1/temporarias", json=payload)
    assert resp.status_code == 400


def test_proibe_perfil_aluno():
    client, SessionLocal = _create_client()
    with SessionLocal() as db:
        user = Usuarios(
            id_usuario=2,
            nome="Aluno",
            email="a@example.com",
            senha_hash="x",
            tipo_perfil="Aluno",
            numero_celular="123",
            ddd="11",
            ddi="55",
        )
        tela = Tela(name="TelaY", path="/y", restrita_professor=False)
        db.add_all([user, tela])
        db.commit()
    inicio = datetime.now(BRAZIL_TZ)
    fim = inicio + timedelta(hours=1)
    payload = {
        "tela_id": 1,
        "operacoes": {"view": True},
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
    }
    resp = client.post("/acessos/usuarios/2/temporarias", json=payload)
    assert resp.status_code == 400


def test_secretaria_nao_recebe_restrita_professor():
    client, SessionLocal = _create_client()
    with SessionLocal() as db:
        user = Usuarios(
            id_usuario=3,
            nome="Sec",
            email="s@example.com",
            senha_hash="x",
            tipo_perfil="Secretaria",
            numero_celular="123",
            ddd="11",
            ddi="55",
        )
        tela = Tela(name="TelaR", path="/r", restrita_professor=True)
        db.add_all([user, tela])
        db.commit()
    inicio = datetime.now(BRAZIL_TZ)
    fim = inicio + timedelta(hours=1)
    payload = {
        "tela_id": 1,
        "operacoes": {"view": True},
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
    }
    resp = client.post("/acessos/usuarios/3/temporarias", json=payload)
    assert resp.status_code == 400


def test_expirada_nao_concede_acesso():
    client, SessionLocal = _create_client()
    perms.BRAZIL_TZ = None
    with SessionLocal() as db:
        _seed_base(db)
    inicio = datetime.now() - timedelta(hours=2)
    fim = datetime.now() - timedelta(hours=1)
    payload = {
        "tela_id": 1,
        "operacoes": {"view": True},
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
    }
    # Cria permissão já expirada
    assert client.post("/acessos/usuarios/1/temporarias", json=payload).status_code == 201
    with SessionLocal() as db:
        allowed, _ = has_permission(db, 1, "professor", "/x", "view")
        perm = db.query(UsuarioPermissaoTemp).first()
        assert perm.status == PermissaoStatus.EXPIRADA
        assert not allowed


def test_periodo_invalido_rejeitado():
    client, SessionLocal = _create_client()
    with SessionLocal() as db:
        _seed_base(db)
    inicio = datetime.now(BRAZIL_TZ)
    fim = inicio - timedelta(hours=1)
    payload = {
        "tela_id": 1,
        "operacoes": {"view": True},
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
    }
    resp = client.post("/acessos/usuarios/1/temporarias", json=payload)
    assert resp.status_code == 400
