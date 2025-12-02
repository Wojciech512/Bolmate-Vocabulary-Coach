#!/bin/sh
set -e

until python - <<'PY'
import os
import sys
import psycopg2

try:
    conn = psycopg2.connect(
        host=os.environ.get("DATABASE_HOST", "db"),
        port=os.environ.get("DATABASE_PORT", "5432"),
        user=os.environ.get("DATABASE_USER"),
        password=os.environ.get("DATABASE_PASSWORD"),
        dbname=os.environ.get("DATABASE_NAME"),
    )
    conn.close()
except Exception:
    sys.exit(1)
PY
 do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
 done

authenticated_url="${DATABASE_URL:-}"
if [ -z "$authenticated_url" ]; then
  echo "Running migrations..."
fi
alembic upgrade head

exec flask --app wsgi run --host=0.0.0.0 --port=5000 --reload --debug
