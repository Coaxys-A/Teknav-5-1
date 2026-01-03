#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +"%Y%m%d-%H%M%S")
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
mkdir -p "$BACKUP_DIR"

echo "Dumping Postgres..."
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set" >&2
else
  pg_dump "$DATABASE_URL" > "$BACKUP_DIR/postgres-$DATE.sql"
fi

echo "Capturing Redis snapshot (requires redis-cli)..."
if command -v redis-cli >/dev/null 2>&1; then
  redis-cli --rdb "$BACKUP_DIR/redis-$DATE.rdb"
else
  echo "redis-cli not installed; skipping Redis dump"
fi

echo "Backup complete to $BACKUP_DIR"
