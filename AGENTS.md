# AGENTS.md — PetFlow SaaS

## 1. Project goal

PetFlow is a multi-tenant SaaS for Thai pet businesses:

- Veterinary clinics
- Pet hospitals (small/medium)
- Pet grooming shops
- Businesses combining veterinary + grooming
- Future expansion: pet hotel / pet shop

Core product value:

1. Reduce admin workload
2. Reduce booking conflicts and no-shows
3. Centralize pet/customer history
4. Automate LINE reminders and follow-ups
5. Increase repeat revenue
6. Give owners visibility into revenue, costs, and operations

The first release is NOT a full veterinary hospital information system.
The MVP must prioritize:

- Customer + Pet CRM
- Appointment / Calendar
- Grooming Queue
- POS / Invoice
- Basic Inventory
- LINE-ready notification architecture
- Retention / reminder engine

---

## 2. Technology stack

### Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- Recharts

### Backend

- Node.js
- TypeScript
- NestJS
- REST API
- Swagger / OpenAPI

### Data

- PostgreSQL
- Prisma ORM
- Redis
- BullMQ

### Runtime / infrastructure

- Docker / Docker Compose
- Nginx or reverse proxy
- S3-compatible object storage
- Cloudflare-ready

### Authentication

- JWT access token
- Refresh token
- Argon2 preferred
- RBAC
- Tenant isolation

---

## 3. Repository structure

Use a monorepo:

```text
petflow/
├─ apps/
│  ├─ web/                 # Next.js
│  └─ api/                 # NestJS
├─ packages/
│  ├─ ui/                  # shared UI components
│  ├─ types/               # shared TypeScript types
│  ├─ config/              # shared config
│  └─ eslint-config/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ docs/
│  ├─ IMPLEMENTATION_PLAN.md
│  ├─ ERD.md
│  └─ TASKS.md
├─ docker/
├─ .env.example
├─ docker-compose.yml
├─ package.json
├─ pnpm-workspace.yaml
└─ AGENTS.md
```

Preferred package manager: `pnpm`.

---

## 4. Architecture rules

### 4.1 Modular monolith

Do NOT create microservices in MVP.

Backend modules should be isolated by domain:

```text
auth
tenants
branches
users
customers
pets
services
appointments
grooming
pos
inventory
notifications
line
marketing
reports
subscriptions
audit
```

Each module should have clear boundaries:

```text
module/
├─ controller
├─ service
├─ repository
├─ dto
├─ schemas
└─ tests
```

### 4.2 Tenant isolation

Every business-owned record must have `tenantId`.

The authenticated request resolves:

```text
user -> tenant -> branch
```

Never trust `tenantId` from the client.

Tenant is derived from authenticated context.

Every query must be scoped to the current tenant unless explicitly operating in SaaS admin context.

### 4.3 Branch isolation

A user may access one or more branches according to role/permissions.

Branch-scoped entities must verify:

```text
record.tenantId === currentTenant.id
record.branchId in currentUser.allowedBranches
```

### 4.4 API

REST only for MVP.

Base path:

```text
/api/v1
```

Examples:

```text
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id

GET    /api/v1/pets
POST   /api/v1/pets

GET    /api/v1/appointments
POST   /api/v1/appointments
PATCH  /api/v1/appointments/:id

GET    /api/v1/grooming/queue
POST   /api/v1/grooming/queue
PATCH  /api/v1/grooming/queue/:id/status
```

Swagger must be generated from backend decorators/schema definitions.

---

## 5. Coding standards

- TypeScript strict mode
- Avoid `any`
- Prefer small pure functions
- Validate every external input
- Never duplicate business rules between frontend and backend
- Backend is source of truth for authorization and business rules
- Use UTC internally where practical; display in `Asia/Bangkok`
- Store money as integer minor units (e.g. satang) or decimal with consistent rules; do not use floating point for financial calculations
- Use database transactions for multi-record financial/stock operations
- Use idempotency where repeated webhook/payment processing is possible

Naming:

- DB: camelCase in Prisma model fields, PostgreSQL mapping may use snake_case if desired
- API JSON: camelCase
- React components: PascalCase
- files: kebab-case unless framework convention requires otherwise

---

## 6. UI rules

The UI is Thai-first.

Primary goals:

