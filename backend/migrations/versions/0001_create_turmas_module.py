"""create turmas module tables

Revision ID: 0001_turmas
Revises:
Create Date: 2024-10-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Revisão
revision = "0001_turmas"
# Revisão anterior
down_revision = None
# Branches
branch_labels = None
# Dependências
depends_on = None


# Upgrade
def upgrade():
    # Enum de turno
    turno_enum = sa.Enum("MANHA", "TARDE", "NOITE", name="turno_enum")
    turno_enum.create(op.get_bind(), checkfirst=True)
    # Enum de dia da semana
    dia_enum = sa.Enum("SEG", "TER", "QUA", "QUI", "SEX", "SAB", name="dia_semana_enum")
    dia_enum.create(op.get_bind(), checkfirst=True)
    # Tabela ano_letivo
    op.create_table(
        "ano_letivo",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("descricao", sa.String(length=100), nullable=False, unique=True),
        sa.Column("data_inicio", sa.Date(), nullable=False),
        sa.Column("data_fim", sa.Date(), nullable=False),
        sa.CheckConstraint("data_inicio <= data_fim", name="ck_ano_letivo_datas"),
    )
    # Tabela turno
    op.create_table(
        "turno",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nome", turno_enum, nullable=False),
    )
    # Tabela professor
    op.create_table(
        "professor",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("usuarios.id_usuario"),
            nullable=False,
        ),
        sa.Column("area_atuacao", sa.Text(), nullable=True),
    )
    # Tabela aluno
    op.create_table(
        "aluno",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("usuarios.id_usuario"),
            nullable=False,
        ),
        sa.Column("ra", sa.Text(), nullable=True, unique=True),
    )
    # Tabela responsavel
    op.create_table(
        "responsavel",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("usuarios.id_usuario"),
            nullable=False,
        ),
        sa.Column("parentesco", sa.Text(), nullable=True),
    )
    # Tabela turma (usa id_turma como chave primária legada)
    op.create_table(
        "turma",
        sa.Column("id_turma", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column(
            "ano_letivo_id",
            sa.Integer(),
            sa.ForeignKey("ano_letivo.id"),
            nullable=False,
        ),
        sa.Column("turno_id", sa.Integer(), sa.ForeignKey("turno.id"), nullable=False),
        sa.Column(
            "coordenador_id", sa.Integer(), sa.ForeignKey("professor.id"), nullable=True
        ),
    )
    # Tabela disciplina
    op.create_table(
        "disciplina",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("carga_horaria", sa.Integer(), nullable=False),
    )
    # Tabela turma_disciplina
    op.create_table(
        "turma_disciplina",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "turma_id", sa.Integer(), sa.ForeignKey("turma.id_turma"), nullable=False
        ),
        sa.Column(
            "disciplina_id",
            sa.Integer(),
            sa.ForeignKey("disciplina.id"),
            nullable=False,
        ),
        sa.Column(
            "professor_responsavel_id",
            sa.Integer(),
            sa.ForeignKey("professor.id"),
            nullable=False,
        ),
        sa.UniqueConstraint("turma_id", "disciplina_id", name="uq_turma_disciplina"),
    )
    # Tabela horario
    op.create_table(
        "horario",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "turma_id", sa.Integer(), sa.ForeignKey("turma.id_turma"), nullable=False
        ),
        sa.Column("dia_semana", dia_enum, nullable=False),
        sa.Column("hora_inicio", sa.Time(), nullable=False),
        sa.Column("hora_fim", sa.Time(), nullable=False),
    )
    # Tabela aluno_responsavel
    op.create_table(
        "aluno_responsavel",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("aluno_id", sa.Integer(), sa.ForeignKey("aluno.id"), nullable=False),
        sa.Column(
            "responsavel_id",
            sa.Integer(),
            sa.ForeignKey("responsavel.id"),
            nullable=False,
        ),
        sa.UniqueConstraint("aluno_id", "responsavel_id", name="uq_aluno_responsavel"),
    )
    # Tabela turma_aluno
    op.create_table(
        "turma_aluno",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "turma_id", sa.Integer(), sa.ForeignKey("turma.id_turma"), nullable=False
        ),
        sa.Column("aluno_id", sa.Integer(), sa.ForeignKey("aluno.id"), nullable=False),
        sa.Column("dt_matricula", sa.Date(), nullable=False),
    )
    # Tabela feriado
    op.create_table(
        "feriado",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
    )


# Downgrade


def downgrade():
    # Remove tabelas na ordem inversa
    op.drop_table("feriado")
    op.drop_table("turma_aluno")
    op.drop_table("aluno_responsavel")
    op.drop_table("horario")
    op.drop_table("turma_disciplina")
    op.drop_table("disciplina")
    op.drop_table("turma")
    op.drop_table("responsavel")
    op.drop_table("aluno")
    op.drop_table("professor")
    op.drop_table("turno")
    op.drop_table("ano_letivo")
    # Drop enums
    dia_enum = sa.Enum("SEG", "TER", "QUA", "QUI", "SEX", "SAB", name="dia_semana_enum")
    turno_enum = sa.Enum("MANHA", "TARDE", "NOITE", name="turno_enum")
    dia_enum.drop(op.get_bind(), checkfirst=True)
    turno_enum.drop(op.get_bind(), checkfirst=True)
