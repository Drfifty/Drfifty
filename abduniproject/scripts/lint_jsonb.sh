#!/bin/sh
# FIX-360-05: R7 CI gate — fail if JSONB used in MySQL migrations (Postgres JSONB only in pgsql)
# Usage: sh scripts/lint_jsonb.sh
set -e
echo "lint_jsonb: scanning database/migrations for JSONB misuse (R7)..."
if grep -R --include="*.php" -n "JSONB\|->jsonb\|jsonb(" database/migrations 2>/dev/null; then
  # Allow pgsql clinical file to mention JSONB only inside comment mentioning pgsql
  BAD=$(grep -R --include="*.php" -n "JSONB\|->jsonb" database/migrations 2>/dev/null | grep -v "pgsql" | grep -v "JSONB is PostgreSQL-only" | grep -v "pgcrypto" || true)
  if [ -n "$BAD" ]; then
    echo "FAIL: JSONB found in MySQL migrations (R7) — use JSON not JSONB"
    echo "$BAD"
    exit 1
  fi
fi
echo "lint_jsonb: pass — no JSONB in MySQL migrations"
