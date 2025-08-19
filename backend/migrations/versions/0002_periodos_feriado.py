"""add ano letivo periodos and feriado origem

Revision ID: 0002_periodos
Revises: 0001_turmas
Create Date: 2024-10-11
"""
from alembic import op
import sqlalchemy as sa

# Revisão
revision = '0002_periodos'
# Revisão anterior
down_revision = '0001_turmas'
# Branches
branch_labels = None
# Dependências
depends_on = None

# Upgrade

def upgrade():
    # Tabela de períodos do ano letivo
    op.create_table(
        'ano_letivo_periodo',  # Nome da tabela
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),  # Identificador
        sa.Column('ano_letivo_id', sa.Integer(), sa.ForeignKey('ano_letivo.id'), nullable=False),  # FK ano letivo
        sa.Column('data_inicio', sa.Date(), nullable=False),  # Data inicial
        sa.Column('data_fim', sa.Date(), nullable=False),  # Data final
        sa.CheckConstraint('data_inicio <= data_fim', name='ck_periodo_datas'),  # Validação de datas
        sa.UniqueConstraint('ano_letivo_id', 'data_inicio', 'data_fim', name='uq_periodo_datas')  # Faixa única
    )
    # Índice auxiliar para verificação de sobreposição
    op.create_index('ix_periodo_ano_datas', 'ano_letivo_periodo', ['ano_letivo_id', 'data_inicio', 'data_fim'])  # Cria índice
    # Remove datas da tabela ano_letivo
    op.drop_column('ano_letivo', 'data_inicio')  # Remove início
    op.drop_column('ano_letivo', 'data_fim')  # Remove fim
    # Enum de origem de feriado
    origem_enum = sa.Enum('ESCOLA', 'NACIONAL', name='origem_feriado_enum')  # Define enum
    origem_enum.create(op.get_bind(), checkfirst=True)  # Cria enum
    # Novas colunas em feriado
    op.add_column('feriado', sa.Column('ano_letivo_id', sa.Integer(), nullable=False))  # Adiciona FK
    op.add_column('feriado', sa.Column('origem', origem_enum, nullable=False))  # Adiciona origem
    op.alter_column('feriado', 'descricao', existing_type=sa.Text(), nullable=False)  # Torna descrição obrigatória
    op.create_foreign_key('fk_feriado_ano', 'feriado', 'ano_letivo', ['ano_letivo_id'], ['id'])  # FK com ano_letivo
    op.create_unique_constraint('uq_feriado_ano_data_origem', 'feriado', ['ano_letivo_id', 'data', 'origem'])  # Restrição de unicidade

# Downgrade

def downgrade():
    # Remove restrições de feriado
    op.drop_constraint('uq_feriado_ano_data_origem', 'feriado', type_='unique')  # Remove unique
    op.drop_constraint('fk_feriado_ano', 'feriado', type_='foreignkey')  # Remove FK
    op.drop_column('feriado', 'origem')  # Remove origem
    op.drop_column('feriado', 'ano_letivo_id')  # Remove FK
    op.alter_column('feriado', 'descricao', existing_type=sa.Text(), nullable=True)  # Torna descrição opcional
    origem_enum = sa.Enum('ESCOLA', 'NACIONAL', name='origem_feriado_enum')  # Enum de origem
    origem_enum.drop(op.get_bind(), checkfirst=True)  # Remove enum
    # Restaura colunas de ano_letivo
    op.add_column('ano_letivo', sa.Column('data_inicio', sa.Date(), nullable=False))  # Recria início
    op.add_column('ano_letivo', sa.Column('data_fim', sa.Date(), nullable=False))  # Recria fim
    op.create_check_constraint('ck_ano_letivo_datas', 'ano_letivo', 'data_inicio <= data_fim')  # Recria validação
    # Remove tabela de períodos
    op.drop_index('ix_periodo_ano_datas', table_name='ano_letivo_periodo')  # Remove índice
    op.drop_table('ano_letivo_periodo')  # Remove tabela
