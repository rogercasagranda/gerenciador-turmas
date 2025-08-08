from pydantic import BaseModel

class LoginRequest(BaseModel):
    usuario: str
    senha: str

class LoginResponse(BaseModel):
    nome: str
    email: str
    tipo_perfil: str
