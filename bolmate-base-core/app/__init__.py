from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException
from config.settings import get_settings
from db import SessionLocal, init_engine
from routes import register_blueprints


def create_app() -> Flask:
    settings = get_settings()
    app = Flask(__name__)
    app.config["ENV"] = settings.environment
    app.config["DEBUG"] = settings.debug

    init_engine(settings.database_url)

    register_blueprints(app)

    @app.teardown_appcontext
    def remove_session(exception=None):
        SessionLocal.remove()

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        response = jsonify({"error": error.description})
        response.status_code = error.code or 500
        return response

    return app
