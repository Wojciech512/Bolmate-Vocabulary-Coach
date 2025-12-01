from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, scoped_session, sessionmaker


Base = declarative_base()
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False))
engine = None


def init_engine(database_url: str):
    global engine
    engine = create_engine(database_url, future=False)
    SessionLocal.configure(bind=engine)
    return engine
