from sqlalchemy import engine_from_config
from sqlalchemy.orm import sessionmaker, scoped_session

from bolmate_base.core.settings import get_settings
from bolmate_base.model.base_model import Base

session_maker = sessionmaker(expire_on_commit=False, autoflush=False)
DBSession = scoped_session(session_maker)


def setup_database():
    settings = get_settings()
    kwargs = {'connect_args': {'application_name': 'BolmateBase'}}
    engine = engine_from_config(settings.model_dump(), prefix='database_', **kwargs)
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine
