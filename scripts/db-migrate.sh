#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DATABASE_URL="${DATABASE_URL:-postgresql://daansetu:daansetu@127.0.0.1:55432/daansetu}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'CREATE TABLE IF NOT EXISTS drizzle_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())' >/dev/null
if [[ "$(psql "$DATABASE_URL" -Atc "SELECT count(*) FROM drizzle_migrations WHERE name = '0001_platform_foundation'")" == "0" ]]; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f "$ROOT/drizzle/0001_platform_foundation.sql"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO drizzle_migrations (name) VALUES ('0001_platform_foundation')" >/dev/null
else
  echo '0001_platform_foundation already applied.'
fi
