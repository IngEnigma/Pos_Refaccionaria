#!/usr/bin/env bash
# Resetea la BD E2E (db.e2e.sqlite3), migra, carga la semilla y levanta el backend en 127.0.0.1:8000.
# Nunca toca db.sqlite3 de desarrollo.
set -euo pipefail
BACK="$(cd "$(dirname "$0")/../../RefaccionariaBack" && pwd)"
export DATABASE_URL="sqlite:///$BACK/db.e2e.sqlite3"
export DEBUG=True SECRET_KEY="${SECRET_KEY:-e2e-local}"
cd "$BACK"
rm -f db.e2e.sqlite3
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py seed_e2e
exec .venv/bin/python manage.py runserver 127.0.0.1:8000 --noreload
