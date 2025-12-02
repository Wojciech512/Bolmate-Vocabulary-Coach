from flask import Flask, jsonify, request

from app.db.session import SessionLocal
from app.routes import register_blueprints
from config import get_settings


def create_app() -> Flask:
    settings = get_settings()
    app = Flask(__name__)
    app.config["ENV"] = settings.app_env
    app.config["DEBUG"] = settings.debug

    register_blueprints(app)

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = app.make_response(("", 204))
            return _apply_cors_headers(response, settings)
        return None

    @app.after_request
    def add_cors_headers(response):
        return _apply_cors_headers(response, settings)

    @app.teardown_appcontext
    def remove_session(_):
        SessionLocal.remove()

    @app.errorhandler(404)
    def not_found(_: Exception):
        return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(500)
    def server_error(_: Exception):
        return jsonify({"error": "Internal Server Error"}), 500

    return app


def _apply_cors_headers(response, settings):
    response.headers["Access-Control-Allow-Origin"] = settings.allow_origin
    response.headers["Access-Control-Allow-Methods"] = (
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    )
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response
