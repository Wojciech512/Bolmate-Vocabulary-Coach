from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean, func
from sqlalchemy.dialects.postgresql import JSON

from app.db.session import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class QuizItem(Base):
    __tablename__ = "quiz_items"

    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    flashcard_id = Column(Integer, ForeignKey("flashcards.id"), nullable=False)
    user_answer = Column(String(512), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    metadata = Column(JSON, nullable=True)
