import logging
import mimetypes

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.schemas.interpret import InterpretRequest
from app.services.openai_service import (
    encode_file_to_base64,
    interpret_file_with_ai,
    interpret_text_with_ai,
)
from config import get_settings

logger = logging.getLogger(__name__)

interpret_bp = Blueprint("interpret", __name__)


@interpret_bp.post("/interpret")
def interpret_payload():
    native_language = request.form.get("native_language") or request.args.get(
        "native_language"
    )
    if not native_language:
        native_language = get_settings().default_native_language

    # Handle raw text
    if request.is_json:
        try:
            payload = request.get_json(silent=True) or {}
            data = InterpretRequest(**payload)
            native_language = data.native_language
            text = data.text
        except ValidationError as e:
            return (
                jsonify({"error": "Invalid request data", "details": e.errors()}),
                400,
            )
        items = interpret_text_with_ai(text, native_language) if text else []
        return jsonify({"items": items})

    if request.data and request.content_type == "text/plain":
        text = request.data.decode("utf-8")
        items = interpret_text_with_ai(text, native_language)
        return jsonify({"items": items})

    # Handle files
    files = request.files.getlist("file")
    results = []
    for f in files:
        content = f.read()
        mime, _ = mimetypes.guess_type(f.filename)
        if mime and mime.startswith("text"):
            text = content.decode("utf-8", errors="ignore")
            items = interpret_text_with_ai(text, native_language)
            results.extend(items)
        else:
            encoded = encode_file_to_base64(content)
            placeholder = interpret_text_with_ai(
                f"Base64: {encoded[:800]}... Extract vocabulary and translations for learner native language {native_language}.",
                native_language,
            )
            results.extend(placeholder)

    return jsonify({"items": results})


@interpret_bp.post("/interpret/file")
def interpret_file():
    """Handle file uploads with OCR + AI interpretation.

    Supports: PDF, DOCX, TXT, PNG, JPG
    - Detects existing translation pairs (e.g., "si - yes", "yo - ich")
    - Merges duplicates and aggregates word forms
    - Uses OCR for images
    """
    native_language = request.form.get("native_language")
    if not native_language:
        native_language = get_settings().default_native_language

    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files provided"}), 400

    all_items = []
    for file in files:
        try:
            content = file.read()
            filename = file.filename or "unknown"
            mime_type, _ = mimetypes.guess_type(filename)

            logger.info(f"Processing file: {filename} ({mime_type})")

            items = interpret_file_with_ai(
                content, filename, mime_type, native_language
            )
            all_items.extend(items)
        except Exception as e:
            logger.exception(f"Error processing file {file.filename}: {e}")
            continue

    # Deduplicate and merge items
    merged_items = _merge_and_deduplicate_items(all_items)

    return jsonify({"items": merged_items})


def _merge_and_deduplicate_items(items):
    """Merge duplicate words and aggregate similar forms."""
    seen = {}
    for item in items:
        source_word = item.get("source_word", "").lower().strip()
        if not source_word:
            continue

        if source_word in seen:
            # Merge: prefer non-empty values
            existing = seen[source_word]
            for key in [
                "translated_word",
                "example_sentence",
                "example_sentence_translated",
            ]:
                if item.get(key) and not existing.get(key):
                    existing[key] = item[key]
        else:
            seen[source_word] = item

    return list(seen.values())
