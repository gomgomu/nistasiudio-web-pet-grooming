# PetFlow — Production Launch Checklist

## 1. Pre-Launch Infrastructure Checklist

- [ ] **Domain & DNS:** Domain `petflow.th` configured with Cloudflare DNS proxy (Full Strict SSL).
- [ ] **SSL/TLS Certificates:** Valid SSL certs provisioned and auto-renewing (Let's Encrypt / Cloudflare Edge).
- [ ] **Environment Variables:** `.env.production` populated with cryptographically secure random secrets (`openssl rand -hex 32`).
- [ ] **Database Connection Pool:** PostgreSQL connection pool sizing configured based on expected concurrent workers (default max 50).
- [ ] **Redis Persistence:** Redis configured with password authentication and AOF (`appendonly yes`).

---

## 2. Security & Compliance Checklist (PDPA Ready)

- [ ] **CORS Origins:** Restricted strictly to registered client domains (`https://app.petflow.th`, `https://admin.petflow.th`).
- [ ] **Rate Limiting:** Enabled on `/api/v1/auth/*` (max 5 req/s) and `/api/*` (max 30 req/s) in Nginx reverse proxy.
- [ ] **Tenant Isolation Guard:** Automated tenant isolation tests passed in CI (`pnpm test`).
- [ ] **Argon2 Hashing:** Password hashing uses recommended memory cost and parallelism.
- [ ] **Audit Trail:** Super-admin actions, tenant activations, exports, and status changes write to `AuditLog`.

---

## 3. Database & Storage Readiness

- [ ] **Prisma Migration:** Run `prisma migrate deploy` before launching container traffic.
- [ ] **Seed Base Data:** Initial SaaS subscription tiers and system settings populated.
- [ ] **Automated Backup Cron:** Daily automated database backup configured (`pnpm db:backup` / `scripts/backup.sh`).
- [ ] **S3 / R2 Bucket:** Bucket created with private ACL and CORS configured for presigned URL uploads.

---

## 4. Observability & Monitoring

- [ ] **Health Endpoint:** `GET /api/v1/health` verified returning `200 OK`.
- [ ] **Metrics Monitoring:** `GET /api/v1/observability/metrics` operational.
- [ ] **Error Tracking:** Sentry / Webhook alerts configured for uncaught 5xx exceptions.
- [ ] **BullMQ Queues:** Notification, Reminder, and Campaign workers confirmed active.
