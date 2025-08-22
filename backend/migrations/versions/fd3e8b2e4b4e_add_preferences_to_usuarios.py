"""add preferences column to usuarios

Revision ID: fd3e8b2e4b4e
Revises: c64b1f765a7b
Create Date: 2024-05-30
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fd3e8b2e4b4e'
down_revision = 'c64b1f765a7b'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('usuarios', sa.Column('preferences', sa.JSON(), nullable=False, server_default=sa.text('{}')))


def downgrade():
    op.drop_column('usuarios', 'preferences')
