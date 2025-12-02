"""Add flashcards and quiz tables

Revision ID: 202411010001
Revises: 279e6de8b321
Create Date: 2024-11-01 00:01:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "202411010001"
down_revision: Union[str, Sequence[str], None] = "279e6de8b321"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("example")
    op.create_table(
        "flashcards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("source_word", sa.String(length=255), nullable=False),
        sa.Column("source_language", sa.String(length=8), nullable=False, server_default="es"),
        sa.Column("translated_word", sa.String(length=255), nullable=False),
        sa.Column("native_language", sa.String(length=8), nullable=False, server_default="en"),
        sa.Column("example_sentence", sa.String(length=1024), nullable=True),
        sa.Column("example_sentence_translated", sa.String(length=1024), nullable=True),
        sa.Column("difficulty_level", sa.String(length=16), nullable=True),
        sa.Column("is_manual", sa.Boolean(), nullable=False, server_default=sa.sql.expression.true()),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("incorrect_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_word", "source_language", "native_language", name="uq_flashcard_word_lang"),
    )
    op.create_table(
        "quizzes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("label", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "quiz_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("quiz_id", sa.Integer(), nullable=False),
        sa.Column("flashcard_id", sa.Integer(), nullable=False),
        sa.Column("user_answer", sa.String(length=512), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["flashcard_id"], ["flashcards.id"]),
        sa.ForeignKeyConstraint(["quiz_id"], ["quizzes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("quiz_items")
    op.drop_table("quizzes")
    op.drop_table("flashcards")
    op.create_table(
        "example",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("hello_world", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
