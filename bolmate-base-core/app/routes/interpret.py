from __future__ import annotations

import json
from typing import Any, Dict, List

from flask import Blueprint, jsonify, request

from app.db.session import SessionLocal
from app.models import Flashcard, InterpretJob
from app.services.ai import ai_client
from config import get_settings

interpret_bp = Blueprint("interpret", __name__)
settings = get_settings()


def _normalize_word(word: str) -> str:
    return word.strip().lower()


def _extract_text_from_request() -> tuple[str | None, str | None, str | None]:
    """Return text, filename, and mime type from the request."""
    if request.files:
        file = next(iter(request.files.values()))
        data = file.read()
        mime = file.mimetype or "application/octet-stream"
        text = None
        if mime and mime.startswith("text"):
            text = data.decode("utf-8", errors="ignore")
        elif mime in {"application/pdf", "image/png", "image/jpeg"}:
            if ai_client.enabled:
                from base64 import b64encode

                encoded = b64encode(data).decode("utf-8")
                text = _vision_to_text(encoded, mime)
        return text, file.filename, mime

    if request.is_json:
        payload = request.get_json(silent=True) or {}
        return payload.get("text"), None, "application/json"

    if request.data:
        return request.data.decode("utf-8", errors="ignore"), None, request.content_type

    return None, None, None


def _vision_to_text(b64_data: str, mime: str) -> str | None:
    if not ai_client.enabled or not ai_client.client:
        return None
    try:
        result = ai_client.client.chat.completions.create(
            model=settings.openai_vision_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract vocabulary words from this image or PDF."},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime};base64,{b64_data}"},
                        },
                    ],
                }
            ],
        )
        return result.choices[0].message.content
    except Exception:
        return None


@interpret_bp.post("")
def interpret():
    native_language = request.form.get("native_language") or request.args.get("native_language")
    if not native_language and request.is_json:
        native_language = (request.get_json(silent=True) or {}).get("native_language")
    native_language = native_language or settings.default_native_language

    text, filename, mime = _extract_text_from_request()
    if not text:
        return jsonify({"error": "No text or file provided"}), 400

    words = _normalize_candidates(text)
    candidates = [
        {
            "source_word": word,
            "translated_word": word,  # temporary placeholder until enriched
            "source_language": settings.default_source_language,
            "native_language": native_language,
        }
        for word in words
    ]

    enriched = ai_client.enrich_flashcards(candidates)

    session = SessionLocal()
    job = None
    try:
        job = InterpretJob(
            original_filename=filename,
            content_type=mime,
            status="processed",
            result_summary=json.dumps(enriched),
        )
        session.add(job)
        session.commit()
    finally:
        session.close()

    return jsonify({"candidates": enriched, "job_id": job.id if job else None}), 200


@interpret_bp.post("/save")
def save_interpreted():
    payload = request.get_json(silent=True) or {}
    cards = payload.get("flashcards") or []
    if not isinstance(cards, list):
        return jsonify({"error": "flashcards must be a list"}), 400

    session = SessionLocal()
    saved: List[Dict[str, Any]] = []
    try:
        for card in cards:
            source_word = card.get("source_word")
            translated_word = card.get("translated_word")
            if not source_word or not translated_word:
                continue
            flashcard = Flashcard(
                source_word=source_word,
                translated_word=translated_word,
                source_language=card.get("source_language", settings.default_source_language),
                native_language=card.get("native_language", settings.default_native_language),
                example_sentence=card.get("example_sentence"),
                example_sentence_translated=card.get("example_sentence_translated"),
                difficulty_level=card.get("difficulty_level"),
                is_manual=False,
            )
            session.add(flashcard)
            try:
                session.commit()
                session.refresh(flashcard)
                saved.append({"id": flashcard.id, "source_word": flashcard.source_word})
            except Exception:
                session.rollback()
        return jsonify({"saved": saved}), 201
    finally:
        session.close()


def _normalize_candidates(text: str) -> List[str]:
    tokens = [t for t in text.replace("\n", " ").split(" ") if t.strip()]
    normalized = {_normalize_word(token) for token in tokens if token.isalpha()}
    return sorted(normalized)

