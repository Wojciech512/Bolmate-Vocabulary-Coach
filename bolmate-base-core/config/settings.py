from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv
import os


BASE_DIR = Path(__file__).resolve().parent.parent


def load_env() -> None:
    load_dotenv(BASE_DIR / ".env")
    load_dotenv(BASE_DIR / ".env.local")


@dataclass
class Settings:
    debug: bool
    database_url: str
    environment: str
    host: str = "0.0.0.0"
    port: int = 5000


DEFAULT_DATABASE_URL = "postgresql+psycopg2://postgres:postgres@db:5432/bolmate_base"


def get_settings() -> Settings:
    load_env()
    environment = os.getenv("FLASK_ENV", "development")
    database_url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    debug = environment != "production"
    host = os.getenv("FLASK_RUN_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_RUN_PORT", "5000"))
    return Settings(debug=debug, database_url=database_url, environment=environment, host=host, port=port)
