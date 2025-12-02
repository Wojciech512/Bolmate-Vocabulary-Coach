# Bolmate Backend

Production-ready Flask 3 API for the Bolmate vocabulary coach. It exposes flashcard CRUD, quiz flows, interpret/OCR ingestion, and OpenAI enrichment on PostgreSQL 15.

## Endpoints (prefix `/api`)
- `GET /api/health` – health check
- `GET/POST /api/flashcards` – list or create flashcards
- `GET/PUT/DELETE /api/flashcards/{id}` – manage a flashcard
- `POST /api/flashcards/bulk/enrich` – AI enrichment for candidate cards
- `GET /api/quiz` – fetch random flashcard question
- `POST /api/quiz` – check answer + update stats + AI hint
- `POST /api/quiz/generate` – AI-generated mixed quiz
- `POST /api/interpret` – accept text/file, OCR via OpenAI when available, returns candidate words
- `POST /api/interpret/save` – persist interpreted flashcards
- `GET /api/languages` – supported native languages

## Project layout
```
app/
  db/               # Engine and session configuration
  models/           # SQLAlchemy models (Flashcard, Quiz, InterpretJob, User)
  routes/           # Flask blueprints (flashcards, quiz, interpret, health)
  services/         # OpenAI helper client
config/             # Settings loader
alembic/            # Migration environment and versions
```

## Getting started (local)
1. Python 3.13 virtualenv.
2. `cp .env.example .env` and set credentials + `OPENAI_API_KEY`.
3. `pip install -r requirements.txt`.
4. Run migrations: `alembic upgrade head`.
5. Start: `flask --app wsgi run --host=0.0.0.0 --port=5000`.

## Running inside Docker
From repo root: `docker-compose up --build` to start db (5432), backend (5000), frontend (3000).

## Notes
- OpenAI integration gracefully degrades when the key is missing (app still works with manual answers).
- OCR for images/PDFs uses the OpenAI vision model when `OPENAI_API_KEY` is configured; otherwise returns plain text parsing.
