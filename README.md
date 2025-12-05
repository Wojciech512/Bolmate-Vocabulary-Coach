# Bolmate Vocabulary Coach
<img width="1909" height="543" alt="image" src="https://github.com/user-attachments/assets/6c677890-478b-49f1-9c3b-1b396f3a0abe" />

Production-ready learning tool built on the bolmate-base stack (React 18 + TypeScript frontend, Flask 3 + SQLAlchemy 1.4 backend, PostgreSQL 15, Docker Compose). It ships an MVP for rapid multi-language word entry and daily Q&A practice plus an extended multi-language, OCR/interpretation and AI-driven flashcard experience.

## 1) Architecture overview
- **Frontend (bolmate-base-front)** – React 18 + TypeScript SPA using Vite and React Router. Pages: Home, Flashcards (add/list), Quiz (one-word loop with reverse mode), Interpret (OCR/text ingestion). Axios client reads `VITE_API_BASE_URL` for backend communication.
- **Backend (bolmate-base-core)** – Flask 3 app factory with blueprints under `/api`: health, flashcards CRUD (including bulk operations), quiz (with reverse mode support), AI quiz generation, interpret (text and file), languages (with switching capability). OpenAI integration lives in `app/services/openai_service.py` with in-memory caching. SQLAlchemy 1.4 models + Alembic migrations.
- **Database** – PostgreSQL 15 storing flashcards (with unique constraint on source_word+language pair), quiz items, and users (for future multi-user).
- **AI/OCR** – OpenAI API (gpt-4o-mini for vision, configurable model for text) for hints, example sentences, quiz generation, and text/image interpretation. Supports PDF (PyPDF2), DOCX (python-docx), and images (Vision API). Includes response caching with 1000-item limit.
- **Docker Compose** – Orchestrates db (PostgreSQL 15), backend (port 5000), frontend (port 3000) services.

Data flow: user adds words → stored as `flashcards` with language metadata → quiz endpoint serves random card (normal or reversed) → answer submission updates stats (correct_count/incorrect_count) + optional AI hint → interpret endpoint can ingest pasted text/files, ask AI to extract translations with deduplication → enriched flashcards ready for study.

## 2) Data models & schema
SQLAlchemy models in `app/models`:
- **User**: id, email, name, created_at.
- **Flashcard**: id, user_id, source_word, source_language, translated_word, native_language, example_sentence, example_sentence_translated, difficulty_level, is_manual, correct_count, incorrect_count, created_at. Unique `(source_word, source_language, native_language)`.
- **Quiz & QuizItem**: Quiz (id, user_id, name, created_at); QuizItem (id, quiz_id, flashcard_id, user_answer, is_correct, metadata JSON).

Alembic migration `alembic/versions/279e6de8b321_initial_setup.py` creates the above tables and constraints.

## 3) API endpoints (all prefixed with `/api`)

### Health (`app/routes/health.py`)
- `GET /api/health` → `{ "status": "ok" }`. Used for container health checks and monitoring.

### Flashcards (`app/routes/flashcards.py`)
- `GET /api/flashcards` – List all flashcards with optional filters (`source_language`, `difficulty_level`). Returns array ordered by ID descending.
- `POST /api/flashcards` – Create single flashcard. Required: `source_word`, `translated_word`. Optional: `source_language` (defaults to "es"), `native_language` (from config), `difficulty_level`, `example_sentence`, `example_sentence_translated`, `is_manual`. Returns 201 on success, 409 if duplicate (unique constraint on source_word+source_language+native_language).
- `POST /api/flashcards/bulk` – Create multiple flashcards in one request. Body: `{ flashcards: [{ source_word, translated_word, ... }] }`. Skips duplicates and returns: `{ created: [...], created_count, skipped_count, error_details }`. Uses explicit duplicate checking before insertion.
- `GET /api/flashcards/<id>` – Get single flashcard detail.
- `PUT /api/flashcards/<id>` – Update flashcard fields. Returns 409 if update would create duplicate.
- `DELETE /api/flashcards/<id>` – Remove flashcard. Returns `{ "status": "deleted" }`.
- `POST /api/flashcards/enrich` – AI-enrich selected cards. Body: `{ ids: [1, 2, 3], native_language? }`. Calls `enrich_flashcards()` service to add example sentences and difficulty levels. Updates database with AI-generated content.

### Quiz (`app/routes/quiz.py`)
- `GET /api/quiz?reverse=<bool>&target_language=<code>` – Get random flashcard as quiz question.
  - Normal mode (`reverse=false`): Returns source_word (question) and expects translated_word (answer). Filters by native_language when target_language provided.
  - Reverse mode (`reverse=true`): Swaps question/answer direction. Returns translated_word as question, expects source_word as answer. Filters by source_language when target_language provided.
  - Returns: `{ flashcard_id, source_word, source_language, native_language, translated_word, correct_count, incorrect_count, is_reversed }`.
  - Uses `func.random()` for random selection from filtered pool.
