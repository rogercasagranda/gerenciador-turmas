# Importa o tipo de retorno opcional
from typing import Optional

# Importa o ORM do SQLAlchemy
from sqlalchemy.orm import Session

# Importa o modelo da tabela de usuários
from app.models.usuario_model import Usuario

# Importa a função que verifica a senha com hash seguro
from app.utils.security import verificar_senha

# Função que autentica o usuário consultando o banco
def autenticar_usuario(db: Session, usuario: str, senha: str) -> Optional[Usuario]:
    # Consulta o usuário pelo nome
    usuario_db = db.query(Usuario).filter(Usuario.usuario == usuario).first()

    # Verifica se usuário existe e se a senha é válida
    if not usuario_db or not verificar_senha(senha, usuario_db.senha):
        return None

    # Retorna o objeto do usuário autenticado
    return usuario_db
