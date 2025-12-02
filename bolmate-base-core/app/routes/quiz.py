from __future__ import annotations

import random
from typing import Any, Dict

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app.db.session import SessionLocal
from app.models import Flashcard
from app.services.ai import ai_client
from config import get_settings

quiz_bp = Blueprint("quiz", __name__)
settings = get_settings()


def _serialize_flashcard(card: Flashcard) -> Dict[str, Any]:
    return {
        "id": card.id,
        "source_word": card.source_word,
        "translated_word": card.translated_word,
        "source_language": card.source_language,
        "native_language": card.native_language,
        "example_sentence": card.example_sentence,
        "example_sentence_translated": card.example_sentence_translated,
        "difficulty_level": card.difficulty_level,
        "correct_count": card.correct_count,
        "incorrect_count": card.incorrect_count,
    }


def _normalize(text: str) -> str:
    return (text or "").strip().lower()


@quiz_bp.get("")
def next_question():
    session = SessionLocal()
    try:
        source_language = request.args.get("source_language")
        query = session.query(Flashcard)
        if source_language:
            query = query.filter(Flashcard.source_language == source_language)

        count = query.count()
        if count == 0:
            return jsonify({"error": "No flashcards available"}), 404
        offset = random.randint(0, count - 1)
        flashcard = query.offset(offset).limit(1).one()
        return jsonify({"flashcard": _serialize_flashcard(flashcard)}), 200
    finally:
        session.close()


@quiz_bp.post("")
def check_answer():
    payload = request.get_json(silent=True) or {}
    flashcard_id = payload.get("flashcard_id")
    answer = payload.get("answer", "")
    mode = payload.get("mode", "translation")
    native_language = payload.get("native_language", settings.default_native_language)

    if not flashcard_id:
        return jsonify({"error": "flashcard_id is required"}), 400

    session = SessionLocal()
    try:
        flashcard = session.query(Flashcard).get(flashcard_id)
        if not flashcard:
            return jsonify({"error": "Flashcard not found"}), 404

        expected = flashcard.translated_word if mode == "translation" else flashcard.source_word
        correct = _normalize(answer) == _normalize(expected)
        if correct:
            flashcard.correct_count = (flashcard.correct_count or 0) + 1
        else:
            flashcard.incorrect_count = (flashcard.incorrect_count or 0) + 1
        session.commit()

        hint = ai_client.generate_hint(
            source_word=flashcard.source_word,
            translated_word=flashcard.translated_word,
            native_language=native_language,
        )

        response: Dict[str, Any] = {
            "correct": correct,
            "correctAnswer": expected,
            "flashcard": _serialize_flashcard(flashcard),
        }
        if hint:
            response.update(hint)
        return jsonify(response), 200
    finally:
        session.close()


@quiz_bp.post("/generate")
def generate_quiz():
    payload = request.get_json(silent=True) or {}
    num_questions = int(payload.get("num_questions", 5))
    source_language = payload.get("source_language")
    native_language = payload.get("native_language", settings.default_native_language)

    session = SessionLocal()
    try:
        query = session.query(Flashcard)
        if source_language:
            query = query.filter(Flashcard.source_language == source_language)
        cards = query.order_by(func.random()).limit(num_questions).all()
        if not cards:
            return jsonify({"error": "No flashcards available"}), 404

        serialized = [_serialize_flashcard(card) for card in cards]
        questions = ai_client.generate_quiz_questions(serialized, num_questions=num_questions)
        return jsonify({"questions": questions, "native_language": native_language}), 200
    finally:
        session.close()

