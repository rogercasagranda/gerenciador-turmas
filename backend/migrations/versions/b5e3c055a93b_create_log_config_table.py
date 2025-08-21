"""create log_config table

Revision ID: b5e3c055a93b
Revises: 8d83193b4616
Create Date: 2025-03-09 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'b5e3c055a93b'
down_revision = '8d83193b4616'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'log_config',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('screen', sa.Text(), nullable=False, unique=True),
        sa.Column('create_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('read_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('update_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('delete_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('updated_by', sa.Integer(), sa.ForeignKey('usuarios.id_usuario'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_log_config_screen', 'log_config', ['screen'])
    op.create_index('idx_log_config_updated_at', 'log_config', ['updated_at'])

    op.execute(
        """
        CREATE OR REPLACE FUNCTION trg_log_config_set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_log_config_updated_at
        BEFORE UPDATE ON log_config
        FOR EACH ROW
        EXECUTE PROCEDURE trg_log_config_set_updated_at();
        """
    )

    conn = op.get_bind()
    if conn.execute(text("SELECT to_regclass('logconfig')")).scalar():
        conn.execute(text(
            """
            INSERT INTO log_config (screen, create_enabled, read_enabled, update_enabled, delete_enabled)
            SELECT entidade, habilitado, habilitado, habilitado, habilitado FROM logconfig
            ON CONFLICT (screen) DO NOTHING
            """
        ))
        op.drop_table('logconfig')


def downgrade():
    op.execute("DROP TRIGGER IF EXISTS trg_log_config_updated_at ON log_config")
    op.execute("DROP FUNCTION IF EXISTS trg_log_config_set_updated_at")
    op.drop_index('idx_log_config_updated_at', table_name='log_config')
    op.drop_index('idx_log_config_screen', table_name='log_config')

    conn = op.get_bind()
    conn.execute(text(
        """
        CREATE TABLE IF NOT EXISTS logconfig (
            entidade VARCHAR(80) PRIMARY KEY,
            habilitado BOOLEAN NOT NULL DEFAULT TRUE
        )
        """
    ))
    conn.execute(text(
        """
        INSERT INTO logconfig (entidade, habilitado)
        SELECT screen, create_enabled FROM log_config
        ON CONFLICT (entidade) DO NOTHING
        """
    ))
    op.drop_table('log_config')
