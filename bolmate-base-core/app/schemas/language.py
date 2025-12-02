"""Schemas for language switching and translation operations."""

from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.flashcard import FlashcardResponse


class Language(BaseModel):
    """Single language representation."""

    code: str
    name: str


class LanguagesResponse(BaseModel):
    """Response containing list of available languages."""

    languages: List[Language]


class SwitchLanguageRequest(BaseModel):
    """Payload for translating flashcards into a new target language."""

    target_language: str = Field(..., min_length=2, max_length=10)
    flashcard_ids: Optional[List[int]] = Field(None, min_items=1)
    force_retranslate: bool = False


class SwitchLanguageMeta(BaseModel):
    """Metadata that accompanies a language switch operation."""

    target_language: str
    translated_count: int
    skipped_count: int
    force_retranslate: bool


class SwitchLanguageResponse(BaseModel):
    """Response containing translated flashcards and operation details."""

    flashcards: List[FlashcardResponse]
    meta: SwitchLanguageMeta
