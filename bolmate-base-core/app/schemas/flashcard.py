"""Flashcard request/response schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CreateFlashcardRequest(BaseModel):
    """Request schema for creating a flashcard."""

    source_word: str = Field(..., min_length=1, max_length=255)
    translated_word: str = Field(..., min_length=1, max_length=255)
    native_language: Optional[str] = Field(None, max_length=10)
    source_language: Optional[str] = Field(None, max_length=10)
    is_manual: Optional[bool] = Field(True)
    difficulty_level: Optional[str] = Field(None, max_length=10)
    example_sentence: Optional[str] = Field(None, max_length=512)
    example_sentence_translated: Optional[str] = Field(None, max_length=512)


class FlashcardResponse(BaseModel):
    """Response schema for a flashcard."""

    id: int
    source_word: str
    source_language: str
    translated_word: str
    native_language: str
    example_sentence: Optional[str]
    example_sentence_translated: Optional[str]
    difficulty_level: Optional[str]
    is_manual: bool
    correct_count: int
    incorrect_count: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class EnrichFlashcardsRequest(BaseModel):
    """Request schema for enriching flashcards."""

    ids: list[int] = Field(..., min_length=1)
    native_language: Optional[str] = Field(None, max_length=10)


class BulkCreateFlashcardsRequest(BaseModel):
    """Request schema for bulk creating flashcards."""

    flashcards: list[CreateFlashcardRequest] = Field(..., min_length=1)
