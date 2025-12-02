from flask import Blueprint, jsonify

languages_bp = Blueprint("languages", __name__)

SUPPORTED_LANGUAGES = [
    {"code": "pl", "label": "Polish"},
    {"code": "en", "label": "English"},
    {"code": "de", "label": "German"},
    {"code": "fr", "label": "French"},
    {"code": "nl", "label": "Dutch"},
    {"code": "es", "label": "Spanish"},
]


@languages_bp.get("/languages")
def list_languages():
    return jsonify({"languages": SUPPORTED_LANGUAGES})

