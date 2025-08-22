import os
from typing import Dict, Any

from fastapi import Header, HTTPException, status
from jose import jwt, JWTError

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def verify_jwt(token: str) -> Dict[str, Any]:
    """Decodifica e valida um JWT, levantando erro em caso de falha."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def get_current_user(authorization: str | None = Header(None)) -> Dict[str, Any]:
    """Obtém o usuário atual a partir do header Authorization."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid/expired")
    token = authorization.split(" ", 1)[1]
    try:
        payload = verify_jwt(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid/expired")
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "nome": payload.get("nome"),
        "perfis": payload.get("perfis") or payload.get("groups") or [],
    }
