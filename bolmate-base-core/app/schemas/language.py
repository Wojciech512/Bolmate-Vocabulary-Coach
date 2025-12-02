"""Language schemas."""

from pydantic import BaseModel


class Language(BaseModel):
    """A supported language."""

    code: str
    label: str


class LanguagesResponse(BaseModel):
    """Response schema for languages list."""

    languages: list[Language]
