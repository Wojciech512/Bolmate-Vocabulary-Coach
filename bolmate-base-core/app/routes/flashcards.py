from __future__ import annotations

from typing import Any, Dict

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.models import Flashcard
from config import get_settings
from app.services.ai import ai_client

flashcards_bp = Blueprint("flashcards", __name__)

settings = get_settings()


def _serialize_flashcard(card: Flashcard) -> Dict[str, Any]:
    return {
        "id": card.id,
        "source_word": card.source_word,
        "source_language": card.source_language,
        "translated_word": card.translated_word,
        "native_language": card.native_language,
        "example_sentence": card.example_sentence,
        "example_sentence_translated": card.example_sentence_translated,
        "difficulty_level": card.difficulty_level,
        "is_manual": card.is_manual,
        "correct_count": card.correct_count,
        "incorrect_count": card.incorrect_count,
        "created_at": card.created_at.isoformat() if card.created_at else None,
    }


@flashcards_bp.get("")
def list_flashcards():
    session = SessionLocal()
    try:
        query = session.query(Flashcard)
        source_language = request.args.get("source_language")
        if source_language:
            query = query.filter(Flashcard.source_language == source_language)

        difficulty = request.args.get("difficulty")
        if difficulty:
            query = query.filter(Flashcard.difficulty_level == difficulty)

        cards = query.order_by(Flashcard.created_at.desc()).all()
        return jsonify([_serialize_flashcard(card) for card in cards]), 200
    finally:
        session.close()


@flashcards_bp.post("")
def create_flashcard():
    payload = request.get_json(silent=True) or {}
    source_word = (payload.get("source_word") or "").strip()
    translated_word = (payload.get("translated_word") or "").strip()
    source_language = (payload.get("source_language") or settings.default_source_language).strip()
    native_language = (payload.get("native_language") or settings.default_native_language).strip()
    is_manual = bool(payload.get("is_manual", True))

    if not source_word or not translated_word:
        return jsonify({"error": "source_word and translated_word are required"}), 400

    session = SessionLocal()
    try:
        flashcard = Flashcard(
            source_word=source_word,
            translated_word=translated_word,
            source_language=source_language,
            native_language=native_language,
            is_manual=is_manual,
        )

        session.add(flashcard)
        session.commit()
        session.refresh(flashcard)
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "This word already exists."}), 409
    finally:
        session.close()

    return jsonify(_serialize_flashcard(flashcard)), 201


@flashcards_bp.get("/<int:flashcard_id>")
def get_flashcard(flashcard_id: int):
    session = SessionLocal()
    try:
        flashcard = session.query(Flashcard).get(flashcard_id)
        if not flashcard:
            return jsonify({"error": "Flashcard not found"}), 404
        return jsonify(_serialize_flashcard(flashcard)), 200
    finally:
        session.close()


@flashcards_bp.put("/<int:flashcard_id>")
def update_flashcard(flashcard_id: int):
    payload = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        flashcard = session.query(Flashcard).get(flashcard_id)
        if not flashcard:
            return jsonify({"error": "Flashcard not found"}), 404

        for field in [
            "source_word",
            "translated_word",
            "source_language",
            "native_language",
            "example_sentence",
            "example_sentence_translated",
            "difficulty_level",
            "is_manual",
        ]:
            if field in payload:
                setattr(flashcard, field, payload[field])

        session.commit()
        session.refresh(flashcard)
        return jsonify(_serialize_flashcard(flashcard)), 200
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Duplicate flashcard"}), 409
    finally:
        session.close()


@flashcards_bp.delete("/<int:flashcard_id>")
def delete_flashcard(flashcard_id: int):
    session = SessionLocal()
    try:
        flashcard = session.query(Flashcard).get(flashcard_id)
        if not flashcard:
            return jsonify({"error": "Flashcard not found"}), 404
        session.delete(flashcard)
        session.commit()
        return jsonify({"status": "deleted"}), 200
    finally:
        session.close()


@flashcards_bp.post("/bulk/enrich")
def bulk_enrich():
    payload = request.get_json(silent=True) or {}
    candidates = payload.get("candidates") or []
    if not isinstance(candidates, list):
        return jsonify({"error": "candidates must be a list"}), 400

    enriched = ai_client.enrich_flashcards(candidates)
    return jsonify(enriched), 200

