from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.db.session import SessionLocal
from app.models import Flashcard
from app.routes.flashcards import _serialize_flashcard
from app.schemas.language import (
    SwitchLanguageMeta,
    SwitchLanguageRequest,
    SwitchLanguageResponse,
)
from app.services.openai_service import translate_flashcards

languages_bp = Blueprint("languages", __name__)

SUPPORTED_LANGUAGES = [
    {"code": "pl", "label": "Polish"},
    {"code": "en", "label": "English"},
    {"code": "de", "label": "German"},
    {"code": "fr", "label": "French"},
    {"code": "nl", "label": "Dutch"},
    {"code": "es", "label": "Spanish"},
]

LANGUAGE_SWITCH_EXAMPLE = {
    "flashcards": [
        {
            "id": 1,
            "source_word": "árbol",
            "source_language": "es",
            "translated_word": "drzewo",
            "native_language": "pl",
            "example_sentence": "El árbol es alto",
            "example_sentence_translated": "To drzewo jest wysokie",
            "difficulty_level": "A1",
            "is_manual": False,
            "correct_count": 3,
            "incorrect_count": 0,
            "created_at": None,
        }
    ],
    "meta": {
        "target_language": "pl",
        "translated_count": 1,
        "skipped_count": 0,
        "force_retranslate": False,
    },
}


@languages_bp.get("/languages")
def list_languages():
    return jsonify({"languages": SUPPORTED_LANGUAGES})


@languages_bp.post("/languages/switch")
def switch_language():
    try:
        payload = request.get_json(silent=True) or {}
        data = SwitchLanguageRequest(**payload)
    except ValidationError as exc:
        return jsonify({"error": "Invalid request data", "details": exc.errors()}), 400

    session = SessionLocal()
    try:
        query = session.query(Flashcard)
        if data.flashcard_ids:
            query = query.filter(Flashcard.id.in_(data.flashcard_ids))

        cards = query.order_by(Flashcard.id.asc()).all()
        if not cards:
            # No flashcards yet - return empty success response
            return jsonify({
                "flashcards": [],
                "meta": {
                    "target_language": data.target_language,
                    "translated_count": 0,
                    "skipped_count": 0,
                    "force_retranslate": data.force_retranslate,
                }
            }), 200

        to_translate = [
            card
            for card in cards
            if data.force_retranslate
            or card.native_language.lower() != data.target_language.lower()
        ]

        translated_payload = translate_flashcards(
            [_serialize_flashcard(card) for card in to_translate],
            data.target_language,
        )
        translated_by_id = {item.get("id"): item for item in translated_payload}

        # Check if any cards would violate unique constraint
        new_language_lower = data.target_language.lower()

        for card in to_translate:
            # Check for potential duplicates
            existing = session.query(Flashcard).filter(
                Flashcard.source_word == card.source_word,
                Flashcard.source_language == card.source_language,
                Flashcard.native_language == new_language_lower,
                Flashcard.id != card.id
            ).first()

            if existing:
                return jsonify({
                    "error": "Cannot switch language - duplicate flashcard would be created",
                    "details": f"Flashcard '{card.source_word}' already exists with target language '{new_language_lower}'"
                }), 409

        for card in to_translate:
            payload = translated_by_id.get(card.id, {})
            card.native_language = new_language_lower
            card.translated_word = payload.get("translated_word") or card.translated_word
            if payload.get("example_sentence") and not card.example_sentence:
                card.example_sentence = payload["example_sentence"]
            example_translation = payload.get("example_sentence_translated") or (
                payload.get("example_sentence") if not card.example_sentence_translated else None
            )
            if example_translation:
                card.example_sentence_translated = example_translation
            if payload.get("difficulty_level"):
                card.difficulty_level = payload["difficulty_level"]
        session.commit()

        response = SwitchLanguageResponse(
            flashcards=[_serialize_flashcard(card) for card in cards],
            meta=SwitchLanguageMeta(
                target_language=data.target_language,
                translated_count=len(to_translate),
                skipped_count=len(cards) - len(to_translate),
                force_retranslate=data.force_retranslate,
            ),
        )
        return jsonify(response.model_dump())
    finally:
        session.close()

