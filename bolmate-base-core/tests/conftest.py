import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from app import create_app
from app.db import session as db_session
from app.models import Base


@pytest.fixture()
def app_client():
    engine = create_engine("sqlite:///:memory:", future=False)
    TestingSessionLocal = scoped_session(
        sessionmaker(bind=engine, autoflush=False, autocommit=False)
    )

    db_session.engine = engine
    db_session.SessionLocal = TestingSessionLocal
    # Ensure blueprints reuse the testing session
    import app.routes.users as users_route
    import app.routes.flashcards as flashcards_route
    import app.routes.languages as languages_route

    users_route.SessionLocal = TestingSessionLocal
    flashcards_route.SessionLocal = TestingSessionLocal
    languages_route.SessionLocal = TestingSessionLocal

    Base.metadata.create_all(engine)

    app = create_app()
    app.config.update({"TESTING": True})

    with app.test_client() as client:
        yield client

    TestingSessionLocal.remove()
    Base.metadata.drop_all(bind=engine)
