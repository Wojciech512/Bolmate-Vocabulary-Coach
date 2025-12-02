from __future__ import annotations

import base64
import hashlib
import logging
from functools import lru_cache
from typing import Any, Dict, List

from openai import OpenAI

from config import get_settings

logger = logging.getLogger(__name__)

# In-memory cache for AI responses (consider Redis in production)
_response_cache: Dict[str, Any] = {}


def _cache_key(*args) -> str:
    """Generate cache key from arguments."""
    return hashlib.md5(str(args).encode()).hexdigest()


def _get_cached_response(key: str) -> Any:
    """Get cached response if available."""
    return _response_cache.get(key)


def _set_cached_response(key: str, value: Any) -> None:
    """Cache response with size limit."""
    if len(_response_cache) > 1000:  # Limit cache size
        _response_cache.pop(next(iter(_response_cache)))
    _response_cache[key] = value


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
    # Check cache first
    cache_key = _cache_key("hint", source_word, translated_word, native_language, source_language)
    cached = _get_cached_response(cache_key)
    if cached:
        return cached

    client = _get_client()
    if not client:
        return {}

    settings = get_settings()
    prompt = (
        f"Language tutor. Native: {native_language}. "
        f"For '{source_word}' ({translated_word}): short hint + example in {source_language}. "
        f"JSON: hint, example_sentence, example_translation."
    )
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.7,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        message = response.choices[0].message.content
        result = message and _safe_parse_json(message) or {}
        _set_cached_response(cache_key, result)
        return result
    except Exception as exc:  # pragma: no cover - external dependency
        logger.exception("Failed to generate hint: %s", exc)
        return {}


def enrich_flashcards(
    words: List[Dict[str, Any]], native_language: str
) -> List[Dict[str, Any]]:
    client = _get_client()
    if not client:
        return words

    # Limit batch size to 50 cards
    MAX_BATCH = 50
    if len(words) > MAX_BATCH:
        logger.info(f"Processing {len(words)} cards in batches of {MAX_BATCH}")
        batch1 = enrich_flashcards(words[:MAX_BATCH], native_language)
        batch2 = enrich_flashcards(words[MAX_BATCH:], native_language)
        return batch1 + batch2

    settings = get_settings()
    prompt = (
        "Enrich flashcards: add example_sentence, example_translation, difficulty_level (A1/A2/B1). "
        "JSON array same order with new fields."
    )
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.5,
            max_tokens=1500,
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": f"Native: {native_language}. Items: {words}",
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
    # Use free fallback for ≤5 questions
    if num_questions <= 5:
        return _fallback_quiz(cards, num_questions)

    client = _get_client()
    if not client or not cards:
        return _fallback_quiz(cards, num_questions)

    settings = get_settings()
    prompt = (
        "Create diverse quiz (translation, multiple_choice, fill_in). "
        "JSON with 'questions' array: question, type, answer, optional options."
    )
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.5,
            max_tokens=1500,
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": f"Flashcards: {cards[:num_questions]}",
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
    # Check cache first
    cache_key = _cache_key("interpret", text, native_language)
    cached = _get_cached_response(cache_key)
    if cached:
        return cached

    client = _get_client()
    if not client:
        return []

    settings = get_settings()
    prompt = (
        "Extract vocabulary from text. Preserve translation pairs (e.g. 'si - yes'). "
        f"Merge duplicates. Translate to {native_language}. "
        f"IMPORTANT: source_language ≠ {native_language}. Only extract words NOT in {native_language}. "
        "JSON array 'items': source_word, source_language, translated_word, native_language."
    )
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.3,
            max_tokens=2000,
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
        # Also ensure source_word != translated_word to catch untranslated items
        filtered_items = []
        for item in items:
            source_lang = item.get("source_language", "").lower()
            source_word = item.get("source_word", "").strip()
            translated_word = item.get("translated_word", "").strip()

            # Skip if source language matches native language
            if source_lang == native_language.lower():
                continue

            # Skip if source and translation are identical (untranslated)
            if source_word.lower() == translated_word.lower():
                continue

            filtered_items.append(item)

        _set_cached_response(cache_key, filtered_items)
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
    # Cache by image hash
    image_hash = hashlib.md5(image_content).hexdigest()
    cache_key = _cache_key("vision", image_hash, native_language)
    cached = _get_cached_response(cache_key)
    if cached:
        return cached

    client = _get_client()
    if not client:
        return []

    settings = get_settings()
    base64_image = encode_file_to_base64(image_content)

    prompt = (
        "Extract vocabulary from image. Preserve translation pairs (e.g. 'si - yes'). "
        f"Merge duplicates. Translate to {native_language}. "
        f"IMPORTANT: source_language ≠ {native_language}. Only extract words NOT in {native_language}. "
        "JSON array 'items': source_word, source_language, translated_word, native_language."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # 80% cheaper than gpt-4o
            max_tokens=2000,
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
        # Also ensure source_word != translated_word to catch untranslated items
        filtered_items = []
        for item in items:
            source_lang = item.get("source_language", "").lower()
            source_word = item.get("source_word", "").strip()
            translated_word = item.get("translated_word", "").strip()

            # Skip if source language matches native language
            if source_lang == native_language.lower():
                continue

            # Skip if source and translation are identical (untranslated)
            if source_word.lower() == translated_word.lower():
                continue

            filtered_items.append(item)

        _set_cached_response(cache_key, filtered_items)
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

    # Limit batch size to 50 cards
    MAX_BATCH = 50
    if len(cards) > MAX_BATCH:
        logger.info(f"Translating {len(cards)} cards in batches of {MAX_BATCH}")
        batch1 = translate_flashcards(cards[:MAX_BATCH], target_language)
        batch2 = translate_flashcards(cards[MAX_BATCH:], target_language)
        return batch1 + batch2

    settings = get_settings()
    system_prompt = (
        "Multilingual flashcard translator. Preserve id/structure. "
        "Translate learner-facing fields (translated_word, example_sentence, notes, hints) to target language. "
        "Keep source_word, source_language unchanged. JSON 'flashcards' array same order."
    )

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.3,
            max_tokens=2000,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"Target: {target_language}. Cards: {cards}",
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
