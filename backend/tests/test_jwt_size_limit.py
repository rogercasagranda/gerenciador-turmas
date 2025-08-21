import os
import sys

import pytest
from jose import jwt
from fastapi import HTTPException
from starlette.requests import Request
from starlette.datastructures import Headers

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import types

# Evita conexões reais de banco ao importar os módulos
sys.modules.setdefault("backend.database", types.SimpleNamespace(get_db=lambda: None))

from backend.routers.usuarios_delete import (
    _claims,
    MAX_JWT_BYTES,
    SECRET_KEY,
    ALGORITHM,
)
from backend.routes.usuarios import (
    token_data_from_request,
    SECRET_KEY as U_SECRET_KEY,
    ALGORITHM as U_ALGORITHM,
    MAX_JWT_BYTES as U_MAX_JWT_BYTES,
)


def _make_request(token: str) -> Request:
    headers = Headers({"Authorization": f"Bearer {token}"})
    scope = {"type": "http", "headers": headers.raw, "method": "GET", "path": "/"}
    return Request(scope)


def test_claims_accepts_token_below_limit():
    token = jwt.encode({"sub": "user@example.com"}, SECRET_KEY, algorithm=ALGORITHM)
    req = _make_request(token)
    claims = _claims(req)
    assert claims["sub"] == "user@example.com"


def test_claims_rejects_token_above_limit():
    big_payload = {"sub": "user@example.com", "data": "a" * MAX_JWT_BYTES}
    token = jwt.encode(big_payload, SECRET_KEY, algorithm=ALGORITHM)
    assert len(token) > MAX_JWT_BYTES
    req = _make_request(token)
    with pytest.raises(HTTPException) as exc:
        _claims(req)
    assert exc.value.status_code == 413
    assert exc.value.detail == "Token muito grande"


def test_token_data_from_request_accepts_small_token():
    token = jwt.encode({"sub": "user@example.com", "id_usuario": 1}, U_SECRET_KEY, algorithm=U_ALGORITHM)
    req = _make_request(token)
    data = token_data_from_request(req)
    assert data.email == "user@example.com"
    assert data.id_usuario == 1


def test_token_data_from_request_rejects_big_token():
    big_payload = {
        "sub": "user@example.com",
        "id_usuario": 1,
        "data": "a" * U_MAX_JWT_BYTES,
    }
    token = jwt.encode(big_payload, U_SECRET_KEY, algorithm=U_ALGORITHM)
    assert len(token) > U_MAX_JWT_BYTES
    req = _make_request(token)
    with pytest.raises(HTTPException) as exc:
        token_data_from_request(req)
    assert exc.value.status_code == 413
    assert exc.value.detail == "Token muito grande"

