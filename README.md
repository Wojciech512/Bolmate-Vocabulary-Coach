# Bolmate Base

Spanish vocabulary coach built on Flask + React + PostgreSQL with AI/OCR helpers. Run everything with `docker-compose up --build`.

## Stack
- **Frontend:** React 18 + TypeScript, Vite, React Router, Axios
- **Backend:** Flask 3, SQLAlchemy 1.4 (legacy ORM), Alembic migrations, psycopg2
- **Database:** PostgreSQL 15

## Project structure
```
bolmate-base-core/   # Backend (Flask) – API, AI + OCR helpers, migrations
bolmate-base-front/  # Frontend (React + Vite) – Flashcards, Quiz, Interpret pages
docker-compose.yml   # Multi-container setup
```

## Quickstart
1. Copy environment examples and adjust if needed:
   - `cp bolmate-base-core/.env.example bolmate-base-core/.env`
   - `cp bolmate-base-front/.env.example bolmate-base-front/.env`
2. Build and start everything:
   ```
   docker-compose up --build
   ```
3. Visit the app at http://localhost:3000. The API is available at http://localhost:5000/api.

## Backend (Flask)
- Healthcheck: `GET /api/health`
- Flashcards CRUD: `GET/POST/PUT/DELETE /api/flashcards`
- Quiz:
  - `GET /api/quiz` – random question
  - `POST /api/quiz` – check answer + AI hint
  - `POST /api/quiz/generate` – AI-built quiz set
- Interpret/OCR: `POST /api/interpret` – accepts text or uploads to extract vocabulary
- Languages list: `GET /api/languages`
- Alembic migrations: run `alembic upgrade head` from `bolmate-base-core`.

## Frontend (React + TS)
- Routes:
  - `/` – intro + quick actions
  - `/flashcards` – add/list words with stats
  - `/quiz` – one-by-one quiz with hints
  - `/interpret` – paste text and save extracted flashcards
- API base URL via `VITE_API_BASE_URL` (defaults to `http://localhost:5000/api`).

## Development without Docker
- Backend: create a Python 3.13 virtualenv, install `requirements.txt`, run migrations, then `flask --app wsgi run` from `bolmate-base-core`.
- Frontend: `npm install`, then `npm run dev -- --host --port 3000` from `bolmate-base-front`.

## Environment files
- Backend: see `bolmate-base-core/.env.example`
- Frontend: see `bolmate-base-front/.env.example`
