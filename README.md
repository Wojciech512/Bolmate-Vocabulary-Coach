# Bolmate Vocabulary Coach

Production-ready learning tool built on the bolmate-base stack (React 18 + TypeScript frontend, Flask 3 + SQLAlchemy 1.4 backend, PostgreSQL 15, Docker Compose). It ships an MVP for rapid Spanish word entry and daily Q&A practice plus an extended multi-language, OCR/interpretation and AI-driven flashcard experience.

## 1) Architecture overview
- **Frontend (bolmate-base-front)** – React 18 + TypeScript SPA using Vite and React Router. Pages: Home, Flashcards (add/list), Quiz (one-word loop), Interpret (OCR/text ingestion). Axios client reads `VITE_API_BASE_URL`.
- **Backend (bolmate-base-core)** – Flask 3 app factory with blueprints under `/api`: health, flashcards CRUD, quiz, AI quiz generation, interpret, languages. OpenAI integration lives in `app/services/openai_service.py`. SQLAlchemy 1.4 models + Alembic migrations.
- **Database** – PostgreSQL 15 storing flashcards, quiz items, and users (for future multi-user).
- **AI/OCR** – OpenAI API for hints, example sentences, quiz generation, and text/image interpretation (base64). OCR for images/PDF is delegated to the AI call; text payloads are parsed directly.
- **Docker Compose** – Runs db, backend (port 5000), frontend (port 3000).

Data flow: user adds words → stored as `flashcards` → quiz endpoint serves random card → answer submission updates stats + optional AI hint → interpret endpoint can ingest pasted text/files, ask AI to extract translations → enriched flashcards ready for study.

## 2) Data models & schema
SQLAlchemy models in `app/models`:
- **User**: id, email, name, created_at.
- **Flashcard**: id, user_id, source_word, source_language, translated_word, native_language, example_sentence, example_sentence_translated, difficulty_level, is_manual, correct_count, incorrect_count, created_at. Unique `(source_word, source_language, native_language)`.
- **Quiz & QuizItem**: Quiz (id, user_id, name, created_at); QuizItem (id, quiz_id, flashcard_id, user_answer, is_correct, metadata JSON).

Alembic migration `alembic/versions/279e6de8b321_initial_setup.py` creates the above tables and constraints.

## 3) API endpoints (all prefixed with `/api`)
- **Health**: `GET /api/health` → `{ "status": "ok" }`.
- **Flashcards** (`app/routes/flashcards.py`):
  - `GET /api/flashcards` – list (filters: `source_language`, `difficulty_level`).
  - `POST /api/flashcards` – create; requires `source_word`, `translated_word`; deduplicated by language pair.
  - `GET /api/flashcards/<id>` – detail.
  - `PUT /api/flashcards/<id>` – update fields.
  - `DELETE /api/flashcards/<id>` – remove.
  - `POST /api/flashcards/enrich` – AI-enrich selected cards (examples, difficulty).
- **Quiz** (`app/routes/quiz.py`):
  - `GET /api/quiz` – random flashcard as question.
  - `POST /api/quiz` – body `{ flashcard_id, answer }`; checks correctness, updates counts, returns optional AI hint/example.
  - `POST /api/quiz/generate` – body `{ num_questions, source_language?, difficulty_level? }`; returns mixed question set (translation, multiple choice, fill-in) via AI fallback.
- **Interpret** (`app/routes/interpret.py`): `POST /api/interpret` accepts JSON text, `text/plain`, or multipart files (images/PDF/text). Uses AI to extract `{ source_word, source_language, translated_word, native_language }` candidates.
- **Languages**: `GET /api/languages` – supported language codes for UI dropdowns.

## 4) Frontend structure
- `src/App.tsx` – routes for Home, Flashcards, Quiz, Interpret.
- `src/context/LanguageContext.tsx` – native language state with localStorage persistence.
- Components: `FlashcardForm`, `FlashcardList`, `QuizPanel`, `InterpretForm`, `Layout`.
- Pages: `HomePage` (overview + calls-to-action), `FlashcardsPage` (form + list), `QuizPage` (one-word quiz loop), `InterpretPage` (AI interpretation).
- Styling in `src/styles/global.css` and `home.css` for minimal, clean UI.

## 5) AI/LLM integration
Backend-only OpenAI client (`app/services/openai_service.py`) wired by env `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TEMPERATURE`.
- `generate_hint_for_flashcard` – short hint + example sentence/translation for quiz feedback.
- `enrich_flashcards` – adds example sentences and difficulty labels.
- `generate_quiz_questions` – creates mixed quiz question formats; deterministic fallback provided when AI unavailable.
- `interpret_text_with_ai` – extracts/distills vocabulary from text/image context.

## 6) OCR / interpretation pipeline
`POST /api/interpret` handles JSON text, plain text, or uploaded files. Text is sent directly to AI. For images/PDFs the bytes are base64-encoded and summarized for AI extraction; results are normalized word candidates for later flashcard creation.

## 7) Running locally
```bash
# Backend
cp bolmate-base-core/.env.example bolmate-base-core/.env
python -m venv .venv && source .venv/bin/activate
pip install -r bolmate-base-core/requirements.txt
cd bolmate-base-core && alembic upgrade head && flask --app wsgi run

# Frontend
cd bolmate-base-front
cp .env.example .env
npm install
npm run dev -- --host --port 3000

# Or run everything
docker-compose up --build
```

## 8) Testing notes
- Quiz logic: unit-test by seeding flashcards then calling `POST /api/quiz` with correct/incorrect answers; assert counter increments and hint presence.
- Flashcard CRUD: API tests for creation, duplicate handling (expect 409), update/delete flows.
- Quiz generation: mock OpenAI client to validate fallback structure and AI payload formation.
- Interpret: mock `interpret_text_with_ai` to ensure text/file requests return normalized items.

## 9) Environment variables
- Backend (`bolmate-base-core/.env`): DB settings, `ALLOW_ORIGIN`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `DEFAULT_NATIVE_LANGUAGE`.
- Frontend (`bolmate-base-front/.env`): `VITE_API_BASE_URL`.

## 10) Database migrations
Alembic is configured to run against SQLAlchemy metadata. The initial migration builds `users`, `flashcards`, `quizzes`, and `quiz_items` tables with constraints and defaults.

