# Define os esquemas de entrada e saída do usuário

from pydantic import BaseModel

class UserLogin(BaseModel):
    username: str
    password: str
