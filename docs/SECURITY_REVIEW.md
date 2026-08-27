# PetFlow SaaS — Security Review & Threat Model (PF-069)

## 1. Executive Summary & Security Philosophy

PetFlow is an enterprise multi-tenant Pet Business OS serving veterinary clinics, pet hospitals, and grooming salons across Thailand. Protecting sensitive clinical data, owner Personally Identifiable Information (PII), and financial transactions is paramount to PetFlow's mission.

This document details the multi-layered security architecture, defense-in-depth mechanisms, PDPA compliance controls, and threat modeling assessments implemented in the codebase.

---

## 2. Threat Modeling & STRIDE Matrix

| Threat Category | Potential Risk in Pet Business OS | PetFlow Defense & Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Impersonation of clinic staff or forged LINE webhooks | JWT authentication with HMAC-SHA256 signature verification on all inbound webhooks using `crypto.timingSafeEqual`. |
| **Tampering** | Modifying invoice totals or altering medication records | Immutable financial receipts & inventory ledgers; server-side source-of-truth calculations with satang minor units. |
| **Repudiation** | Denying who created an appointment or changed medical notes | Append-only clinical medical records with veterinarian IDs, audit logging of administrative changes. |
| **Information Disclosure** | Cross-tenant data leakage (Tenant A seeing Tenant B records) | Strict tenant-isolation enforcement in middleware & Prisma query boundaries (Anti-IDOR validation). Low-privilege PII masking. |
| **Denial of Service (DoS)** | Credential brute-forcing, high-volume queue spamming | Sliding-window rate limiting on sensitive endpoints (`/auth/login`, `/security/*`), async BullMQ background processing. |
| **Elevation of Privilege** | Groomer or Receptionist accessing SaaS Admin console | Role-Based Access Control (`RolesGuard`) evaluated strictly server-side on every request. |

---

## 3. Core Security Pillars

### 3.1 Authentication & Token Strategy
- **Password Security**: Strong password policy enforced (min 8 chars, uppercase, lowercase, numbers, special characters, and dictionary blacklist).
- **Password Hashing**: Bcrypt with salted rounds (and Argon2-compatible credential engine).
- **JWT Lifespan & Rotation**: Short-lived Access Tokens paired with secure Refresh Tokens.
- **Tenant Context Binding**: Access tokens carry `tenantId` and `branchIds`, derived solely from the authenticated user.

### 3.2 Multi-Tenant Isolation & IDOR Protection
- **Rule**: Every tenant-owned database entity must include `tenantId`.
- **Query Scoping**: All database operations query with `{ where: { tenantId, id } }` or verify `entity.tenantId === currentTenant.id`.
- **Anti-IDOR Test**: Direct UUID enumeration across tenants returns `403 Forbidden` or `404 Not Found`.

### 3.3 Role-Based Access Control (RBAC)
- Hierarchy: `SUPER_ADMIN` > `TENANT_OWNER` > `TENANT_ADMIN` > `BRANCH_MANAGER` > `VETERINARIAN` > `GROOMER` > `RECEPTIONIST` > `STAFF`.
- `SUPER_ADMIN` console endpoints (`/saas-admin/*`) reject tenant-level staff.
- `RolesGuard` rejects unauthorized roles before controller execution.

### 3.4 File Upload & Attachment Hardening
- **Path Traversal Protection**: Rejection of directory traversals (`../`, `..\`, null bytes `%00`).
- **Dangerous Extensions Blocklist**: Rejection of executable/script extensions (`.php`, `.phtml`, `.exe`, `.sh`, `.bat`, `.js`, `.vbs`, `.dll`, `.scr`, `.jar`, `.svg` with scripts).
- **Strict MIME-Type Whitelist**: Images (`image/jpeg`, `image/png`, `image/webp`), PDF (`application/pdf`), spreadsheets (`text/csv`, `.xlsx`).
- **File Size Caps**: 15 MB maximum per upload.

### 3.5 Webhook HMAC-SHA256 Security
- LINE Messaging API webhooks are verified via `X-Line-Signature`.
- Signatures are compared in constant time (`crypto.timingSafeEqual`) to eliminate timing side-channel attacks.

### 3.6 Thailand PDPA (Personal Data Protection Act) Compliance
- **Consent Flags**: `marketingConsent` and `serviceConsent` recorded on customer CRM profiles.
- **PII Data Masking**: Low-privilege staff roles receive masked customer phone numbers (`081-***-8888`) and emails (`s***@domain.com`).
- **Data Portability**: Full customer and pet history export capability.
- **Audit Trails**: Security actions and deletion requests recorded in `AuditLog`.

---

## 4. Automated Security Test Coverage

Automated test suites guaranteeing security requirements:

| Test Suite | Coverage Area | Status |
| :--- | :--- | :--- |
| `src/security/security.service.spec.ts` | Password strength, file upload sanitization, PII masking, rate limiting | **16 / 16 PASSED** |
| `test/security-audit.e2e-spec.ts` | Cross-tenant isolation (Anti-IDOR), RBAC escalation, webhook forgery, upload defense | **10 / 10 PASSED** |
| `src/common/guards/roles.guard.spec.ts` | Role hierarchy & permission checks | **5 / 5 PASSED** |
| `src/common/middleware/tenant-context.middleware.spec.ts` | Tenant resolution & header validation | **5 / 5 PASSED** |
| `test/critical-flows.e2e-spec.ts` | End-to-end multi-tenant business flows | **8 / 8 PASSED** |

---

## 5. Security Checklist for Production Deployment

- [x] CORS restricted to authorized frontend origins.
- [x] Global `ValidationPipe` configured with `whitelist: true` and `forbidNonWhitelisted: true`.
- [x] Input sanitization and SQL injection prevention via Prisma parameterized queries.
- [x] Constant-time signature verification for external webhooks.
- [x] Strict tenant isolation verified via automated IDOR attack tests.
- [x] Sensitive environment variables excluded from source control (`.env.local`, `.env`).
