from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    label = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("QuizItem", back_populates="quiz", cascade="all, delete-orphan")


class QuizItem(Base):
    __tablename__ = "quiz_items"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    flashcard_id = Column(Integer, ForeignKey("flashcards.id"), nullable=False)
    user_answer = Column(String(512), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    metadata = Column(JSON, nullable=True)

    quiz = relationship("Quiz", back_populates="items")
    flashcard = relationship("Flashcard")
