import os.path
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra='allow')

    # Pyramid
    debug_notfound: bool
    debug_routematch: bool
    default_locale_name: str

    # Database
    database_url: str

    # Security
    allow_origin: str

    # Application
    env: Literal['prod', 'staging', 'testing', 'dev']



@lru_cache
def get_settings(*, config_file_path: str = None) -> Settings:
    if not config_file_path:
        config_file_path = os.path.join(os.getcwd(), 'config.ini')
    Settings.model_config |= {'env_file': config_file_path}
    return Settings()
