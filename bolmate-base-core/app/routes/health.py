from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def healthcheck():
    return jsonify({"status": "ok"}), 200
