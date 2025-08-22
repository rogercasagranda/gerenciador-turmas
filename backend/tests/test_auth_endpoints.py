import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# ensure repository root on path
sys.path.append(str(Path(__file__).resolve().parents[2]))

# Ensure environment variables for app initialization
def setup_app_env():
    os.environ.setdefault("FRONTEND_ORIGIN", "https://frontend.example")
    os.environ.setdefault("GOOGLE_CLIENT_ID", "cid")
    os.environ.setdefault("GOOGLE_CLIENT_SECRET", "secret")
    os.environ.setdefault("GOOGLE_REDIRECT_URI", "https://api.example/google-callback")
    os.environ.setdefault("DATABASE_URL", "sqlite:///test.db")


setup_app_env()

from backend.main import app, create_access_token

client = TestClient(app)


def test_me_without_token():
    response = client.get("/me")
    assert response.status_code == 401


def test_me_with_token():
    token = create_access_token({
        "sub": "1",
        "email": "user@example.com",
        "nome": "User",
        "perfis": ["Admin"],
        "permissoes": ["*"],
    })
    response = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@example.com"
    assert "Admin" in data["perfis"]
    assert data["permissoes"] == ["*"]


def test_google_callback_redirect(monkeypatch):
    class DummyResponse:
        def __init__(self, data):
            self._data = data
            self.status_code = 200
        def json(self):
            return self._data

    # Mock requests to Google
    monkeypatch.setattr("backend.main.requests.post", lambda url, data, timeout: DummyResponse({"access_token": "gtoken"}))
    monkeypatch.setattr("backend.main.requests.get", lambda url, headers, timeout: DummyResponse({"email": "user@example.com", "name": "User"}))

    # Mock database connection and session
    class DummyCursor:
        def execute(self, *args, **kwargs):
            pass
        def fetchone(self):
            return (1, "Admin", False)
        def close(self):
            pass
    class DummyConn:
        def cursor(self):
            return DummyCursor()
        def close(self):
            pass
    monkeypatch.setattr("backend.main.psycopg2.connect", lambda dsn: DummyConn())

    class DummyQuery:
        def join(self, *args, **kwargs):
            return self
        def filter(self, *args, **kwargs):
            return self
        def all(self):
            class G: nome = "Admin"
            return [G()]
    class DummySession:
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc, tb):
            pass
        def query(self, *args, **kwargs):
            return DummyQuery()
    monkeypatch.setattr("backend.main.SessionLocal", lambda: DummySession())
    monkeypatch.setattr("backend.main.get_effective_permissions", lambda db, uid, role: ["perm"]) 

    response = client.get("/google-callback?code=xyz", follow_redirects=False)
    assert response.status_code == 302
    location = response.headers["location"]
    assert location.startswith(os.environ["FRONTEND_ORIGIN"] + "/#/auth/callback?token=")
