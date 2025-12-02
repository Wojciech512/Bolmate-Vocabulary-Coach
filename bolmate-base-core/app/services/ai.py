"""OpenAI helper utilities for hints, flashcard enrichment, and quiz generation."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any, Dict, List, Optional

from openai import OpenAI, OpenAIError

from config import get_settings

settings = get_settings()


class AIClient:
    def __init__(self) -> None:
        self.enabled = bool(settings.openai_api_key)
        self.client: Optional[OpenAI] = None
        if self.enabled:
            self.client = OpenAI(api_key=settings.openai_api_key)

    def _chat(self, messages: List[Dict[str, str]]) -> Optional[str]:
        if not self.enabled or not self.client:
            return None
        try:
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=messages,
                temperature=0.5,
            )
            return response.choices[0].message.content
        except OpenAIError:
            return None

    def generate_hint(self, source_word: str, translated_word: str, native_language: str) -> Optional[Dict[str, str]]:
        prompt = (
            "You are a language tutor. Provide a helpful hint and one short example sentence in the"
            f" source language for '{source_word}' which translates to '{translated_word}'."
            f" Translate the example into {native_language}. Respond as JSON with keys:"
            " hint, example_sentence, example_sentence_translated."
        )
        content = self._chat(
            [
                {"role": "system", "content": "You help language learners with short hints."},
                {"role": "user", "content": prompt},
            ]
        )
        if not content:
            return None

        return self._safe_json_dict(content)

    def enrich_flashcards(self, candidates: Iterable[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Add example sentences and difficulty labels to flashcards.

        Falls back to the original candidates if AI is disabled.
        """

        if not self.enabled:
            return [
                {
                    **candidate,
                    "example_sentence": None,
                    "example_sentence_translated": None,
                    "difficulty_level": None,
                }
                for candidate in candidates
            ]

        cards_text = "\n".join(
            [
                f"- source_word: {c['source_word']} ({c.get('source_language', 'unknown')}) -> {c['translated_word']}"
                f" in {c.get('native_language', settings.default_native_language)}"
                for c in candidates
            ]
        )
        prompt = (
            "For each item, generate a simple example sentence (A1/A2) in the source language,"
            " translate it into the target native language, and suggest difficulty A1/A2/B1."
            " Respond as JSON array with keys: source_word, example_sentence, example_sentence_translated, difficulty_level."
            f" Items:\n{cards_text}"
        )
        content = self._chat(
            [
                {"role": "system", "content": "You enrich vocabulary flashcards."},
                {"role": "user", "content": prompt},
            ]
        )
        enriched = self._safe_json_list(content) if content else None
        enriched_map = {item.get("source_word"): item for item in enriched or []}

        result: List[Dict[str, Any]] = []
        for candidate in candidates:
            extra = enriched_map.get(candidate["source_word"], {})
            result.append(
                {
                    **candidate,
                    "example_sentence": extra.get("example_sentence"),
                    "example_sentence_translated": extra.get("example_sentence_translated"),
                    "difficulty_level": extra.get("difficulty_level"),
                }
            )
        return result

    def generate_quiz_questions(
        self, flashcards: List[Dict[str, Any]], num_questions: int = 5
    ) -> List[Dict[str, Any]]:
        if not flashcards:
            return []
        selected = flashcards[:num_questions]
        if not self.enabled:
            return [
                {
                    "question": f"What is the translation of '{card['source_word']}'?",
                    "answer": card["translated_word"],
                    "type": "translation",
                    "options": None,
                }
                for card in selected
            ]

        prompt_cards = [
            f"{c['source_word']} ({c.get('source_language', 'es')}) -> {c['translated_word']}"
            f" in {c.get('native_language', settings.default_native_language)}"
            for c in selected
        ]
        prompt = (
            "Create a mixed quiz (multiple choice and fill-in) for these flashcards."
            " Respond as JSON array; each item should have keys: question, answer, type,"
            " and optional options list for multiple choice."
            f" Flashcards:\n- " + "\n- ".join(prompt_cards)
        )
        content = self._chat(
            [
                {"role": "system", "content": "You generate concise quiz questions."},
                {"role": "user", "content": prompt},
            ]
        )
        return self._safe_json_list(content) or []

    @staticmethod
    def _safe_json_list(content: str | None) -> Optional[List[Dict[str, Any]]]:
        if not content:
            return None
        try:
            import json

            data = json.loads(content)
            return data if isinstance(data, list) else None
        except Exception:
            return None

    @staticmethod
    def _safe_json_dict(content: str | None) -> Optional[Dict[str, Any]]:
        if not content:
            return None
        try:
            import json

            data = json.loads(content)
            return data if isinstance(data, dict) else None
        except Exception:
            return None


ai_client = AIClient()

