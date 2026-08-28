# PetFlow — Backup and Disaster Recovery Playbook

## 1. Overview & Objectives

PetFlow is a mission-critical multi-tenant SaaS operating veterinary clinics and pet grooming facilities. Business continuity, data durability, and tenant privacy (PDPA compliance) are foundational.

### Target Recovery Objectives
- **RPO (Recovery Point Objective):** ≤ 15 minutes (Maximum acceptable data loss window)
- **RTO (Recovery Time Objective):** ≤ 30 minutes (Maximum acceptable system downtime for full recovery)

---

## 2. Backup Strategy Architecture

```
+-------------------------------------------------------------------------+
|                           PetFlow Database                              |
|                          (PostgreSQL on AWS/RDS)                        |
+-------------------------------------------------------------------------+
       |                                          |
       | Continuous (15 min)                      | Daily Automated (02:00 AM UTC)
       v                                          v
+-----------------------------+            +------------------------------+
| WAL Archiving               |            | Full Gzipped Database Dump   |
| (Point-in-Time Recovery)    |            | (pg_dump + SHA-256 Checksum) |
+-----------------------------+            +------------------------------+
       |                                          |
       +--------------------+---------------------+
                            |
                            v
            +-------------------------------+
            | S3-Compatible Encrypted Store |
            | (AES-256 / Bucket Versioning) |
            +-------------------------------+
                            |
           +----------------+----------------+
           |                                 |
           v                                 v
+-----------------------+         +-----------------------+
| Local Retention Cache |         | Tenant Isolated Export|
| (7 Days on-host)      |         | (PDPA / On-Demand)    |
+-----------------------+         +-----------------------+
```

### Backup Categories

| Backup Type | Frequency | Format | Retention Policy | Storage Location |
| :--- | :--- | :--- | :--- | :--- |
| **Full DB Dump** | Daily (02:00 AM) | Custom/Compressed `.dump.gz` | Daily: 30 days<br>Weekly: 12 weeks<br>Monthly: 12 months | Encrypted Cloud S3 + Local |
| **Point-in-Time (WAL)** | Continuous (15m archive) | WAL Segments | 7 days sliding window | Managed RDS / Cloud Storage |
| **Tenant-Isolated Dump**| On-demand / PDPA Request | Structured JSON / SQL | 30 days | S3 Tenant Archive Vault |

---

## 3. Automated Backup Execution

### Cross-Platform Runner (Node/TypeScript)
```bash
# Run on-demand full database backup with checksum & rotation
pnpm db:backup

# Run tenant-specific data export (PDPA / data portability)
pnpm tenant:export --tenant-id=<TENANT_UUID> --output=./backups/tenant.json
```

### Docker / Linux Shell Script
```bash
# Automated cron backup
./scripts/backup.sh
```

---

## 4. Disaster Recovery (DR) Procedures

### Scenario A: Catastrophic Database Loss (Full Restore)

1. **Stop Application Traffic:**
   ```bash
   docker compose stop web api
   ```

2. **Verify Backup Integrity & Checksum:**
   ```bash
   # Calculate SHA-256 checksum and verify against metadata
   sha256sum ./backups/petflow_backup_2026-08-27.dump.gz
   ```

3. **Execute Database Restoration:**
   ```bash
   pnpm db:restore --file=./backups/petflow_backup_2026-08-27.dump.gz --confirm=true
   ```

4. **Verify Schema & Data Consistency:**
   - Check database connection: `pnpm prisma:generate`
   - Run API health check: `GET /api/v1/health`
   - Verify tenant record counts.

5. **Resume Application Traffic:**
   ```bash
   docker compose start web api
   ```

---

### Scenario B: Single Tenant Accidental Deletion / Data Rescue

If a specific tenant accidentally deletes records or requests a point-in-time restore:
1. Spin up a temporary recovery database from the latest full dump.
2. Run `pnpm tenant:export --tenant-id=<TENANT_ID>` on the temporary database.
3. Import the isolated tenant data back into production using transactional upserts without disrupting other tenants.

---

## 5. Security, PDPA & Encryption Guidelines

1. **Encryption at Rest:** All backup archives must be encrypted using AES-256 before upload to cloud storage.
2. **Encryption in Transit:** SSL/TLS 1.3 required for all database and S3 connections (`sslmode=require`).
3. **Access Control:** Super-admin only access. No individual tenant can access raw database dumps.
4. **Audit Trail:** Every backup creation, verification, download, and restore operation is recorded into `AuditLog` in PostgreSQL.
5. **PDPA Data Portability:** Tenant owners can request an export of their data via `GET /api/v1/saas-admin/tenants/:id/export`.
