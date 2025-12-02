from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)

from app.db.session import Base


class Flashcard(Base):
    __tablename__ = "flashcards"
    __table_args__ = (
        UniqueConstraint(
            "source_word",
            "source_language",
            "native_language",
            name="uq_flashcard_source",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    source_word = Column(String(255), nullable=False)
    source_language = Column(String(10), nullable=False, default="es")
    translated_word = Column(String(255), nullable=False)
    native_language = Column(String(10), nullable=False, default="pl")
    example_sentence = Column(String(512), nullable=True)
    example_sentence_translated = Column(String(512), nullable=True)
    difficulty_level = Column(String(10), nullable=True)
    is_manual = Column(Boolean, default=True, nullable=False)
    correct_count = Column(Integer, default=0, nullable=False)
    incorrect_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