- Fast for receptionists
- Fast for groomers
- Clear for veterinarians
- Simple for business owners

Responsive requirements:

- Desktop-first for owner dashboard
- Mobile-first for queue / staff operations
- Use Tailwind consistently
- Use shadcn/ui for standard controls
- Avoid large dense ERP-like forms when a stepper / drawer / modal is simpler

Every page needs:

- Loading state
- Empty state
- Error state
- Permission denied state where relevant

---

## 7. Business rules

### Customer / Pet

- A customer can own multiple pets
- A pet belongs to exactly one primary customer
- Pet history must be append-friendly
- Important notes must remain visible in operational screens
- Never overwrite clinical history silently

### Appointment

Statuses:

```text
PENDING
CONFIRMED
CHECKED_IN
IN_PROGRESS
COMPLETED
CANCELLED
NO_SHOW
```

Booking engine must check:

- branch hours
- staff availability
- service duration
- blocked time
- existing appointments
- configured buffers

Do not allow overlapping bookings unless explicitly configured.

### Grooming

Queue statuses:

```text
WAITING
BATHING
DRYING
GROOMING
FINISHING
READY
PICKED_UP
CANCELLED
```

Every queue item must support:

- expected duration
- assigned groomer
- special care notes
- status timestamps

### POS

Invoice statuses:

```text
DRAFT
UNPAID
PARTIALLY_PAID
PAID
VOID
```

Payment must be recorded separately from invoice.

Never mutate a paid invoice directly; use adjustment/void workflows.

### Inventory

Stock changes must create immutable inventory transactions.

Never update only a "current stock" field without a transaction.

### Notifications

Notification delivery must be asynchronous.

Use BullMQ for:

- appointment reminders
- grooming reminders
- vaccine reminders
- follow-up messages
- campaigns

Webhook handlers must be idempotent.

---

## 8. Security

Required:

- Argon2 password hashing
- JWT rotation / refresh-token strategy
- Rate limiting on auth endpoints
- RBAC checks server-side
- Tenant isolation tests
- Input validation
- File upload validation
- Secure HTTP headers
- Audit log for sensitive actions
- No secrets in source code
- `.env` never committed

PDPA-ready design:

- service consent
- marketing consent
- data export
- deletion request workflow
- audit trail

Do not build legal conclusions into code. Make privacy settings configurable.

---

## 9. Testing requirements

Minimum required:

- Unit tests for core domain logic
- API integration tests
- Authorization tests
- Tenant isolation tests
- Booking conflict tests
- Invoice calculation tests
- Inventory transaction tests
- Notification idempotency tests

Critical security test:

> Tenant A must never read/write Tenant B data, even if Tenant B IDs are supplied directly to the API.

---

## 10. Definition of done for every task

A task is DONE only when:

1. Code implemented
2. DB migration updated if needed
3. API validated
4. Frontend state handled
5. Authorization checked
6. Tests added
7. Lint/typecheck pass
8. Relevant tests pass
9. Documentation updated if behavior changed
10. No unrelated scope was added

At the end of every task, report:

```text
TASK
STATUS
FILES CHANGED
DB CHANGES
API CHANGES
UI CHANGES
TESTS
COMMANDS RUN
REMAINING RISKS
```

---

## 11. Antigravity execution protocol

Process only ONE task from `docs/TASKS.md` at a time.

Before coding:

1. Read AGENTS.md
2. Read the task
3. Read the relevant implementation-plan section
4. Inspect existing code
5. State the intended file/module changes internally
6. Implement only the requested task

After coding:

1. Run format/lint
2. Run typecheck
3. Run relevant tests
4. Fix failures caused by the task
5. Update task status
6. Produce the task completion report

NEVER jump ahead to future tasks.

If a future dependency is missing, implement the smallest prerequisite necessary and record it as a dependency rather than expanding scope.

---

## 12. Commands

Expected commands:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm prisma:migrate
pnpm prisma:seed
```

Use repository scripts if they differ.

---

## 13. Git discipline

Prefer small commits per task.

Commit message format:

```text
feat(scope): implement TASK-ID
fix(scope): resolve TASK-ID
test(scope): add coverage for TASK-ID
refactor(scope): refactor TASK-ID
```

Do not rewrite unrelated history.

Do not commit secrets, `.env`, local database files, or generated credentials.
