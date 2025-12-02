"""Interpret request/response schemas."""

from typing import Optional

from pydantic import BaseModel, Field


class InterpretRequest(BaseModel):
    """Request schema for text interpretation."""

    text: str = Field(..., min_length=1)
    native_language: str = Field(..., min_length=2, max_length=10)


class InterpretedItem(BaseModel):
    """A single interpreted vocabulary item."""

    source_word: str
    translated_word: str
    native_language: Optional[str] = None
    source_language: Optional[str] = None
    example_sentence: Optional[str] = None
    example_sentence_translated: Optional[str] = None


class InterpretResponse(BaseModel):
    """Response schema for text interpretation."""

    items: list[InterpretedItem]
