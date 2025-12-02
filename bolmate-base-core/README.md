# Bolmate Base Backend

Flask 3 REST API with SQLAlchemy 1.4, Alembic migrations, PostgreSQL 15, and OpenAI integration for vocabulary learning.

## Features
- **Flask application factory** with modular blueprints organized by domain
- **Healthcheck endpoint** at `/api/health` for container orchestration
- **Flashcards CRUD** at `/api/flashcards` with bulk operations and AI enrichment
- **Quiz system** at `/api/quiz` with reverse mode, answer validation, and AI-generated hints
- **Quiz generation** at `/api/quiz/generate` for mixed-format question sets (translation, multiple choice, fill-in)
- **Interpret endpoints** at `/api/interpret` and `/api/interpret/file` for OCR/text extraction via OpenAI Vision API
- **Language management** at `/api/languages` with dynamic switching and AI translation
- **SQLAlchemy 1.4** session management with scoped sessions and declarative base
- **Alembic migrations** for version-controlled schema evolution (users, flashcards, quizzes, quiz_items)
- **OpenAI service** with in-memory caching, batch processing, and graceful degradation
- **Environment-driven configuration** via Pydantic settings from `.env`
- **CORS support** with configurable origins
- **Pydantic schemas** for request/response validation

## Project layout
```
app/
  __init__.py           # Flask app factory with blueprint registration
  db/
    session.py          # SQLAlchemy engine, SessionLocal, and Base configuration
  models/
    user.py             # User model (id, email, name, timestamps)
    flashcard.py        # Flashcard model with stats tracking and unique constraint
    quiz.py             # Quiz and QuizItem models for structured quiz sessions
  routes/
    health.py           # Health check endpoint
    flashcards.py       # Flashcard CRUD + bulk + enrich endpoints
    quiz.py             # Quiz question fetch, answer submit, generate endpoints
    interpret.py        # Text/file interpretation with OCR support
    languages.py        # Language list and switching endpoints
    users.py            # User management (legacy, not actively used)
  schemas/
    flashcard.py        # Pydantic models for flashcard requests
    quiz.py             # Pydantic models for quiz requests
    interpret.py        # Pydantic models for interpret requests
    language.py         # Pydantic models for language requests
  services/
    openai_service.py   # OpenAI client wrapper with caching and batch processing
config/
  __init__.py           # Pydantic Settings class loading from .env
alembic/
  env.py                # Alembic environment configuration
  versions/             # Migration scripts (initial setup: users, flashcards, quizzes)
wsgi.py                 # Application entry point for production servers
```

## Service Architecture

### Database Layer (`app/db/session.py`)
- PostgreSQL 15 connection via SQLAlchemy 1.4
- Engine configuration: pool_pre_ping for connection health checks
- SessionLocal: scoped session factory for request-level sessions
- Base: declarative base for all models
- All route handlers use explicit session management with try/finally blocks

