# Bolmate Vocabulary Coach

Spanish vocabulary learning tool built on the bolmate-base stack: React 18 + TypeScript frontend, Flask 3 + SQLAlchemy 1.4 backend, PostgreSQL 15, and Docker Compose. It supports manual word entry, flashcard CRUD, AI-assisted quizzes, and OCR/interpretation of notebook photos.

## Stack
- **Frontend:** React 18, TypeScript, Vite, React Router, Axios
- **Backend:** Flask 3, SQLAlchemy 1.4, Alembic, psycopg2
- **Database:** PostgreSQL 15
- **AI/OCR:** OpenAI Chat + Vision (server-side only)

## Features
- Add Spanish→native flashcards with per-word success stats
- Daily quiz flow with correctness tracking and AI hints/examples
- AI-generated quiz variants (multiple choice + fill-in)
- Interpret text/images/PDFs to extract vocabulary, enrich, and save as flashcards
- Multi-language native translation support (picker in header)

## Project structure
```
bolmate-base-core/   # Backend (Flask API + migrations + OpenAI services)
bolmate-base-front/  # Frontend (React + Vite SPA)
docker-compose.yml   # Multi-container setup
```

## Quickstart
1. Copy environment examples and adjust if needed:
   - `cp bolmate-base-core/.env.example bolmate-base-core/.env`
   - (optional) create `bolmate-base-front/.env` with `VITE_API_BASE_URL=http://localhost:5000`
2. Build and start everything:
   ```
   docker-compose up --build
   ```
3. Visit http://localhost:3000. API lives at http://localhost:5000/api.

## Key API endpoints
- `GET /api/health`
- `GET/POST /api/flashcards`, `GET/PUT/DELETE /api/flashcards/{id}`
- `POST /api/flashcards/bulk/enrich`
- `GET /api/quiz` (random card), `POST /api/quiz` (check answer), `POST /api/quiz/generate`
- `POST /api/interpret` (text/file), `POST /api/interpret/save`
- `GET /api/languages`

## Development without Docker
- Backend: Python 3.13 virtualenv → `pip install -r requirements.txt` → `alembic upgrade head` → `flask --app wsgi run --host=0.0.0.0 --port=5000`
- Frontend: `npm install` → `npm run dev -- --host --port 3000`

## Notes
- OpenAI key is read from backend `.env` (`OPENAI_API_KEY`). Frontend never sees the secret.
- OCR falls back to simple text parsing when the OpenAI key is absent.
