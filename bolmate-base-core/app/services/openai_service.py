import json
import logging
from typing import Any, Dict, List, Optional

from openai import APIConnectionError, APIStatusError, OpenAI

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client: Optional[OpenAI] = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def generate_example_and_hint(
    source_word: str, translated_word: str, source_language: str, native_language: str
) -> Dict[str, Optional[str]]:
    if not settings.openai_api_key:
        return {"hint": None, "example_sentence": None, "example_sentence_translated": None}

    prompt = (
        "You are a language tutor. Provide a short A1 example sentence using the"
        f" word '{source_word}' in {source_language}. Include its translation into"
        f" {native_language}. Keep it concise."
    )
    try:
        response = get_client().chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": "You respond in JSON with keys sentence and translation.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
        )
        content = response.choices[0].message.content or ""
        # naive parse: expect JSON-like
        data = json.loads(content)
        sentence = data.get("sentence")
        translation = data.get("translation")
    except (APIStatusError, APIConnectionError, json.JSONDecodeError, Exception) as exc:  # type: ignore
        logger.warning("OpenAI hint generation failed: %s", exc)
        return {"hint": None, "example_sentence": None, "example_sentence_translated": None}

    hint = f"Example: {sentence} — {translation}" if sentence and translation else None
    return {
        "hint": hint,
        "example_sentence": sentence,
        "example_sentence_translated": translation,
    }


def generate_quiz_questions(
    flashcards: List[Dict[str, Any]],
    num_questions: int,
    native_language: str,
    quiz_types: List[str] | None = None,
) -> List[Dict[str, Any]]:
    if not settings.openai_api_key:
        return _fallback_quiz_questions(flashcards, num_questions)

    quiz_types = quiz_types or ["multiple_choice", "fill_in"]
    cards_description = "; ".join(
        [
            f"{c['source_word']} ({c['source_language']}) -> {c['translated_word']}"
            for c in flashcards
        ]
    )
    prompt = (
        "Create quiz questions for the following flashcards."
        " Provide diverse question types (" + ", ".join(quiz_types) + ")"
        f". The learner native language is {native_language}."
        " Return JSON with an array under key 'questions' with fields: question, type, options (optional), answer."
        f" Flashcards: {cards_description}"
    )
    try:
        response = get_client().chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a quiz generator returning JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
        )
        import json

        data = json.loads(response.choices[0].message.content or "{}")
        questions = data.get("questions")
        if isinstance(questions, list):
            return questions[:num_questions]
    except Exception as exc:  # broad to log fallback
        logger.warning("OpenAI quiz generation failed: %s", exc)
    return _fallback_quiz_questions(flashcards, num_questions)


def interpret_text_to_flashcards(
    extracted_text: str,
    native_language: str,
    source_language: str,
) -> List[Dict[str, str]]:
    """Use LLM to normalize newline-separated words into flashcard entries."""
    if not settings.openai_api_key:
        return _naive_interpret(extracted_text, native_language, source_language)

    prompt = (
        "You receive raw words or short phrases, one per line. For each,"
        " detect the language if absent (assume source language is"
        f" {source_language} if unclear) and translate into {native_language}."
        " Return JSON array with objects containing source_word, source_language,"
        " translated_word, native_language."
        f" Raw input:\n{extracted_text}"
    )
    try:
        response = get_client().chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "Return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        import json

        data = json.loads(response.choices[0].message.content or "[]")
        if isinstance(data, list):
            return data
    except Exception as exc:
        logger.warning("OpenAI interpret fallback due to error: %s", exc)
    return _naive_interpret(extracted_text, native_language, source_language)


def _naive_interpret(text: str, native_language: str, source_language: str) -> List[Dict[str, str]]:
    words = [line.strip() for line in text.splitlines() if line.strip()]
    return [
        {
            "source_word": word,
            "source_language": source_language,
            "translated_word": word,
            "native_language": native_language,
        }
        for word in words
    ]


def _fallback_quiz_questions(flashcards: List[Dict[str, Any]], num_questions: int) -> List[Dict[str, Any]]:
    questions: List[Dict[str, Any]] = []
    for card in flashcards[:num_questions]:
        questions.append(
            {
                "question": f"Translate '{card['source_word']}' to {card['native_language']}",
                "answer": card["translated_word"],
                "type": "fill_in",
            }
        )
    return questions