- `POST /api/quiz?reverse=<bool>` – Submit quiz answer. Body: `{ flashcard_id, answer }`.
  - Compares lowercased answer with correct answer (direction depends on reverse mode).
  - Increments correct_count or incorrect_count on flashcard.
  - Calls `generate_hint_for_flashcard()` to get AI hint + example sentence.
  - Returns: `{ correct: bool, correctAnswer: str, stats: {...}, hint?, example_sentence?, example_translation? }`.
- `POST /api/quiz/generate` – Generate AI quiz. Body: `{ num_questions, source_language?, difficulty_level? }`.
  - Fetches and shuffles matching flashcards.
  - Calls `generate_quiz_questions()` service (uses AI for >5 questions, fallback for ≤5).
  - Returns: `{ questions: [{ question, type, answer, options? }] }`.

### Interpret (`app/routes/interpret.py`)
- `POST /api/interpret` – Extract vocabulary from text. Supports three formats:
  - JSON: `{ text: "...", native_language: "en" }`
  - text/plain: Raw text in request body
  - multipart/form-data: Single or multiple files via `file` field
  - Detects MIME type and routes to appropriate handler (text extraction for text files, Vision API for images, PyPDF2 for PDFs, python-docx for DOCX).
  - Returns: `{ items: [{ source_word, source_language, translated_word, native_language }] }`.
- `POST /api/interpret/file` – Advanced file interpretation with OCR support.
  - Accepts multiple files via `files` field + `native_language` form param.
  - Processes each file: extracts text (PDF/DOCX/TXT) or uses Vision API (images).
  - Calls `interpret_file_with_ai()` which uses appropriate extraction method + AI interpretation.
  - Deduplicates and merges results via `_merge_and_deduplicate_items()`.
  - Returns: `{ items: [...] }`.

### Languages (`app/routes/languages.py`)
- `GET /api/languages` – List supported language codes for UI dropdowns. Returns: `{ languages: [{ code, label }] }`.
- `POST /api/languages/switch` – Switch flashcards to new target language. Body: `{ target_language, flashcard_ids?, force_retranslate? }`. Uses `translate_flashcards()` service to retranslate content via AI. Returns: `{ flashcards: [...], meta: { target_language, translated_count, skipped_count, force_retranslate } }`.

## 4) Frontend structure

### Core Files
- `src/main.tsx` – Application entry point. Sets up React root with context providers (Loading, Snackbar, Language, Theme).
- `src/App.tsx` – Main router component. Defines routes: `/` (Home), `/flashcards` (Flashcards), `/quiz` (Quiz), `/interpret` (Interpret), `/users` (Users - legacy).
- `src/api.ts` – Axios client configuration and API functions. Base URL from `VITE_API_BASE_URL`. Includes global error interceptor, TypeScript types for all requests/responses, and functions: `fetchFlashcards()`, `createFlashcard()`, `bulkCreateFlashcards()`, `deleteFlashcard()`, `getQuizQuestion()`, `submitQuizAnswer()`, `generateQuiz()`, `interpretText()`, `interpretFile()`, `fetchLanguages()`, `switchLanguage()`.

### Context Providers (`src/context/`)
- `LanguageContext.tsx` – Manages native language state with localStorage persistence. Provides `nativeLanguage` and `setNativeLanguage()`.
- `LoadingContext.tsx` – Global loading state management. Provides `withLoading()` wrapper for async operations.
- `SnackbarContext.tsx` – Toast notifications. Provides `showSuccess()`, `showError()`, `showInfo()`.
- `ThemeContext.tsx` – MUI theme customization and dark/light mode toggle.

### Pages (`src/pages/`)
- `HomePage.tsx` – Landing page with overview, feature cards, and call-to-action buttons. Links to all major sections.
- `FlashcardsPage.tsx` – Main flashcard management. Renders `FlashcardForm` for adding new words and `FlashcardList` for viewing/deleting existing cards. Filters by source language and difficulty.
- `QuizPage.tsx` – Quiz interface. Renders `QuizPanel` component which handles quiz flow: fetch question → user input → submit → show feedback → next question. Supports reverse mode and language filtering.
- `InterpretPage.tsx` – OCR/text interpretation interface. Renders `InterpretForm` for uploading files or pasting text. Shows extracted vocabulary candidates and allows bulk creation via `bulkCreateFlashcards()`.
- `UsersPage.tsx` – Legacy user management (not actively used).

