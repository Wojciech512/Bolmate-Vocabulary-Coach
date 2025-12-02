from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.models import Flashcard
from app.schemas.flashcard import CreateFlashcardRequest, EnrichFlashcardsRequest
from app.services.openai_service import enrich_flashcards
from config import get_settings

flashcards_bp = Blueprint("flashcards", __name__)


def _serialize_flashcard(card: Flashcard) -> dict:
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


@flashcards_bp.get("/flashcards")
def list_flashcards():
    session = SessionLocal()
    try:
        query = session.query(Flashcard).order_by(Flashcard.id.desc())
        source_language = request.args.get("source_language")
        difficulty = request.args.get("difficulty_level")
        if source_language:
            query = query.filter(
                func.lower(Flashcard.source_language) == source_language.lower()
            )
        if difficulty:
            query = query.filter(Flashcard.difficulty_level == difficulty)
        cards = query.all()
        return jsonify([_serialize_flashcard(card) for card in cards])
    finally:
        session.close()


@flashcards_bp.post("/flashcards")
def create_flashcard():
    try:
        payload = request.get_json(silent=True) or {}
        data = CreateFlashcardRequest(**payload)
    except ValidationError as e:
        return jsonify({"error": "Invalid request data", "details": e.errors()}), 400

    source_word = data.source_word.strip()
    translated_word = data.translated_word.strip()
    native_language = (
        data.native_language or get_settings().default_native_language
    ).strip()
    source_language = (data.source_language or "es").strip() or "es"

    session = SessionLocal()
    try:
        card = Flashcard(
            source_word=source_word,
            translated_word=translated_word,
            native_language=native_language,
            source_language=source_language,
            is_manual=data.is_manual if data.is_manual is not None else True,
            difficulty_level=data.difficulty_level,
            example_sentence=data.example_sentence,
            example_sentence_translated=data.example_sentence_translated,
        )
        session.add(card)
        session.commit()
        session.refresh(card)
        return jsonify(_serialize_flashcard(card)), 201
    except IntegrityError:
        session.rollback()
        return (
            jsonify({"error": "Flashcard already exists for this language pair."}),
            409,
        )
    finally:
        session.close()


@flashcards_bp.get("/flashcards/<int:card_id>")
def get_flashcard(card_id: int):
    session = SessionLocal()
    try:
        card = session.query(Flashcard).get(card_id)
        if not card:
            return jsonify({"error": "Flashcard not found"}), 404
        return jsonify(_serialize_flashcard(card))
    finally:
        session.close()


@flashcards_bp.put("/flashcards/<int:card_id>")
def update_flashcard(card_id: int):
    payload = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        card = session.query(Flashcard).get(card_id)
        if not card:
            return jsonify({"error": "Flashcard not found"}), 404

        for field in [
            "source_word",
            "source_language",
            "translated_word",
            "native_language",
            "example_sentence",
            "example_sentence_translated",
            "difficulty_level",
            "is_manual",
        ]:
            if field in payload:
                setattr(card, field, payload[field])
        session.commit()
        session.refresh(card)
        return jsonify(_serialize_flashcard(card))
    except IntegrityError:
        session.rollback()
        return (
            jsonify({"error": "Flashcard already exists for this language pair."}),
            409,
        )
    finally:
        session.close()


@flashcards_bp.delete("/flashcards/<int:card_id>")
def delete_flashcard(card_id: int):
    session = SessionLocal()
    try:
        card = session.query(Flashcard).get(card_id)
        if not card:
            return jsonify({"error": "Flashcard not found"}), 404
        session.delete(card)
        session.commit()
        return jsonify({"status": "deleted"})
    finally:
        session.close()


@flashcards_bp.post("/flashcards/enrich")
def enrich_existing_flashcards():
    try:
        payload = request.get_json(silent=True) or {}
        data = EnrichFlashcardsRequest(**payload)
    except ValidationError as e:
        return jsonify({"error": "Invalid request data", "details": e.errors()}), 400

    native_language = data.native_language or get_settings().default_native_language
    session = SessionLocal()
    try:
        cards = session.query(Flashcard).filter(Flashcard.id.in_(data.ids)).all()
        if not cards:
            return jsonify({"error": "No flashcards found"}), 404
        enriched = enrich_flashcards(
            [_serialize_flashcard(c) for c in cards], native_language
        )
        for card, enrich_data in zip(cards, enriched):
            card.example_sentence = (
                enrich_data.get("example_sentence") or card.example_sentence
            )
            card.example_sentence_translated = (
                enrich_data.get("example_translation")
                or card.example_sentence_translated
            )
            card.difficulty_level = (
                enrich_data.get("difficulty_level") or card.difficulty_level
            )
        session.commit()
        return jsonify([_serialize_flashcard(c) for c in cards])
    finally:
        session.close()
