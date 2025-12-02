import random

from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from sqlalchemy import func

from app.db.session import SessionLocal
from app.models import Flashcard
from app.schemas.quiz import SubmitQuizAnswerRequest, GenerateQuizRequest
from app.services.openai_service import generate_hint_for_flashcard, generate_quiz_questions

quiz_bp = Blueprint("quiz", __name__)


@quiz_bp.get("/quiz")
def get_quiz_question():
    reverse = request.args.get("reverse", "false").lower() == "true"
    target_language = request.args.get("target_language", "").strip().lower()
    session = SessionLocal()
    try:
        query = session.query(Flashcard)

        # Filtruj po target language (native_language w normalnym trybie)
        if target_language:
            if reverse:
                # W reverse mode target language jest w source_language
                query = query.filter(func.lower(Flashcard.source_language) == target_language)
            else:
                # W normalnym trybie target language jest w native_language
                query = query.filter(func.lower(Flashcard.native_language) == target_language)

        card = query.order_by(func.random()).first()
        if not card:
            return jsonify({"error": "No flashcards available for the selected language"}), 404

        if reverse:
            # Odwrócony kierunek: pytamy o słowo w target language, odpowiedź w source language
            return jsonify({
                "flashcard_id": card.id,
                "source_word": card.translated_word,
                "source_language": card.native_language,
                "native_language": card.source_language,
                "translated_word": card.source_word,
                "correct_count": card.correct_count,
                "incorrect_count": card.incorrect_count,
                "is_reversed": True,
            })
        else:
            # Normalny kierunek: pytamy o source_word, odpowiedź w translated_word
            return jsonify({
                "flashcard_id": card.id,
                "source_word": card.source_word,
                "source_language": card.source_language,
                "native_language": card.native_language,
                "translated_word": card.translated_word,
                "correct_count": card.correct_count,
                "incorrect_count": card.incorrect_count,
                "is_reversed": False,
            })
    finally:
        session.close()


@quiz_bp.post("/quiz")
def submit_quiz_answer():
    try:
        payload = request.get_json(silent=True) or {}
        data = SubmitQuizAnswerRequest(**payload)
    except ValidationError as e:
        return jsonify({"error": "Invalid request data", "details": e.errors()}), 400

    answer = data.answer.strip().lower()
    session = SessionLocal()
    try:
        card = session.query(Flashcard).get(data.flashcard_id)
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
    try:
        payload = request.get_json(silent=True) or {}
        data = GenerateQuizRequest(**payload)
    except ValidationError as e:
        return jsonify({"error": "Invalid request data", "details": e.errors()}), 400

    session = SessionLocal()
    try:
        query = session.query(Flashcard)
        if data.source_language:
            query = query.filter(func.lower(Flashcard.source_language) == data.source_language.lower())
        if data.difficulty_level:
            query = query.filter(Flashcard.difficulty_level == data.difficulty_level)
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
        questions = generate_quiz_questions(serialized, data.num_questions or 5)
        return jsonify({"questions": questions})
    finally:
        session.close()

