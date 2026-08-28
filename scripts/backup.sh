#!/bin/bash
set -e

# Configuration
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
RETENTION_DAYS=${RETENTION_DAYS:-30}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/petflow_backup_${TIMESTAMP}.sql.gz"

echo "[PetFlow Backup] Starting database backup at $(date)..."
mkdir -p "${BACKUP_DIR}"

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set."
  exit 1
fi

# Run pg_dump piped through gzip
pg_dump "$DATABASE_URL" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"

# Calculate SHA256 checksum
SHA256_HASH=$(sha256sum "${BACKUP_FILE}" | awk '{print $1}')
echo "Backup generated: ${BACKUP_FILE}"
echo "SHA-256 Checksum: ${SHA256_HASH}"

# Create metadata companion
cat <<EOF > "${BACKUP_FILE}.meta.json"
{
  "filename": "$(basename "${BACKUP_FILE}")",
  "sha256": "${SHA256_HASH}",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "sizeBytes": $(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")
}
EOF

# Clean up older backups
echo "[PetFlow Backup] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "petflow_backup_*.sql.gz*" -mtime +${RETENTION_DAYS} -delete

echo "[PetFlow Backup] Backup completed successfully."
