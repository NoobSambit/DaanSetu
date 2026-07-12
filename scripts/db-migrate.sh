#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DATABASE_URL="${DATABASE_URL:-postgresql://daansetu:daansetu@127.0.0.1:55432/daansetu}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'CREATE TABLE IF NOT EXISTS drizzle_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())' >/dev/null
for migration in "$ROOT"/drizzle/[0-9][0-9][0-9][0-9]_*.sql; do
  name="$(basename "$migration" .sql)"
  if [[ "$(psql "$DATABASE_URL" -Atc "SELECT count(*) FROM drizzle_migrations WHERE name = '$name'")" == "0" ]]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f "$migration"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO drizzle_migrations (name) VALUES ('$name')" >/dev/null
  else
    echo "$name already applied."
  fi
done