### Components (`src/components/`)
- `Layout.tsx` – App shell with navigation bar, theme toggle, language selector, and content area.
<img width="1912" height="910" alt="image" src="https://github.com/user-attachments/assets/4f80fbd9-4e3a-442d-b0ac-c083ee1ed25f" />
- `FlashcardForm.tsx` – Form for adding single flashcard. Fields: source word, source language dropdown (fetched from API), translation (auto-labeled with native language). Validates same-language warning. Calls `createFlashcard()` on submit.
- `FlashcardList.tsx` – Table of flashcards with stats (correct/incorrect counts), language badges, difficulty chips. Delete action per row. Supports filtering and sorting.
<img width="1919" height="911" alt="image" src="https://github.com/user-attachments/assets/82e450f9-e488-45dc-9522-3a06b2876e51" />
- `QuizPanel.tsx` – Quiz game logic. States: loading, showing question, showing feedback. Fetches question via `getQuizQuestion()`, validates answer via `submitQuizAnswer()`, displays AI hint/example, shows streak progress. Supports normal/reverse modes and language filtering.
<img width="1919" height="912" alt="image" src="https://github.com/user-attachments/assets/56fcab04-bde8-4bd8-ab8e-15eef74f5882" />
- `InterpretForm.tsx` – File upload + text input form. Supports drag-and-drop for files (PDF, DOCX, images). Calls `interpretFile()` or `interpretText()` based on input type. Displays extracted items as cards with preview + add buttons.
- `LanguageSelector.tsx` – Dropdown for selecting native language. Persists to localStorage via LanguageContext.
- `StreakProgressBar.tsx` – Visual progress bar showing current streak and stats during quiz.
- `ui/` – Shared styled components (buttons, cards, chips) using MUI and custom styling.

### Utilities (`src/utils/`)
- `confetti.ts` – Confetti animation for quiz success celebrations.

### Types (`src/types.ts`)
- TypeScript type definitions for domain models (Flashcard, QuizQuestion, etc.). Kept in sync with API response types in `api.ts`.

## 5) AI/LLM integration

Backend-only OpenAI service (`app/services/openai_service.py`) with configuration from env: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TEMPERATURE`.

### Service Functions
- **`generate_hint_for_flashcard(source_word, translated_word, native_language, source_language)`** – Generates short hint + example sentence + translation for quiz feedback. Uses configurable model with temperature 0.7. Returns JSON: `{ hint, example_sentence, example_translation }`. Cached by word combination. Falls back to empty dict if API unavailable.

- **`enrich_flashcards(words: List[Dict], native_language)`** – Batch enrichment of flashcards. Adds example sentences, example translations, and difficulty levels (A1/A2/B1). Processes in batches of 50 cards. Uses temperature 0.5 for consistency. Returns enriched array in same order. Falls back to original words if AI unavailable.

- **`generate_quiz_questions(cards: List[Dict], num_questions)`** – Creates mixed quiz question formats (translation, multiple choice, fill-in). Uses AI for >5 questions, deterministic fallback for ≤5. AI mode: temperature 0.5, returns diverse question types. Fallback mode: simple translation questions from card data. Returns: `[{ question, type, answer, options? }]`.

- **`interpret_text_with_ai(text, native_language)`** – Extracts vocabulary from text. Preserves translation pairs (e.g., "si - yes"). Merges duplicates. Uses temperature 0.3 for accuracy. Filters out items where source_language == native_language and where source_word == translated_word (untranslated). Returns: `[{ source_word, source_language, translated_word, native_language }]`. Cached by text+language combination.

- **`interpret_file_with_ai(file_content, filename, mime_type, native_language)`** – Advanced file interpretation. Routes to appropriate handler:
  - Text files: Direct decoding + `interpret_text_with_ai()`
  - PDF: PyPDF2 extraction + `interpret_text_with_ai()`
  - DOCX: python-docx extraction + `interpret_text_with_ai()`
  - Images: `_interpret_image_with_vision()` using OpenAI Vision API

- **`_interpret_image_with_vision(image_content, mime_type, native_language)`** – OCR + interpretation using OpenAI Vision API. Uses gpt-4o-mini model (80% cheaper than gpt-4o). Base64-encodes image content. Extracts vocabulary with translation pairs. Filters same-language and untranslated items. Cached by image hash + language.

- **`translate_flashcards(cards: List[Dict], target_language)`** – Translates flashcards to new target language. Keeps source_word and source_language unchanged. Translates translated_word, example_sentence, notes, hints. Processes in batches of 50. Uses temperature 0.3 for accuracy. Falls back to structure-only update (changes native_language field only) if AI unavailable.

### Caching Strategy
- In-memory dictionary cache with MD5 hash keys
- 1000-item limit (FIFO eviction)
- Caches: hints (by word combo), interpret results (by text/image hash), vision results (by image hash)
- Cache key format: `_cache_key(*args)` generates MD5 of stringified arguments
- Consider Redis for production scalability

### Helper Functions
- `_get_client()` – Lazy OpenAI client initialization. Returns None if API key not configured (graceful degradation).
- `encode_file_to_base64(file_bytes)` – Base64 encoding for Vision API payloads.
- `_safe_parse_json(text)` – Robust JSON parsing with fallback to last line (handles streaming responses).
- `_fallback_quiz(cards, num_questions)` – Deterministic quiz generation without AI.
- `_extract_text_from_pdf(content)` – PyPDF2 wrapper (requires PyPDF2 in requirements).
- `_extract_text_from_docx(content)` – python-docx wrapper (requires python-docx in requirements).

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

