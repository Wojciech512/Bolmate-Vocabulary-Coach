"""Pydantic schemas for request/response validation."""

from .flashcard import (
    CreateFlashcardRequest,
    FlashcardResponse,
    EnrichFlashcardsRequest,
)
from .quiz import (
    QuizQuestionResponse,
    SubmitQuizAnswerRequest,
    QuizAnswerResponse,
    GenerateQuizRequest,
    GenerateQuizResponse,
    GeneratedQuizQuestion,
)
from .interpret import InterpretRequest, InterpretResponse, InterpretedItem
from .language import Language, LanguagesResponse

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
