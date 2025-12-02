"""Quiz request/response schemas."""

from typing import Optional

from pydantic import BaseModel, Field


class QuizQuestionResponse(BaseModel):
    """Response schema for a quiz question."""

    flashcard_id: int
    source_word: str
    source_language: str
    native_language: str
    translated_word: str
    correct_count: int
    incorrect_count: int


class SubmitQuizAnswerRequest(BaseModel):
    """Request schema for submitting a quiz answer."""

    flashcard_id: int = Field(..., gt=0)
    answer: str = Field(..., min_length=1, max_length=512)


class QuizStats(BaseModel):
    """Quiz statistics."""

    correct_count: int
    incorrect_count: int


class QuizAnswerResponse(BaseModel):
    """Response schema for a quiz answer submission."""

    correct: bool
    correctAnswer: str
    stats: QuizStats
    hint: Optional[str] = None
    example_sentence: Optional[str] = None
    example_translation: Optional[str] = None


class GeneratedQuizQuestion(BaseModel):
    """A generated quiz question."""

    question: str
    type: str
    answer: str
    options: Optional[list[str]] = None


class GenerateQuizRequest(BaseModel):
    """Request schema for generating a quiz."""

    num_questions: Optional[int] = Field(5, ge=1, le=50)
    source_language: Optional[str] = Field(None, max_length=10)
    difficulty_level: Optional[str] = Field(None, max_length=10)


class GenerateQuizResponse(BaseModel):
    """Response schema for generated quiz."""

    questions: list[GeneratedQuizQuestion]
