# Importa o tipo Optional para uso nos retornos
from typing import Optional

# Importa o ORM do SQLAlchemy
from sqlalchemy.orm import Session

# Importa o modelo da tabela de usuários
from app.models.usuario_model import Usuario

# Importa a função para verificação de senha com hash
from app.utils.security import verificar_senha

# Define função de autenticação que recebe a sessão do banco, usuário e senha
def autenticar_usuario(db: Session, usuario: str, senha: str) -> Optional[Usuario]:
    # Busca o usuário no banco pelo nome de usuário
    usuario_db = db.query(Usuario).filter(Usuario.usuario == usuario).first()

    # Retorna None se o usuário não existir ou a senha estiver incorreta
    if not usuario_db or not verificar_senha(senha, usuario_db.senha):
        return None

    # Retorna o objeto do usuário autenticado
    return usuario_db
