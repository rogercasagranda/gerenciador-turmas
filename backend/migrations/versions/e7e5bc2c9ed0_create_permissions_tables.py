"""create tables for permissions and telas

Revision ID: e7e5bc2c9ed0
Revises: c64b1f765a7b
Create Date: 2025-05-05
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "e7e5bc2c9ed0"
down_revision = "c64b1f765a7b"
branch_labels = None
depends_on = None


def upgrade():
    perfil_enum = sa.Enum(
        "Master",
        "Diretor(a)",
        "Coordenador(a)",
        "Secretaria",
        "Professor(a)",
        "Aluno(a)",
        "Responsável",
        name="perfil_enum",
    )
    perfil_enum.create(op.get_bind(), checkfirst=True)

    status_enum = sa.Enum("ATIVA", "EXPIRADA", "REVOGADA", name="permissao_status_enum")
    status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "telas",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=120), nullable=False, unique=True),
        sa.Column("path", sa.String(length=255), nullable=False, unique=True),
        sa.Column("restrita_professor", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "grupos",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nome", sa.String(length=120), nullable=False, unique=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "usuarios_grupos",
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id_usuario"), primary_key=True),
        sa.Column("grupo_id", sa.Integer(), sa.ForeignKey("grupos.id"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "grupos_permissoes",
        sa.Column("grupo_id", sa.Integer(), sa.ForeignKey("grupos.id"), primary_key=True),
        sa.Column("tela_id", sa.Integer(), sa.ForeignKey("telas.id"), primary_key=True),
        sa.Column("operacoes", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "usuarios_permissoes_temp",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id_usuario"), nullable=False),
        sa.Column("tela_id", sa.Integer(), sa.ForeignKey("telas.id"), nullable=False),
        sa.Column("operacoes", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fim", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", status_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "perfis_whitelist",
        sa.Column("perfil", perfil_enum, primary_key=True),
        sa.Column("tela_id", sa.Integer(), sa.ForeignKey("telas.id"), primary_key=True),
        sa.Column("operacoes", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )

    telas_table = sa.table(
        "telas",
        sa.column("name", sa.String),
        sa.column("path", sa.String),
        sa.column("restrita_professor", sa.Boolean),
    )

    telas_seed = [
        {"name": "Login", "path": "/login", "restrita_professor": False},
        {"name": "Home", "path": "/home", "restrita_professor": False},
        {"name": "Cadastro Turmas", "path": "/cadastro/turmas", "restrita_professor": False},
        {"name": "Cadastro Alunos", "path": "/cadastro/alunos", "restrita_professor": False},
        {"name": "Cadastro Disciplinas", "path": "/cadastro/disciplinas", "restrita_professor": False},
        {"name": "Cadastro Turnos", "path": "/cadastro/turnos", "restrita_professor": False},
        {"name": "Cadastro Professores", "path": "/cadastro/professores", "restrita_professor": False},
        {"name": "Cadastro Responsáveis", "path": "/cadastro/responsaveis", "restrita_professor": False},
        {"name": "Cadastro Ano Letivo", "path": "/cadastro/ano-letivo", "restrita_professor": False},
        {"name": "Cadastro Feriados", "path": "/cadastro/feriados", "restrita_professor": False},
        {"name": "Usuários Cadastrar", "path": "/usuarios/cadastrar", "restrita_professor": False},
        {"name": "Usuários Consultar", "path": "/usuarios/consultar", "restrita_professor": False},
        {"name": "Config Logs", "path": "/config/logs", "restrita_professor": False},
        {"name": "Config Tema", "path": "/config/tema", "restrita_professor": False},
        {"name": "Config Ano Letivo", "path": "/config/ano-letivo", "restrita_professor": False},
        {"name": "Política de Cookies", "path": "/politica-de-cookies", "restrita_professor": False},
    ]

    op.bulk_insert(telas_table, telas_seed)


def downgrade():
    op.drop_table("perfis_whitelist")
    op.drop_table("usuarios_permissoes_temp")
    op.drop_table("grupos_permissoes")
    op.drop_table("usuarios_grupos")
    op.drop_table("grupos")
    op.drop_table("telas")
    op.execute("DROP TYPE IF EXISTS perfil_enum")
    op.execute("DROP TYPE IF EXISTS permissao_status_enum")
