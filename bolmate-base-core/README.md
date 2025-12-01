# Bolmate Base Backend

Lightweight Flask boilerplate with SQLAlchemy 1.4, Alembic migrations, and PostgreSQL 15 support.

## Features
- Flask application factory with modular blueprints
- Healthcheck endpoint at `/health`
- Example `users` module with GET/POST
- SQLAlchemy 1.4 session management and declarative base
- Alembic migrations ready to run
- Environment-driven configuration via `.env`

## Project layout
```
app/
  db/               # Engine and session configuration
  models/           # SQLAlchemy models
  routes/           # Flask blueprints
config/             # Settings loader
alembic/            # Migration environment and versions
```

## Getting started (local)
1. Create a virtual environment with Python 3.12+.
2. Copy `.env.example` to `.env` and adjust values.
3. Install dependencies: `pip install -r requirements.txt`.
4. Run migrations: `alembic upgrade head`.
5. Start the server: `flask --app wsgi run --host=0.0.0.0 --port=5000`.

## Environment variables
See `.env.example` for the full list. Key settings:
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- `APP_ENV`, `DEBUG`, `SQLALCHEMY_ECHO`

## Running inside Docker
The repository root provides `docker-compose.yml` to start the backend, frontend, and PostgreSQL together:
```
docker-compose up --build
```
The backend listens on port `5000` by default.
