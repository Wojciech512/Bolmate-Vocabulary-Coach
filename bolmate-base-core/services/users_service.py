from typing import List
from flask import abort
from sqlalchemy.exc import IntegrityError
from db import SessionLocal
from models.user import User


def list_users() -> List[User]:
    session = SessionLocal()
    return session.query(User).order_by(User.id).all()


def create_user(name: str, email: str) -> User:
    session = SessionLocal()
    user = User(name=name.strip(), email=email.strip().lower())
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        abort(400, description="User with this email already exists")
    session.refresh(user)
    return user