### Models (`app/models/`)
- **User**: Basic user model for future multi-tenancy
- **Flashcard**: Core model with fields:
  - `source_word`, `source_language` (word being learned)
  - `translated_word`, `native_language` (learner's language)
  - `example_sentence`, `example_sentence_translated` (AI-enriched)
  - `difficulty_level` (A1/A2/B1, AI-assigned)
  - `correct_count`, `incorrect_count` (quiz performance tracking)
  - `is_manual` (user-created vs AI-extracted)
  - Unique constraint: `(source_word, source_language, native_language)`
- **Quiz & QuizItem**: Structured quiz sessions (future feature, not yet fully implemented)

### Routes (`app/routes/`)
All routes use Pydantic schemas for validation and return JSON responses.

#### Flashcards (`flashcards.py`)
- `GET /api/flashcards` – List with filters (source_language, difficulty_level), ordered by ID desc
- `POST /api/flashcards` – Create single flashcard, returns 409 on duplicate
- `POST /api/flashcards/bulk` – Create multiple flashcards, skips duplicates, returns detailed report
- `GET /api/flashcards/<id>` – Fetch single flashcard
- `PUT /api/flashcards/<id>` – Update flashcard fields, returns 409 on conflict
- `DELETE /api/flashcards/<id>` – Delete flashcard
- `POST /api/flashcards/enrich` – AI-enrich selected flashcards (batch operation)

#### Quiz (`quiz.py`)
- `GET /api/quiz` – Fetch random question with optional filters:
  - `reverse=true/false` – Swap question/answer direction
  - `target_language=<code>` – Filter by target language (native_language in normal mode, source_language in reverse)
- `POST /api/quiz` – Submit answer, updates stats, returns AI hint
- `POST /api/quiz/generate` – Generate mixed quiz questions (uses AI for >5, fallback for ≤5)

#### Interpret (`interpret.py`)
- `POST /api/interpret` – Extract vocabulary from text or files:
  - Accepts JSON, text/plain, or multipart/form-data
  - Routes to text extraction or Vision API based on MIME type
- `POST /api/interpret/file` – Advanced file interpretation:
  - Supports PDF (PyPDF2), DOCX (python-docx), images (Vision API)
  - Deduplicates and merges results

#### Languages (`languages.py`)
- `GET /api/languages` – List supported language codes
- `POST /api/languages/switch` – Translate flashcards to new target language

#### Health (`health.py`)
- `GET /api/health` – Returns `{"status": "ok"}` for monitoring

### Services (`app/services/`)

#### OpenAI Service (`openai_service.py`)
Central AI integration with the following functions:

**Core Functions:**
- `generate_hint_for_flashcard()` – Quiz feedback with hints and examples
- `enrich_flashcards()` – Batch add example sentences and difficulty levels
- `generate_quiz_questions()` – Create diverse quiz formats
- `interpret_text_with_ai()` – Extract vocabulary from text
- `interpret_file_with_ai()` – Handle file interpretation with OCR
- `translate_flashcards()` – Translate flashcards to new language

**Features:**
- In-memory cache with 1000-item limit (MD5-based keys)
- Batch processing (50 items per batch)
- Graceful degradation (returns safe defaults if API unavailable)
- Temperature tuning per use case (0.3 for accuracy, 0.7 for creativity)
- Vision API for images (gpt-4o-mini for cost efficiency)
- JSON mode enforcement for structured responses

## Getting started (local)

### Prerequisites
- Python 3.12+
- PostgreSQL 15
- OpenAI API key (optional, features degrade gracefully)

### Setup
1. Create virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and OpenAI API key
   ```

4. Run migrations:
   ```bash
   alembic upgrade head
   ```

5. Start development server:
   ```bash
   flask --app wsgi run --host=0.0.0.0 --port=5000
   ```

## Environment variables
See `.env.example` for the full list. Critical settings:

### Database
- `DATABASE_HOST` – PostgreSQL host (default: localhost)
- `DATABASE_PORT` – PostgreSQL port (default: 5432)
- `DATABASE_USER` – Database username
- `DATABASE_PASSWORD` – Database password
- `DATABASE_NAME` – Database name

### Application
- `APP_ENV` – Environment (development/production)
- `DEBUG` – Debug mode (true/false)
- `ALLOW_ORIGIN` – CORS allowed origins (comma-separated)
- `DEFAULT_NATIVE_LANGUAGE` – Fallback language code (default: en)

### SQLAlchemy
- `SQLALCHEMY_ECHO` – SQL query logging (true/false)

### OpenAI
- `OPENAI_API_KEY` – API key for OpenAI services
- `OPENAI_MODEL` – Model to use (default: gpt-4o-mini)
- `OPENAI_TEMPERATURE` – Temperature for text generation (not used consistently)

## Running inside Docker
The repository root provides `docker-compose.yml` to start the backend, frontend, and PostgreSQL together:
```bash
docker-compose up --build
```
The backend listens on port `5000` by default.

### Docker Services
- `db`: PostgreSQL 15 with persistent volume
- `backend`: Flask app built from `bolmate-base-core/Dockerfile`
- `frontend`: React app built from `bolmate-base-front/Dockerfile`

## Testing
Run tests with pytest:
```bash
pytest tests/
```

Test coverage includes:
- Flashcard CRUD operations and duplicate handling
- Quiz logic (normal and reverse modes)
- AI service fallbacks and caching
- Interpret endpoint with various input formats

## Development Notes
- Use `alembic revision --autogenerate -m "description"` to create migrations
- All database sessions must be explicitly closed in `finally` blocks
- Pydantic schemas enforce validation at API boundaries
- OpenAI calls should always have try/except with fallback behavior
- Keep batch sizes ≤50 for AI operations to avoid timeouts
