import mimetypes

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.schemas.interpret import InterpretRequest
from app.services.openai_service import encode_file_to_base64, interpret_text_with_ai
from config import get_settings

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
