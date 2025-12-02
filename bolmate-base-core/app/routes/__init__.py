from flask import Flask

from app.routes.flashcards import flashcards_bp
from app.routes.health import health_bp
from app.routes.interpret import interpret_bp
from app.routes.languages import languages_bp
from app.routes.quiz import quiz_bp
from app.routes.users import users_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(users_bp, url_prefix="/users")
    app.register_blueprint(flashcards_bp, url_prefix="/api")
    app.register_blueprint(quiz_bp, url_prefix="/api")
    app.register_blueprint(interpret_bp, url_prefix="/api")
    app.register_blueprint(languages_bp, url_prefix="/api")


__all__ = ["register_blueprints"]
