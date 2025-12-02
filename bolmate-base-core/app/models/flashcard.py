from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class Flashcard(Base):
    __tablename__ = "flashcards"
    __table_args__ = (
        UniqueConstraint("source_word", "source_language", "native_language", name="uq_flashcard_word_lang"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    source_word = Column(String(255), nullable=False)
    source_language = Column(String(8), nullable=False, default="es")
    translated_word = Column(String(255), nullable=False)
    native_language = Column(String(8), nullable=False, default="en")
    example_sentence = Column(String(1024), nullable=True)
    example_sentence_translated = Column(String(1024), nullable=True)
    difficulty_level = Column(String(16), nullable=True)
    is_manual = Column(Boolean, nullable=False, default=True)
    correct_count = Column(Integer, nullable=False, default=0)
    incorrect_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="flashcards")
