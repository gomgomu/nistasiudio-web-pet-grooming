#!/bin/bash
set -e

BACKUP_FILE=$1
CONFIRM=$2

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./scripts/restore.sh <path_to_backup_file.sql.gz> [--confirm]"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file '$BACKUP_FILE' does not exist."
  exit 1
fi

if [ "$CONFIRM" != "--confirm" ]; then
  echo "WARNING: This will overwrite the target database!"
  echo "Pass --confirm to execute restoration."
  exit 1
fi

echo "[PetFlow Restore] Starting database restore from ${BACKUP_FILE}..."

# Check companion checksum if exists
if [ -f "${BACKUP_FILE}.meta.json" ]; then
  echo "Verifying checksum..."
  EXPECTED_SHA=$(grep '"sha256":' "${BACKUP_FILE}.meta.json" | cut -d'"' -f4)
  ACTUAL_SHA=$(sha256sum "${BACKUP_FILE}" | awk '{print $1}')
  if [ "$EXPECTED_SHA" != "$ACTUAL_SHA" ]; then
    echo "ERROR: Checksum mismatch! Expected ${EXPECTED_SHA}, but got ${ACTUAL_SHA}"
    exit 1
  fi
  echo "Checksum matched: ${ACTUAL_SHA}"
fi

# Restore through psql
gunzip -c "${BACKUP_FILE}" | psql "$DATABASE_URL"

echo "[PetFlow Restore] Database restored successfully."
