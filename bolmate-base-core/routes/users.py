from flask import Blueprint, jsonify, request
from services.users_service import create_user, list_users

users_bp = Blueprint("users", __name__, url_prefix="/users")


@users_bp.get("")
def get_users():
    users = list_users()
    return jsonify([user.to_dict() for user in users]), 200


@users_bp.post("")
def post_user():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip()

    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400

    user = create_user(name=name, email=email)
    return jsonify(user.to_dict()), 201
