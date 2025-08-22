import os
import sys
import types
from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.models import (
    Base,
    Tela,
    PerfilWhitelist,
    PerfilEnum,
    Grupo,
    UsuarioGrupo,
    GrupoPermissao,
    UsuarioPermissaoTemp,
    PermissaoStatus,
    LogAuditoria,
)
from backend.models.usuarios import Usuarios
from backend.routes import acessos, me
from backend.routes.acessos import router as acessos_router, BRAZIL_TZ
from backend.routes.me import router as me_router
from backend.services.permissions import has_permission
import backend.services.permissions as perms


fake_db = types.SimpleNamespace(get_db=lambda: None)
sys.modules["backend.database"] = fake_db


def _create_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    app = FastAPI()
    app.include_router(acessos_router)
    app.include_router(me_router)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[acessos.get_db] = override_get_db
    app.dependency_overrides[me.get_db] = override_get_db

    class DummyToken:
        def __init__(self, id_usuario=1, perfil="Master", is_master=False):
            self.id_usuario = id_usuario
            self.email = f"user{id_usuario}@example.com"
            self.tipo_perfil = perfil
            self.is_master = is_master

    token_holder = {"token": DummyToken()}

    def token_provider(request):
        return token_holder["token"]

    acessos.token_data_from_request = token_provider
    me.token_data_from_request = token_provider
    acessos.to_canonical = lambda p: p.lower()
    me.to_canonical = lambda p: p.lower()

    client = TestClient(app)
    return client, TestingSessionLocal, token_holder


def _seed_basic(db):
    user = Usuarios(
        id_usuario=1,
        nome="Master",
        email="master@example.com",
        senha_hash="x",
        tipo_perfil="Master",
        numero_celular="1",
        ddd="11",
        ddi="55",
        ativo=True,
    )
    db.add(user)
    db.commit()


def test_master_access_all():
    client, SessionLocal, token_holder = _create_client()
    with SessionLocal() as db:
        _seed_basic(db)
        allowed, fonte = has_permission(db, 1, "master", "/qualquer", "view")
        assert allowed and fonte == "master"


def test_aluno_whitelist():
    client, SessionLocal, token_holder = _create_client()
    with SessionLocal() as db:
        tela1 = Tela(id=1, name="A", path="/a", restrita_professor=False)
        tela2 = Tela(id=2, name="B", path="/b", restrita_professor=False)
        db.add_all([tela1, tela2])
        db.add(
            PerfilWhitelist(
                perfil=PerfilEnum.ALUNO,
                tela_id=1,
                operacoes={"view": True},
            )
        )
        db.commit()
        allowed1, _ = has_permission(db, 1, "aluno", "/a", "view")
        allowed2, _ = has_permission(db, 1, "aluno", "/b", "view")
        assert allowed1 and not allowed2


def test_override_precedence():
    client, SessionLocal, token_holder = _create_client()
    perms.BRAZIL_TZ = None
    now = datetime.now()
    with SessionLocal() as db:
        tela = Tela(id=1, name="A", path="/p", restrita_professor=False)
        user = Usuarios(
            id_usuario=2,
            nome="Prof",
            email="p@example.com",
            senha_hash="x",
            tipo_perfil="Professor",
            numero_celular="1",
            ddd="11",
            ddi="55",
        )
        grupo = Grupo(id=1, nome="G")
        db.add_all([tela, user, grupo, UsuarioGrupo(usuario_id=2, grupo_id=1)])
        db.commit()
        db.add(GrupoPermissao(grupo_id=1, tela_id=1, operacoes={"view": True}))
        db.add(
            UsuarioPermissaoTemp(
                usuario_id=2,
                tela_id=1,
                operacoes={"view": False},
                inicio=now - timedelta(hours=1),
                fim=now + timedelta(hours=1),
                status=PermissaoStatus.ATIVA,
            )
        )
        db.commit()
        allowed, fonte = has_permission(db, 2, "professor", "/p", "view")
        assert not allowed and fonte == "override"
        # Agora override permite e grupo nega
        db.query(GrupoPermissao).delete()
        db.add(GrupoPermissao(grupo_id=1, tela_id=1, operacoes={"view": False}))
        db.query(UsuarioPermissaoTemp).delete()
        db.add(
            UsuarioPermissaoTemp(
                usuario_id=2,
                tela_id=1,
                operacoes={"view": True},
                inicio=now - timedelta(hours=1),
                fim=now + timedelta(hours=1),
                status=PermissaoStatus.ATIVA,
            )
        )
        db.commit()
        allowed2, fonte2 = has_permission(db, 2, "professor", "/p", "view")
        assert allowed2 and fonte2 == "override"


def test_effective_permissions_endpoint():
    client, SessionLocal, token_holder = _create_client()
    token_holder["token"] = type("T", (), {"id_usuario": 2, "email": "p@example.com", "tipo_perfil": "Professor", "is_master": False})()
    with SessionLocal() as db:
        tela = Tela(id=1, name="A", path="/p", restrita_professor=False)
        user = Usuarios(
            id_usuario=2,
            nome="Prof",
            email="p@example.com",
            senha_hash="x",
            tipo_perfil="Professor",
            numero_celular="1",
            ddd="11",
            ddi="55",
        )
        grupo = Grupo(id=1, nome="G")
        db.add_all([tela, user, grupo, UsuarioGrupo(usuario_id=2, grupo_id=1)])
        db.commit()
        db.add(GrupoPermissao(grupo_id=1, tela_id=1, operacoes={"view": True}))
        db.commit()
    resp = client.get("/me/permissions/effective")
    assert resp.status_code == 200
    assert resp.json()["/p"]["view"] is True


def test_export_formats():
    client, SessionLocal, token_holder = _create_client()
    with SessionLocal() as db:
        _seed_basic(db)
        user = Usuarios(
            id_usuario=2,
            nome="Outro",
            email="o@example.com",
            senha_hash="x",
            tipo_perfil="Professor",
            numero_celular="1",
            ddd="11",
            ddi="55",
        )
        grupo = Grupo(id=1, nome="G")
        db.add_all([user, grupo, UsuarioGrupo(usuario_id=2, grupo_id=1)])
        db.commit()

    for fmt, ct in [
        ("csv", "text/csv"),
        ("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ("pdf", "application/pdf"),
    ]:
        resp = client.get(f"/acessos/export/usuarios-por-grupo?format={fmt}")
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith(ct)
        assert resp.content


def test_logs_on_403():
    client, SessionLocal, token_holder = _create_client()
    # Token com perfil Aluno
    token_holder["token"] = type("T", (), {"id_usuario": 1, "email": "a@example.com", "tipo_perfil": "Aluno", "is_master": False})()
    with SessionLocal() as db:
        db.add(
            Usuarios(
                id_usuario=1,
                nome="Aluno",
                email="a@example.com",
                senha_hash="x",
                tipo_perfil="Aluno",
                numero_celular="1",
                ddd="11",
                ddi="55",
            )
        )
        db.commit()
    resp = client.get("/acessos/export/usuarios-por-grupo")
    assert resp.status_code == 403
    with SessionLocal() as db:
        log = db.query(LogAuditoria).first()
        assert log is not None
        assert log.acao == "forbidden"
