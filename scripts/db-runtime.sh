#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME="$ROOT/.runtime/postgres"
DATA="$RUNTIME/data"
LOG="$RUNTIME/postgres.log"
PORT="${DAANSETU_DB_PORT:-55432}"
DB_USER="daansetu"
DB_NAME="daansetu"
DB_PASSWORD="${DAANSETU_DB_PASSWORD:-daansetu}"
export PGPASSWORD="$DB_PASSWORD"
ACTION="${1:-status}"

case "$ACTION" in
  start)
    mkdir -p "$RUNTIME"
    if [[ ! -s "$DATA/PG_VERSION" ]]; then
      mkdir -p "$DATA"
      chmod 700 "$DATA"
      PWFILE="$RUNTIME/.pwfile"
      printf '%s' "$DB_PASSWORD" > "$PWFILE"
      initdb -D "$DATA" --username="$DB_USER" --pwfile="$PWFILE" --auth-host=scram-sha-256 --auth-local=trust >/dev/null
      rm -f "$PWFILE"
      printf "listen_addresses = '127.0.0.1'\nport = %s\nunix_socket_directories = '%s'\n" "$PORT" "$RUNTIME" >> "$DATA/postgresql.conf"
    fi
    if ! pg_isready -h 127.0.0.1 -p "$PORT" -U "$DB_USER" >/dev/null 2>&1; then
      pg_ctl -D "$DATA" -l "$LOG" -w start
    fi
    createdb -h 127.0.0.1 -p "$PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
    ;;
  stop) [[ -s "$DATA/PG_VERSION" ]] && pg_ctl -D "$DATA" -w stop || true ;;
  status) [[ -s "$DATA/PG_VERSION" ]] && pg_ctl -D "$DATA" status || { echo 'DaanSetu PostgreSQL is not initialized.'; exit 3; } ;;
  *) echo 'Usage: scripts/db-runtime.sh start|stop|status' >&2; exit 2 ;;
esac
