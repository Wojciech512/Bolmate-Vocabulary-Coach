from flask import Flask

from app.routes.health import health_bp
from app.routes.users import users_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(health_bp)
    app.register_blueprint(users_bp, url_prefix="/users")


__all__ = ["register_blueprints"]
