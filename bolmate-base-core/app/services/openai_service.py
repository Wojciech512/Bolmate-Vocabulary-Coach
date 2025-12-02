from __future__ import annotations

import base64
import logging
from typing import Any, Dict, List

from openai import OpenAI

from config import get_settings

logger = logging.getLogger(__name__)


def _get_client() -> OpenAI | None:
    settings = get_settings()
    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY not configured; AI features disabled")
        return None
    return OpenAI(api_key=settings.openai_api_key)


def generate_hint_for_flashcard(
    source_word: str,
    translated_word: str,
    native_language: str,
    source_language: str = "es",
) -> dict[str, str]:
    client = _get_client()
    if not client:
        return {}

    settings = get_settings()
    prompt = (
        "You are a concise language tutor. "
        f"The learner's native language is {native_language}. "
        f"Provide a one-sentence hint and one short example sentence in {source_language} for the word '{source_word}' "
        f"meaning '{translated_word}'. Respond as JSON with keys hint, example_sentence, example_translation."
    )
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=settings.openai_temperature,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        message = response.choices[0].message.content
        return message and _safe_parse_json(message) or {}
    except Exception as exc:  # pragma: no cover - external dependency
        logger.exception("Failed to generate hint: %s", exc)
        return {}


def enrich_flashcards(
    words: List[Dict[str, Any]], native_language: str
) -> List[Dict[str, Any]]:
    client = _get_client()
    if not client:
        return words
    settings = get_settings()
    prompt = (
        "You are enriching flashcards. For each item provide an example_sentence, example_translation, "
        "and difficulty_level (A1/A2/B1). Return JSON array in same order with the new fields merged."
    )
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=settings.openai_temperature,
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": f"Native language: {native_language}. Items: {words}",
                },
            ],
            response_format={"type": "json_object"},
        )
        message = response.choices[0].message.content
        parsed = _safe_parse_json(message)
        return parsed.get("items", words) if isinstance(parsed, dict) else words
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to enrich flashcards: %s", exc)
        return words


def generate_quiz_questions(
    cards: List[Dict[str, Any]], num_questions: int
) -> List[Dict[str, Any]]:
    client = _get_client()
    if not client or not cards:
        return _fallback_quiz(cards, num_questions)
    settings = get_settings()
    prompt = (
        "Create diverse quiz questions (translation, multiple_choice, fill_in). "
        "Return JSON with an array 'questions' where each item has question, type, answer and optional options."
    )
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=settings.openai_temperature,
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": f"Use these flashcards: {cards[:num_questions]}",
                },
            ],
            response_format={"type": "json_object"},
        )
        message = response.choices[0].message.content
        parsed = _safe_parse_json(message)
        if isinstance(parsed, dict) and isinstance(parsed.get("questions"), list):
            return parsed["questions"][:num_questions]
    except Exception as exc:  # pragma: no cover
        logger.exception("Quiz generation failed: %s", exc)
    return _fallback_quiz(cards, num_questions)


def interpret_text_with_ai(text: str, native_language: str) -> List[Dict[str, Any]]:
    client = _get_client()
    if not client:
        return []
    settings = get_settings()
    prompt = (
        "Extract distinct vocabulary items from the provided text. Detect source language for each word and translate "
        f"into {native_language}. Respond as JSON with array 'items' of objects: source_word, source_language, translated_word, native_language."
    )
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=settings.openai_temperature,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text},
            ],
            response_format={"type": "json_object"},
        )
        message = response.choices[0].message.content
        parsed = _safe_parse_json(message)
        return parsed.get("items", []) if isinstance(parsed, dict) else []
    except Exception as exc:  # pragma: no cover
        logger.exception("Interpretation failed: %s", exc)
        return []


def translate_flashcards(
    cards: List[Dict[str, Any]], target_language: str
) -> List[Dict[str, Any]]:
    """Translate provided flashcards to the target language while keeping structure intact."""

    client = _get_client()
    if not client or not cards:
        # Fallback: keep the structure and simply mark the new language without altering content.
        return [
            {
                **card,
                "native_language": target_language,
            }
            for card in cards
        ]

    settings = get_settings()
    system_prompt = (
        "You are a multilingual flashcard translator. Preserve each flashcard's id and structure. "
        "Translate all learner-facing text fields (e.g., translated_word, example_sentence, "
        "example_sentence_translated, notes, hints, explanations) into the target language while "
        "keeping source_word and source_language unchanged. Return JSON object with 'flashcards' "
        "array in the same order."
    )

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=settings.openai_temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"Target language: {target_language}. Flashcards: {cards}",
                },
            ],
            response_format={"type": "json_object"},
        )
        message = response.choices[0].message.content
        parsed = _safe_parse_json(message)
        if isinstance(parsed, dict) and isinstance(parsed.get("flashcards"), list):
            return parsed["flashcards"]
    except Exception as exc:  # pragma: no cover - external dependency
        logger.exception("Translation failed: %s", exc)

    return [
        {
            **card,
            "native_language": target_language,
        }
        for card in cards
    ]


def encode_file_to_base64(file_bytes: bytes) -> str:
    return base64.b64encode(file_bytes).decode("utf-8")


def _safe_parse_json(text: str) -> Dict[str, Any]:
    import json

    try:
        return json.loads(text)
    except Exception:
        try:
            return json.loads(text.strip().split("\n")[-1])
        except Exception:
            return {}


def _fallback_quiz(
    cards: List[Dict[str, Any]], num_questions: int
) -> List[Dict[str, Any]]:
    questions: List[Dict[str, Any]] = []
    for card in cards[:num_questions]:
        questions.append(
            {
                "question": f"Translate '{card.get('source_word')}' to {card.get('native_language', 'your language')}",
                "type": "translation",
                "answer": card.get("translated_word"),
            }
        )
    return questions
