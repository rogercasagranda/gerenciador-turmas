# Importa o APIRouter para definir rotas modulares
from fastapi import APIRouter, Depends, HTTPException, status
# Importa a sessão do SQLAlchemy via dependência
from sqlalchemy.orm import Session
# Importa utilitário de acesso ao banco
from backend.database import get_db  # Ajusta o caminho se seu main importa como "from database import get_db"
# Importa o modelo de usuários já existente
from backend.models.usuarios import Usuarios as UsuariosModel  # Ajusta o caminho se necessário
# Importa tipagem do Pydantic para I/O
from pydantic import BaseModel, EmailStr, Field
# Importa bcrypt para gerar hash seguro
import bcrypt

# Cria o roteador de usuários
router = APIRouter(tags=["Usuarios"])

# Define schema de saída (evita expor hash)
class UsuarioOut(BaseModel):
    id_usuario: int = Field(..., description="Identificador do usuário")
    nome: str
    email: EmailStr
    tipo_perfil: str | None = None
    ddi: str | None = None
    ddd: str | None = None
    numero_celular: str | None = None

    class Config:
        from_attributes = True

# Define schema de criação
class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str = Field(..., min_length=6)
    tipo_perfil: str | None = None
    ddi: str | None = None
    ddd: str | None = None
    numero_celular: str

# Lista usuários
@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db)):
    # Executa query em todos os registros
    result = db.query(UsuariosModel).all()
    # Retorna lista convertida para o schema de saída
    return result

# Cria usuário
@router.post("/usuarios", status_code=status.HTTP_201_CREATED, response_model=UsuarioOut)
def criar_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)):
    # Verifica existência por e-mail para evitar duplicidade
    ja_existe = db.query(UsuariosModel).filter(UsuariosModel.email == payload.email).first()
    if ja_existe:
        # Retorna conflito quando e-mail já cadastrado
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado.")

    # Gera hash seguro com bcrypt
    salt = bcrypt.gensalt(rounds=12)
    senha_hash = bcrypt.hashpw(payload.senha.encode("utf-8"), salt).decode("utf-8")

    # Monta a entidade do modelo
    novo = UsuariosModel(
        nome=payload.nome,
        email=payload.email,
        senha_hash=senha_hash,
        tipo_perfil=payload.tipo_perfil,
        ddi=payload.ddi,
        ddd=payload.ddd,
        numero_celular=payload.numero_celular,
        google_id=None,
        is_master=False,
    )

    # Persiste no banco
    db.add(novo)
    db.commit()
    db.refresh(novo)

    # Retorna o registro criado sem expor hash
    return novo
