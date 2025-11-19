#!/bin/bash
set -e

# Only wait for postgres if USE_POSTGRES is explicitly true
if [ "${USE_POSTGRES}" = "true" ]; then
  POSTGRES_HOST=${POSTGRES_HOST:-postgres}
  POSTGRES_PORT=${POSTGRES_PORT:-5432}
  echo "Waiting for postgres at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
  until nc -z "$POSTGRES_HOST" "$POSTGRES_PORT" 2>/dev/null; do
    sleep 0.1
  done
  echo "PostgreSQL is ready"
fi

echo "Running Django migrations..."
python manage.py migrate --noinput || true

echo "Starting Django server..."
exec "$@"
