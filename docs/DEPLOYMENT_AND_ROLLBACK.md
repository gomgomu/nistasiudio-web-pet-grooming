# PetFlow — Deployment and Rollback Playbook

## 1. Zero-Downtime Deployment Flow

```
[Git Master / Tag]
        |
        v
[CI / Automated Tests & Typecheck]
        |
        v
[Build Multi-Stage Docker Images (API + Web)]
        |
        v
[Database Migration: `prisma migrate deploy`]
        |
        v
[Rolling Container Replacement (Nginx Upstream)]
        |
        v
[Automated Smoke Test / Healthcheck]
```

### Standard Production Deployment Steps

1. **Pull Latest Release & Run Automated Pre-Flight Check:**
   ```bash
   git fetch origin && git checkout tags/v1.0.0
   ./scripts/deploy.sh
   ```

2. **Execute Database Migrations:**
   ```bash
   pnpm prisma migrate deploy
   ```

3. **Build & Restart Services:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
   ```

4. **Verify Health Endpoint:**
   ```bash
   curl -f http://localhost:80/health || exit 1
   ```

---

## 2. Fast Rollback Procedure (Emergency Recovery)

If a critical defect or migration failure is detected post-deployment:

### Step 1: Revert Containers to Previous Version
```bash
./scripts/rollback.sh <PREVIOUS_COMMIT_OR_TAG>
```

### Step 2: Database Migration Rollback (if schema changed)
1. If the previous migration is non-destructive (e.g. additive column), keep database forward.
2. If destructive migration occurred, restore from the pre-deployment snapshot:
   ```bash
   pnpm db:restore --file=./backups/pre_deploy_backup.sql --confirm=true
   ```

### Step 3: Verify System Status
```bash
curl -i http://localhost/health
curl -i -H "Authorization: Bearer <TOKEN>" http://localhost/api/v1/observability/metrics
```
