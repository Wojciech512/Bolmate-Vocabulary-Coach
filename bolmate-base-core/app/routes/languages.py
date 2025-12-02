from flask import Blueprint, jsonify

languages_bp = Blueprint("languages", __name__)


@languages_bp.get("")
def list_languages():
    return jsonify(
        [
            {"code": "pl", "label": "Polish"},
            {"code": "en", "label": "English"},
            {"code": "es", "label": "Spanish"},
            {"code": "de", "label": "German"},
            {"code": "fr", "label": "French"},
            {"code": "nl", "label": "Dutch"},
        ]
    ), 200

