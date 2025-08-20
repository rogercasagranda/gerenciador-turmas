"""create table ano_letivo

Revision ID: 8d83193b4616
Revises: 0001_turmas
Create Date: 2025-08-20 00:34:33.016193
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8d83193b4616'
down_revision = '0001_turmas'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'ano_letivo',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('descricao', sa.String(), nullable=False),
        sa.Column('data_inicio', sa.Date(), nullable=False),
        sa.Column('data_fim', sa.Date(), nullable=False),
    )


def downgrade():
    op.drop_table('ano_letivo')
