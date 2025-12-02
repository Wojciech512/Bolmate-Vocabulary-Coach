from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from app.db.session import SessionLocal
from app.models import Flashcard
from config import get_settings

settings = get_settings()
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


@flashcards_bp.get("")
def list_flashcards():
    session = SessionLocal()
    try:
        query = session.query(Flashcard)
        source_language = request.args.get("source_language")
        difficulty_level = request.args.get("difficulty_level")
        is_manual = request.args.get("is_manual")
        if source_language:
            query = query.filter(Flashcard.source_language == source_language)
        if difficulty_level:
            query = query.filter(Flashcard.difficulty_level == difficulty_level)
        if is_manual is not None:
            query = query.filter(Flashcard.is_manual == (is_manual.lower() == "true"))
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
    example_sentence = (payload.get("example_sentence") or "").strip() or None
    example_sentence_translated = (payload.get("example_sentence_translated") or "").strip() or None
    difficulty_level = (payload.get("difficulty_level") or "").strip() or None
    is_manual = bool(payload.get("is_manual", True))

    if not source_word or not translated_word:
        return jsonify({"error": "source_word and translated_word are required."}), 400

    session = SessionLocal()
    try:
        card = Flashcard(
            source_word=source_word,
            translated_word=translated_word,
            source_language=source_language,
            native_language=native_language,
            example_sentence=example_sentence,
            example_sentence_translated=example_sentence_translated,
            difficulty_level=difficulty_level,
            is_manual=is_manual,
        )
        session.add(card)
        session.commit()
        session.refresh(card)
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Flashcard already exists for this language pair."}), 409
    finally:
        session.close()

    return jsonify(_serialize_flashcard(card)), 201


@flashcards_bp.get("/<int:card_id>")
def get_flashcard(card_id: int):
    session = SessionLocal()
    try:
        card = session.query(Flashcard).options(joinedload(Flashcard.user)).get(card_id)
        if not card:
            return jsonify({"error": "Not found"}), 404
        return jsonify(_serialize_flashcard(card)), 200
    finally:
        session.close()


@flashcards_bp.put("/<int:card_id>")
def update_flashcard(card_id: int):
    payload = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        card = session.query(Flashcard).get(card_id)
        if not card:
            return jsonify({"error": "Not found"}), 404
        for field in [
            "source_word",
            "translated_word",
            "source_language",
            "native_language",
            "example_sentence",
            "example_sentence_translated",
            "difficulty_level",
        ]:
            if field in payload:
                value = payload.get(field)
                if isinstance(value, str):
                    value = value.strip()
                setattr(card, field, value)
        if "is_manual" in payload:
            card.is_manual = bool(payload.get("is_manual"))
        session.commit()
        session.refresh(card)
        return jsonify(_serialize_flashcard(card)), 200
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Flashcard already exists for this language pair."}), 409
    finally:
        session.close()


@flashcards_bp.delete("/<int:card_id>")
def delete_flashcard(card_id: int):
    session = SessionLocal()
    try:
        card = session.query(Flashcard).get(card_id)
        if not card:
            return jsonify({"error": "Not found"}), 404
        session.delete(card)
        session.commit()
        return jsonify({"status": "deleted"}), 200
    finally:
        session.close()
