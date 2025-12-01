# Bolmate Base

Complete boilerplate combining a Flask backend, React (TypeScript) frontend, and PostgreSQL 15. Everything runs together via `docker-compose up --build`.

## Stack
- **Frontend:** React 18 + TypeScript, Vite, React Router, Axios
- **Backend:** Flask 3, SQLAlchemy 1.4 (legacy ORM), Alembic migrations, psycopg2
- **Database:** PostgreSQL 15

## Project structure
```
bolmate-base-core/   # Backend (Flask)
bolmate-base-front/  # Frontend (React + Vite)
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
3. Visit the app at http://localhost:3000. The API is available at http://localhost:5000.

## Backend
- Healthcheck: `GET /health`
- Users module:
  - `GET /users` – list users
  - `POST /users` – create a user (`name`, `email`)
- Alembic migration for `users` table is included (auto-applied on container start).

## Frontend
- Two routes managed by React Router:
  - `/` – welcome screen and project outline
  - `/users` – user list + form calling the backend API
- API base URL is configured via `VITE_API_BASE_URL`.

## Development without Docker
- Backend: create a Python 3.12+ virtualenv, install `requirements.txt`, run `alembic upgrade head`, then `flask --app wsgi run` from `bolmate-base-core`.
- Frontend: `npm install`, then `npm run dev -- --host --port 3000` from `bolmate-base-front`.

## Environment files
- Backend: see `bolmate-base-core/.env.example`
- Frontend: see `bolmate-base-front/.env.example`

## Migrations
Alembic is preconfigured to use the SQLAlchemy 1.4 metadata. The initial migration creates the `users` table and is executed automatically by the backend entrypoint.
