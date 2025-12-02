from flask import Blueprint, jsonify

languages_bp = Blueprint("languages", __name__)

SUPPORTED_LANGUAGES = [
    {"code": "en", "label": "English"},
    {"code": "pl", "label": "Polish"},
    {"code": "es", "label": "Spanish"},
    {"code": "de", "label": "German"},
    {"code": "fr", "label": "French"},
    {"code": "nl", "label": "Dutch"},
]


@languages_bp.get("")
def list_languages():
    return jsonify(SUPPORTED_LANGUAGES), 200
