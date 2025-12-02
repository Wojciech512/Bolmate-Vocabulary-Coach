import random
from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app.db.session import SessionLocal
from app.models import Flashcard
from app.services.openai_service import generate_example_and_hint, generate_quiz_questions
from config import get_settings

quiz_bp = Blueprint("quiz", __name__)
settings = get_settings()


def _serialize_question(card: Flashcard):
    return {
        "flashcard_id": card.id,
        "source_word": card.source_word,
        "source_language": card.source_language,
        "translated_word": card.translated_word,
        "native_language": card.native_language,
        "example_sentence": card.example_sentence,
        "example_sentence_translated": card.example_sentence_translated,
    }


@quiz_bp.get("")
def get_random_question():
    native_language = request.args.get("native_language", settings.default_native_language)
    source_language = request.args.get("source_language")
    session = SessionLocal()
    try:
        query = session.query(Flashcard)
        if source_language:
            query = query.filter(Flashcard.source_language == source_language)
        card = query.order_by(func.random()).first()
        if not card:
            return jsonify({"error": "No flashcards available"}), 404
        card.native_language = native_language or card.native_language
        return jsonify(_serialize_question(card)), 200
    finally:
        session.close()


@quiz_bp.post("")
def check_answer():
    payload = request.get_json(silent=True) or {}
    flashcard_id = payload.get("flashcard_id")
    answer = (payload.get("answer") or "").strip().lower()
    native_language = payload.get("native_language") or settings.default_native_language

    if not flashcard_id:
        return jsonify({"error": "flashcard_id is required"}), 400

    session = SessionLocal()
    try:
        card = session.query(Flashcard).get(flashcard_id)
        if not card:
            return jsonify({"error": "Flashcard not found"}), 404

        correct_translation = (card.translated_word or "").strip().lower()
        is_correct = correct_translation == answer
        if is_correct:
            card.correct_count += 1
        else:
            card.incorrect_count += 1
        session.commit()

        hint_payload = generate_example_and_hint(
            source_word=card.source_word,
            translated_word=card.translated_word,
            source_language=card.source_language,
            native_language=native_language,
        )

        # store example sentences if empty
        if hint_payload.get("example_sentence") and not card.example_sentence:
            card.example_sentence = hint_payload.get("example_sentence")
            card.example_sentence_translated = hint_payload.get("example_sentence_translated")
            session.commit()

        return (
            jsonify(
                {
                    "correct": is_correct,
                    "submitted": answer,
                    "correct_answer": card.translated_word,
                    "hint": hint_payload.get("hint"),
                    "example_sentence": card.example_sentence,
                    "example_sentence_translated": card.example_sentence_translated,
                }
            ),
            200,
        )
    finally:
        session.close()


@quiz_bp.post("/generate")
def generate_quiz():
    payload = request.get_json(silent=True) or {}
    num_questions = int(payload.get("num_questions", 5))
    native_language = payload.get("native_language") or settings.default_native_language
    quiz_types = payload.get("types") or ["multiple_choice", "fill_in"]
    filters = payload.get("filters") or {}

    session = SessionLocal()
    try:
        query = session.query(Flashcard)
        if filters.get("source_language"):
            query = query.filter(Flashcard.source_language == filters["source_language"])
        if filters.get("difficulty_level"):
            query = query.filter(Flashcard.difficulty_level == filters["difficulty_level"])
        cards = query.all()
        random.shuffle(cards)
        selected = cards[:num_questions]
        if not selected:
            return jsonify({"error": "No flashcards available"}), 404
        serialized_cards = [_serialize_question(card) for card in selected]
        questions = generate_quiz_questions(serialized_cards, num_questions, native_language, quiz_types)
        return jsonify({"questions": questions}), 200
    finally:
        session.close()
