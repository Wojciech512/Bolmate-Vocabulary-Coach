"""Initial setup for flashcards and quizzes

Revision ID: 279e6de8b321
Revises:
Create Date: 2025-11-01 14:50:13.206519

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '279e6de8b321'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    op.create_table(
        'flashcards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('source_word', sa.String(length=255), nullable=False),
        sa.Column('source_language', sa.String(length=10), nullable=False, server_default='es'),
        sa.Column('translated_word', sa.String(length=255), nullable=False),
        sa.Column('native_language', sa.String(length=10), nullable=False, server_default='pl'),
        sa.Column('example_sentence', sa.String(length=512), nullable=True),
        sa.Column('example_sentence_translated', sa.String(length=512), nullable=True),
        sa.Column('difficulty_level', sa.String(length=10), nullable=True),
        sa.Column('is_manual', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('correct_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('incorrect_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('source_word', 'source_language', 'native_language', name='uq_flashcard_source')
    )

    op.create_table(
        'quizzes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'quiz_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quiz_id', sa.Integer(), nullable=False),
        sa.Column('flashcard_id', sa.Integer(), nullable=False),
        sa.Column('user_answer', sa.String(length=512), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['flashcard_id'], ['flashcards.id']),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('quiz_items')
    op.drop_table('quizzes')
    op.drop_table('flashcards')
    op.drop_table('users')
