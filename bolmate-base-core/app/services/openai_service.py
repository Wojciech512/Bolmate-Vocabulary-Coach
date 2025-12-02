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
        "Extract distinct vocabulary items from the provided text. "
        "If the text contains existing translation pairs (e.g., 'si - yes', 'yo - ich'), preserve and use them. "
        "Merge duplicate words and their variants. Detect source language for each word and translate "
        f"into {native_language}. "
        f"IMPORTANT: source_language MUST BE DIFFERENT from native_language ({native_language}). "
        f"Only extract words that are NOT in {native_language}. "
        "Respond as JSON with array 'items' of objects: source_word, source_language, translated_word, native_language."
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
        items = parsed.get("items", []) if isinstance(parsed, dict) else []

        # Filter out items where source_language == native_language
        filtered_items = [
            item for item in items
            if item.get("source_language", "").lower() != native_language.lower()
        ]

        return filtered_items
    except Exception as exc:  # pragma: no cover
        logger.exception("Interpretation failed: %s", exc)
        return []


def interpret_file_with_ai(
    file_content: bytes, filename: str, mime_type: str | None, native_language: str
) -> List[Dict[str, Any]]:
    """Interpret files with OCR + AI. Supports PDF, DOCX, TXT, images (PNG, JPG)."""
    client = _get_client()
    if not client:
        return []

    settings = get_settings()
    text_content = ""

    # Extract text based on file type
    if mime_type and mime_type.startswith("text"):
        text_content = file_content.decode("utf-8", errors="ignore")
    elif mime_type == "application/pdf":
        text_content = _extract_text_from_pdf(file_content)
    elif (
        mime_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ):
        text_content = _extract_text_from_docx(file_content)
    elif mime_type and mime_type.startswith("image/"):
        # Use OpenAI Vision API for OCR
        return _interpret_image_with_vision(file_content, mime_type, native_language)
    else:
        logger.warning(f"Unsupported file type: {mime_type}")
        return []

    if not text_content.strip():
        return []

    # Use standard text interpretation
    return interpret_text_with_ai(text_content, native_language)


def _extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF file."""
    try:
        import io

        import PyPDF2

        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except ImportError:
        logger.warning("PyPDF2 not installed, cannot process PDF")
        return ""
    except Exception as exc:
        logger.exception(f"Failed to extract text from PDF: {exc}")
        return ""


def _extract_text_from_docx(content: bytes) -> str:
    """Extract text from DOCX file."""
    try:
        import io

        import docx

        doc = docx.Document(io.BytesIO(content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except ImportError:
        logger.warning("python-docx not installed, cannot process DOCX")
        return ""
    except Exception as exc:
        logger.exception(f"Failed to extract text from DOCX: {exc}")
        return ""


def _interpret_image_with_vision(
    image_content: bytes, mime_type: str, native_language: str
) -> List[Dict[str, Any]]:
    """Use OpenAI Vision API for OCR + interpretation."""
    client = _get_client()
    if not client:
        return []

    settings = get_settings()
    base64_image = encode_file_to_base64(image_content)

    prompt = (
        "Extract all vocabulary words from this image. "
        "If the image contains existing translation pairs (e.g., 'si - yes', 'yo - ich'), preserve and use them. "
        "Merge duplicate words and their variants. Detect source language for each word and translate "
        f"into {native_language}. "
        f"IMPORTANT: source_language MUST BE DIFFERENT from native_language ({native_language}). "
        f"Only extract words that are NOT in {native_language}. "
        "Respond as JSON with array 'items' of objects: source_word, source_language, translated_word, native_language."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # Vision model
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            response_format={"type": "json_object"},
        )
        message = response.choices[0].message.content
        parsed = _safe_parse_json(message)
        items = parsed.get("items", []) if isinstance(parsed, dict) else []

        # Filter out items where source_language == native_language
        filtered_items = [
            item for item in items
            if item.get("source_language", "").lower() != native_language.lower()
        ]

        return filtered_items
    except Exception as exc:
        logger.exception(f"Vision API interpretation failed: {exc}")
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
