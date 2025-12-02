"""Pydantic schemas for request/response validation."""

from .flashcard import (
    CreateFlashcardRequest,
    EnrichFlashcardsRequest,
    FlashcardResponse,
)
from .interpret import InterpretedItem, InterpretRequest, InterpretResponse
from .language import Language, LanguagesResponse
from .quiz import (
    GeneratedQuizQuestion,
    GenerateQuizRequest,
    GenerateQuizResponse,
    QuizAnswerResponse,
    QuizQuestionResponse,
    SubmitQuizAnswerRequest,
)

__all__ = [
    "CreateFlashcardRequest",
    "FlashcardResponse",
    "EnrichFlashcardsRequest",
    "QuizQuestionResponse",
    "SubmitQuizAnswerRequest",
    "QuizAnswerResponse",
    "GenerateQuizRequest",
    "GenerateQuizResponse",
    "GeneratedQuizQuestion",
    "InterpretRequest",
    "InterpretResponse",
    "InterpretedItem",
    "Language",
    "LanguagesResponse",
]
