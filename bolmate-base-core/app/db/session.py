from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, scoped_session, sessionmaker

from config import get_settings

settings = get_settings()
engine = create_engine(
    settings.database_url, echo=settings.sqlalchemy_echo, future=False
)
SessionLocal = scoped_session(
    sessionmaker(bind=engine, autoflush=False, autocommit=False)
)
Base = declarative_base()


def get_db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
