#!/bin/sh
set -e

if [ -f /app/.env ]; then
  export $(grep -v '^#' /app/.env | xargs)
fi

alembic upgrade head
exec gunicorn -b 0.0.0.0:5000 wsgi:app
