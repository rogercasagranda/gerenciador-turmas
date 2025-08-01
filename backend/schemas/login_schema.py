# Importa o modelo BaseModel do Pydantic
from pydantic import BaseModel

# Define os campos esperados no corpo do login
class LoginRequest(BaseModel):
    username: str
    password: str
