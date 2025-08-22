import os
import logging
from typing import Dict, Any

from fastapi import Header, HTTPException, status
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

# Lê chave e algoritmo do JWT a partir das variáveis de ambiente
# Mantém compatibilidade com nomes antigos, mas levanta erro se ausente
SECRET_KEY = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set")
ALGORITHM = os.getenv("JWT_ALG", "HS256")


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

    email = payload.get("email")
    role = payload.get("role") or payload.get("perfil") or payload.get("tipo_perfil")
    logger.info("\U0001F512 Auth OK: %s, role=%s", email, role)

    return {
        "id": payload.get("sub"),
        "email": email,
        "nome": payload.get("nome"),
        "role": role,
        "perfis": payload.get("perfis") or payload.get("groups") or [],
        "permissoes": payload.get("permissoes") or payload.get("permissions") or [],
    }
