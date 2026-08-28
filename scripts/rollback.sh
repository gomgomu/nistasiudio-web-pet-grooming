#!/bin/bash
set -e

TARGET_TAG=${1:-"HEAD~1"}
echo "=== [PetFlow] Initiating Rollback to: ${TARGET_TAG} ==="

echo "[1/3] Checking out target version..."
git checkout "${TARGET_TAG}"

echo "[2/3] Rebuilding and restarting containers..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo "[3/3] Verifying health status post-rollback..."
sleep 5
if curl -sf http://localhost/health > /dev/null; then
  echo "=== [PetFlow] Rollback Successful. Platform is operational. ==="
  exit 0
else
  echo "Error: Platform unhealthy after rollback. Please inspect container logs immediately."
  exit 1
fi
