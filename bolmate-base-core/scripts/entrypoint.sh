#!/bin/sh
set -e

if [ -f /app/.env ]; then
  set -a
  . /app/.env
  set +a
fi

echo "Waiting for database..."
max_retries=30
retry_count=0

until PGPASSWORD=postgres psql -h db -U postgres -d bolmate_base -c '\q' 2>/dev/null || [ $retry_count -eq $max_retries ]; do
  echo "Database not ready yet, retrying in 2 seconds... ($retry_count/$max_retries)"
  sleep 2
  retry_count=$((retry_count + 1))
done

if [ $retry_count -eq $max_retries ]; then
  echo "Failed to connect to database after $max_retries attempts"
  exit 1
fi

echo "Database is ready, running migrations..."
alembic upgrade head

echo "Starting application..."
exec gunicorn -b 0.0.0.0:5000 wsgi:app