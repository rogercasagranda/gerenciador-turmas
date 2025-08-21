"""rename columns and add case-insensitive unique index"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c64b1f765a7b'
down_revision = 'b5e3c055a93b'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint('ck_ano_letivo_datas', 'ano_letivo', type_='check')
    op.alter_column('ano_letivo', 'data_inicio', new_column_name='inicio')
    op.alter_column('ano_letivo', 'data_fim', new_column_name='fim')
    op.create_check_constraint('ck_ano_letivo_datas', 'ano_letivo', 'inicio < fim')
    op.create_index(
        'ix_ano_letivo_descricao_ci',
        'ano_letivo',
        [sa.text('lower(descricao)')],
        unique=True,
    )


def downgrade():
    op.drop_index('ix_ano_letivo_descricao_ci', table_name='ano_letivo')
    op.drop_constraint('ck_ano_letivo_datas', 'ano_letivo', type_='check')
    op.alter_column('ano_letivo', 'fim', new_column_name='data_fim')
    op.alter_column('ano_letivo', 'inicio', new_column_name='data_inicio')
    op.create_check_constraint('ck_ano_letivo_datas', 'ano_letivo', 'data_inicio <= data_fim')
