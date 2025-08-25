"""Rota de login que delega a autenticação ao backend."""

import os
from typing import Any

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Modelo de entrada com credenciais de login."""

    username: str
    password: str

router = APIRouter()

BACKEND_URL = (
    os.getenv("VITE_API_URL")
    or os.getenv("BACKEND_URL", "http://localhost:8000")
).rstrip("/")


@router.post("/login")
def login(request: LoginRequest) -> Any:
    """Encaminha as credenciais ao backend e retorna o token gerado."""
    response = requests.post(f"{BACKEND_URL}/login", json=request.dict())

    if response.status_code != 200:
        detail = response.json().get("detail", "Erro ao autenticar")
        raise HTTPException(status_code=response.status_code, detail=detail)

    return response.json()
