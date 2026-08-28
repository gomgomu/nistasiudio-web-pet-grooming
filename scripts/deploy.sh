#!/bin/bash
set -e

echo "=== [PetFlow] Starting Production Deployment ==="

# 1. Check environment file
if [ ! -f ".env.production" ]; then
  echo "Error: .env.production file is missing. Please copy from .env.production.example"
  exit 1
fi

# 2. Run pre-deployment snapshot
echo "[1/4] Creating pre-deployment database backup..."
pnpm db:backup || echo "Warning: Pre-deployment backup skipped or failed, proceeding cautiously."

# 3. Apply database migrations
echo "[2/4] Applying Prisma migrations..."
pnpm prisma:migrate || pnpm prisma migrate deploy

# 4. Build and start production containers
echo "[3/4] Building and launching containers..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# 5. Smoke test health endpoint
echo "[4/4] Verifying health check..."
sleep 5
for i in {1..10}; do
  if curl -sf http://localhost/health > /dev/null; then
    echo "=== [PetFlow] Deployment Successful! Platform is healthy. ==="
    exit 0
  fi
  echo "Waiting for healthcheck (attempt $i/10)..."
  sleep 3
done

echo "Error: Healthcheck failed after deployment. Check container logs with 'docker compose -f docker-compose.prod.yml logs'"
exit 1
