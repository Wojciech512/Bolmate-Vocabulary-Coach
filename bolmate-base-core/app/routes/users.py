from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.models import User

users_bp = Blueprint("users", __name__)


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@users_bp.get("")
def list_users():
    session = SessionLocal()
    try:
        users = session.query(User).order_by(User.id).all()
        return jsonify([_serialize_user(user) for user in users]), 200
    finally:
        session.close()


@users_bp.post("")
def create_user():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    email = payload.get("email")

    if not name or not email:
        return jsonify({"error": "Both name and email are required."}), 400

    session = SessionLocal()
    try:
        user = User(name=name, email=email)
        session.add(user)
        session.commit()
        session.refresh(user)
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Email already exists."}), 409
    finally:
        session.close()

    return jsonify(_serialize_user(user)), 201
