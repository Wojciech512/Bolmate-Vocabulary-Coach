"""create users table

Revision ID: 0001
Revises: 
Create Date: 2024-01-01
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table('users')
