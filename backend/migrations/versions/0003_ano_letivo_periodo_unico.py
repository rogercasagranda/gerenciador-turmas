"""unifica periodo do ano letivo"""

# Revisão
revision = "0003_periodo_unico"
# Revisão anterior
down_revision = "0002_periodos"
# Branches
branch_labels = None
# Dependências
depends_on = None

from alembic import op                                   # Importa operações do Alembic
import sqlalchemy as sa                                  # Importa SQLAlchemy


def upgrade():                                           # Atualiza para novo esquema
    op.add_column("ano_letivo", sa.Column("descricao", sa.Text(), nullable=True))     # Cria coluna descricao
    op.add_column("ano_letivo", sa.Column("data_inicio", sa.Date(), nullable=True))   # Cria coluna data_inicio
    op.add_column("ano_letivo", sa.Column("data_fim", sa.Date(), nullable=True))      # Cria coluna data_fim

    op.execute("""
        UPDATE ano_letivo AS a                           -- Atualiza descricao com ano
        SET descricao = 'Ano Letivo ' || a.ano::text
    """)

    op.execute("""
        UPDATE ano_letivo AS a                           -- Consolida datas a partir dos períodos
        SET data_inicio = p.min_inicio,
            data_fim = p.max_fim
        FROM (
            SELECT ano_letivo_id,
                   MIN(data_inicio) AS min_inicio,
                   MAX(data_fim) AS max_fim
            FROM ano_letivo_periodo
            GROUP BY ano_letivo_id
        ) AS p
        WHERE a.id = p.ano_letivo_id
    """)

    op.alter_column("ano_letivo", "descricao", existing_type=sa.Text(), nullable=False)  # Torna descricao obrigatória
    op.alter_column("ano_letivo", "data_inicio", existing_type=sa.Date(), nullable=False)  # Torna data_inicio obrigatória
    op.alter_column("ano_letivo", "data_fim", existing_type=sa.Date(), nullable=False)     # Torna data_fim obrigatória

    op.create_unique_constraint("uq_ano_letivo_descricao", "ano_letivo", ["descricao"])  # Restringe descricao única
    op.create_check_constraint("ck_ano_letivo_datas", "ano_letivo", "data_inicio <= data_fim")  # Garante ordem de datas

    op.drop_column("ano_letivo", "ano")                 # Remove coluna ano
    op.drop_column("ano_letivo", "ativo")               # Remove coluna ativo

    op.drop_index("ix_periodo_ano_datas", table_name="ano_letivo_periodo")  # Remove índice auxiliar
    op.drop_table("ano_letivo_periodo")                   # Remove tabela de períodos


def downgrade():                                         # Reverte alterações
    op.create_table(                                     # Recria tabela de períodos
        "ano_letivo_periodo",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ano_letivo_id", sa.Integer(), sa.ForeignKey("ano_letivo.id"), nullable=False),
        sa.Column("data_inicio", sa.Date(), nullable=False),
        sa.Column("data_fim", sa.Date(), nullable=False),
        sa.CheckConstraint("data_inicio <= data_fim", name="ck_periodo_datas"),
        sa.UniqueConstraint("ano_letivo_id", "data_inicio", "data_fim", name="uq_periodo_datas"),
    )
    op.create_index("ix_periodo_ano_datas", "ano_letivo_periodo", ["ano_letivo_id", "data_inicio", "data_fim"])  # Índice

    op.add_column("ano_letivo", sa.Column("ano", sa.Integer(), nullable=True))   # Recria coluna ano
    op.add_column("ano_letivo", sa.Column("ativo", sa.Boolean(), nullable=True)) # Recria coluna ativo

    op.execute("""
        UPDATE ano_letivo                              -- Recupera ano a partir da descrição
        SET ano = NULLIF(regexp_replace(descricao, '\D', '', 'g'), '')::int,
            ativo = true
    """)

    op.drop_constraint("ck_ano_letivo_datas", "ano_letivo", type_="check")      # Remove check de datas
    op.drop_constraint("uq_ano_letivo_descricao", "ano_letivo", type_="unique")  # Remove restrição de descricao

    op.drop_column("ano_letivo", "descricao")          # Remove coluna descricao
    op.drop_column("ano_letivo", "data_inicio")         # Remove coluna data_inicio
    op.drop_column("ano_letivo", "data_fim")            # Remove coluna data_fim

    op.alter_column("ano_letivo", "ano", existing_type=sa.Integer(), nullable=False, server_default="0")    # Anula nulos
    op.alter_column("ano_letivo", "ativo", existing_type=sa.Boolean(), nullable=False, server_default=sa.text("true"))
