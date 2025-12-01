# Bolmate Base

Production-ready starter combining a Flask backend, PostgreSQL database, and React (TypeScript) frontend. Everything is wired for Docker Compose so you can run the full stack with a single command.

## Stack
- **Backend:** Python 3.12, Flask, SQLAlchemy 1.4 (legacy ORM), Alembic, psycopg2
- **Frontend:** React 18 with TypeScript, Vite, React Router, Axios
- **Database:** PostgreSQL 15
- **Containerization:** Docker + docker-compose

## Project layout
```
bolmate-base/
├── bolmate-base-core/        # Flask application
│   ├── app/                  # Flask factory
│   ├── config/               # Environment loading
│   ├── routes/               # Blueprints (health, users)
│   ├── services/             # Business logic
│   ├── models/               # SQLAlchemy models
│   ├── db/                   # Engine & session setup
│   ├── alembic/              # Migrations
│   ├── scripts/entrypoint.sh # Container start script
│   ├── requirements.txt
│   └── Dockerfile
├── bolmate-base-front/       # React app
│   ├── src/                  # Components, pages, routing
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Environment configuration
Copy the example environment files and adjust if needed:

```bash
cp bolmate-base-core/.env.example bolmate-base-core/.env
cp bolmate-base-front/.env.example bolmate-base-front/.env
```

Use `.env.local` files for local overrides (optional). Default values target the docker-compose network.
- Frontend `VITE_API_BASE_URL` defaults to `http://backend:5000` for containers; switch to `http://localhost:5000` when running the API locally.

## Running with Docker Compose
Build and start the full stack:

```bash
docker-compose up --build
```

Services:
- Backend: http://localhost:5000 (healthcheck at `/health`, users at `/users`)
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432 (database `bolmate_base`)

The backend container runs database migrations automatically on startup.

## Manual backend usage
If you prefer running the API locally:

```bash
cd bolmate-base-core
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
FLASK_ENV=development flask --app wsgi run
```

## Manual frontend usage
```bash
cd bolmate-base-front
npm install
npm run dev -- --host --port 5173
```

## Sample features
- `/health` endpoint for uptime checks
- Users module: `GET /users` and `POST /users` (name + email)
- React UI with navigation, start page, and a simple user form hitting the backend API

## Migrations
Alembic is preconfigured for SQLAlchemy 1.4. To create new migrations:

```bash
cd bolmate-base-core
alembic revision -m "describe change"
alembic upgrade head
```

## Notes
- Dependency versions are fully pinned for reproducibility.
- Docker images expose backend on port 5000 and frontend on port 5173.
