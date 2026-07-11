#!/usr/bin/env bash
set -euo pipefail
URL="${DATABASE_URL:-postgresql://daansetu:daansetu@127.0.0.1:55432/daansetu}"
psql "$URL" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO users (id, name, email, email_verified, role)
VALUES ('00000000-0000-4000-8000-000000000001', 'DaanSetu Demo Supporter', 'supporter@local.test', true, 'supporter')
ON CONFLICT (email) DO NOTHING;
SQL
