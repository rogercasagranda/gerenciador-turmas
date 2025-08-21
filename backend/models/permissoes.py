from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Enum,
    JSON,
    func,
    text,
)

from .base import Base


class Grupo(Base):
    """Tabela de grupos de usuários."""

    __tablename__ = "grupos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(120), nullable=False, unique=True)
    ativo = Column(Boolean, nullable=False, default=True, server_default=text("true"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class UsuarioGrupo(Base):
    """Associação de usuários a grupos."""

    __tablename__ = "usuarios_grupos"

    usuario_id = Column(Integer, ForeignKey("usuarios.id_usuario"), primary_key=True)
    grupo_id = Column(Integer, ForeignKey("grupos.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class GrupoPermissao(Base):
    """Permissões atribuídas a grupos por tela."""

    __tablename__ = "grupos_permissoes"

    grupo_id = Column(Integer, ForeignKey("grupos.id"), primary_key=True)
    tela_id = Column(Integer, ForeignKey("telas.id"), primary_key=True)
    operacoes = Column(JSON, nullable=False, default=dict, server_default=text("'{}'"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class PermissaoStatus(PyEnum):
    ATIVA = "ATIVA"
    EXPIRADA = "EXPIRADA"
    REVOGADA = "REVOGADA"


class UsuarioPermissaoTemp(Base):
    """Permissões temporárias concedidas a usuários."""

    __tablename__ = "usuarios_permissoes_temp"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    tela_id = Column(Integer, ForeignKey("telas.id"), nullable=False)
    operacoes = Column(JSON, nullable=False, default=dict, server_default=text("'{}'"))
    inicio = Column(DateTime(timezone=True), nullable=False)
    fim = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(PermissaoStatus, name="permissao_status_enum"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class PerfilEnum(PyEnum):
    MASTER = "Master"
    DIRETOR = "Diretor(a)"
    COORDENADOR = "Coordenador(a)"
    SECRETARIA = "Secretaria"
    PROFESSOR = "Professor(a)"
    ALUNO = "Aluno(a)"
    RESPONSAVEL = "Responsável"


class PerfilWhitelist(Base):
    """Whitelist de telas liberadas por perfil."""

    __tablename__ = "perfis_whitelist"

    perfil = Column(Enum(PerfilEnum, name="perfil_enum"), primary_key=True)
    tela_id = Column(Integer, ForeignKey("telas.id"), primary_key=True)
    operacoes = Column(JSON, nullable=False, default=dict, server_default=text("'{}'"))
