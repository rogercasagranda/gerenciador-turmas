from fastapi import APIRouter, Depends

from backend.security import get_current_user

router = APIRouter()


@router.get("/me")
def read_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "nome": current_user.get("nome"),
        "perfis": current_user.get("perfis", []),
    }
