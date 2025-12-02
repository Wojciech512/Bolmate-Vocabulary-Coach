import base64
import logging
from typing import Optional

from flask import Blueprint, jsonify, request

from app.services.openai_service import interpret_text_to_flashcards, get_client
from config import get_settings

interpret_bp = Blueprint("interpret", __name__)
settings = get_settings()
logger = logging.getLogger(__name__)


def _read_text_from_file(file_storage) -> Optional[str]:
    filename = file_storage.filename or ""
    content_type = file_storage.mimetype or ""
    try:
        if content_type.startswith("text/") or filename.endswith((".txt", ".md")):
            return file_storage.stream.read().decode("utf-8")
        if settings.openai_api_key and content_type in {"image/png", "image/jpeg", "application/pdf"}:
            content_bytes = file_storage.read()
            return _ocr_with_openai(content_bytes, content_type)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Failed to read file for interpret: %s", exc)
    return None


def _ocr_with_openai(content_bytes: bytes, content_type: str) -> Optional[str]:
    try:
        b64 = base64.b64encode(content_bytes).decode("utf-8")
        media_type = "image/png" if content_type != "application/pdf" else "application/pdf"
        response = get_client().chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract clear newline separated words or short phrases from the document.",
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract vocabulary items from this document."},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{media_type};base64,{b64}"},
                        },
                    ],
                },
            ],
        )
        return response.choices[0].message.content
    except Exception as exc:  # pragma: no cover - best-effort
        logger.warning("OpenAI OCR failed: %s", exc)
        return None


@interpret_bp.post("")
def interpret():
    native_language = request.form.get("native_language") or request.args.get("native_language")
    source_language = request.form.get("source_language") or request.args.get("source_language")
    payload = request.get_json(silent=True) or {}
    if not native_language:
        native_language = payload.get("native_language") or settings.default_native_language
    if not source_language:
        source_language = payload.get("source_language") or settings.default_source_language

    uploaded_file = request.files.get("file") if request.files else None
    text_input = None
    if uploaded_file:
        text_input = _read_text_from_file(uploaded_file)
    if not text_input:
        text_input = request.form.get("text") or payload.get("text") or ""

    text_input = (text_input or "").strip()
    if not text_input:
        return jsonify({"error": "Provide a file or text content to interpret."}), 400

    flashcards = interpret_text_to_flashcards(text_input, native_language, source_language)
    return jsonify({"candidates": flashcards, "raw_text": text_input}), 200
