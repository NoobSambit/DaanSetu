#!/usr/bin/env bash
set -euo pipefail
if [[ "${NODE_ENV:-}" != "test" ]]; then
  echo 'Refusing destructive reset unless NODE_ENV=test.' >&2
  exit 2
fi
URL="${TEST_DATABASE_URL:-postgresql://daansetu:daansetu@127.0.0.1:55432/daansetu_test}"
DB_NAME="$(printf '%s' "$URL" | sed 's#^.*/##')"
export PGPASSWORD="${DAANSETU_DB_PASSWORD:-daansetu}"
dropdb -h 127.0.0.1 -p "${DAANSETU_DB_PORT:-55432}" -U daansetu --if-exists --force "$DB_NAME"
createdb -h 127.0.0.1 -p "${DAANSETU_DB_PORT:-55432}" -U daansetu "$DB_NAME"
DATABASE_URL="$URL" "$(dirname "$0")/db-migrate.sh"
