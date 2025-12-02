import random

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app.db.session import SessionLocal
from app.models import Flashcard
from app.services.openai_service import generate_hint_for_flashcard, generate_quiz_questions

quiz_bp = Blueprint("quiz", __name__)


@quiz_bp.get("/quiz")
def get_quiz_question():
    session = SessionLocal()
    try:
        card = session.query(Flashcard).order_by(func.random()).first()
        if not card:
            return jsonify({"error": "No flashcards available"}), 404
        return jsonify({
            "flashcard_id": card.id,
            "source_word": card.source_word,
            "source_language": card.source_language,
            "native_language": card.native_language,
            "translated_word": card.translated_word,
            "correct_count": card.correct_count,
            "incorrect_count": card.incorrect_count,
        })
    finally:
        session.close()


@quiz_bp.post("/quiz")
def submit_quiz_answer():
    payload = request.get_json(silent=True) or {}
    flashcard_id = payload.get("flashcard_id")
    answer = (payload.get("answer") or "").strip().lower()
    if not flashcard_id:
        return jsonify({"error": "flashcard_id is required"}), 400
    session = SessionLocal()
    try:
        card = session.query(Flashcard).get(flashcard_id)
        if not card:
            return jsonify({"error": "Flashcard not found"}), 404

        correct_answer = (card.translated_word or "").strip().lower()
        is_correct = answer == correct_answer
        if is_correct:
            card.correct_count += 1
        else:
            card.incorrect_count += 1
        session.commit()
        hint = generate_hint_for_flashcard(
            card.source_word, card.translated_word, card.native_language, card.source_language
        )
        response = {
            "correct": is_correct,
            "correctAnswer": card.translated_word,
            "stats": {
                "correct_count": card.correct_count,
                "incorrect_count": card.incorrect_count,
            },
            "hint": hint.get("hint"),
            "example_sentence": hint.get("example_sentence"),
            "example_translation": hint.get("example_translation"),
        }
        return jsonify(response)
    finally:
        session.close()


@quiz_bp.post("/quiz/generate")
def generate_quiz():
    payload = request.get_json(silent=True) or {}
    num_questions = int(payload.get("num_questions", 5))
    source_language = payload.get("source_language")
    difficulty = payload.get("difficulty_level")
    session = SessionLocal()
    try:
        query = session.query(Flashcard)
        if source_language:
            query = query.filter(func.lower(Flashcard.source_language) == source_language.lower())
        if difficulty:
            query = query.filter(Flashcard.difficulty_level == difficulty)
        cards = query.all()
        random.shuffle(cards)
        serialized = [
            {
                "id": c.id,
                "source_word": c.source_word,
                "translated_word": c.translated_word,
                "source_language": c.source_language,
                "native_language": c.native_language,
                "example_sentence": c.example_sentence,
            }
            for c in cards
        ]
        questions = generate_quiz_questions(serialized, num_questions)
        return jsonify({"questions": questions})
    finally:
        session.close()

