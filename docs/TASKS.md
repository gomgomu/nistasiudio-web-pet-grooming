# PetFlow — Antigravity Task List

## How to use

Antigravity MUST execute exactly one TASK at a time.

Workflow:

```text
Pick next TODO
→ read dependencies
→ implement
→ test
→ typecheck/lint
→ mark DONE
→ stop
```

Do not implement future tasks in the same run.

---

## Phase 0 — Foundation

### PF-001 — Initialize monorepo
Status: DONE
Depends on: none

Create:

```text
apps/web
apps/api
packages/ui
packages/types
packages/config
```

Requirements:

- pnpm workspace
- TypeScript
- Next.js App Router
- NestJS
- Tailwind
- shared eslint/tsconfig
- root scripts

Acceptance:

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`

all pass.

---

### PF-002 — Docker local infrastructure
Status: DONE
Depends on: PF-001

Create Docker Compose for:

- PostgreSQL
- Redis

Acceptance:

```text
docker compose up -d
```

works from clean environment.

---

### PF-003 — Prisma setup
Status: DONE
Depends on: PF-002

Create:

- Prisma config
- schema location
- migration commands
- database health check

Acceptance:

API can connect to PostgreSQL.

---

### PF-004 — NestJS base architecture
Status: DONE
Depends on: PF-001

Create:

- ConfigModule
- global validation
- exception filter
- request logging
- `/api/v1/health`

---

### PF-005 — Next.js base UI
Status: DONE
Depends on: PF-001

Create:

- app shell
- Tailwind setup
- shadcn/ui setup
- layout
- sidebar
- top bar
- loading/error/not-found pages

---

## Phase 1 — Identity + tenant

### PF-006 — Tenant schema
Status: DONE
Depends on: PF-003

Create Tenant and Branch Prisma models.

---

### PF-007 — User / Role schema
Status: DONE
Depends on: PF-006

Create:

- User
- Role
- Permission
- UserBranch

---

### PF-008 — Authentication
Status: DONE
Depends on: PF-007

Implement:

- login
- refresh
- logout
- current user
- password hashing

---

### PF-009 — Tenant context middleware
Status: DONE
Depends on: PF-008

Implement authenticated tenant context.

Must reject cross-tenant access.

---

### PF-010 — RBAC guard
Status: DONE
Depends on: PF-009

Implement permission checks.

Acceptance:

A receptionist cannot access owner-only settings.

---

### PF-011 — Tenant isolation tests
Status: DONE
Depends on: PF-009

Create automated tests proving:

Tenant A cannot:

- read Tenant B customers
- update Tenant B pets
- access Tenant B invoices
- access Tenant B appointments

---

## Phase 2 — Customer + Pet

### PF-012 — Customer schema/API
Status: DONE
Depends on: PF-011

Implement CRUD.

---

### PF-013 — Customer UI
Status: DONE
Depends on: PF-012

Pages:

```text
/customers
/customers/new
/customers/[id]
```

---

### PF-014 — Pet schema/API
Status: DONE
Depends on: PF-012

Implement:

- CRUD
- customer relation
- species/breed
- notes
- allergies
- behavior warnings

---

### PF-015 — Pet UI
Status: DONE
Depends on: PF-014

Pages:

```text
/pets/[id]
```

Include:

- profile
- owner
- warning area
- history placeholder

---

### PF-016 — Pet timeline
Status: DONE
Depends on: PF-015

Create unified timeline API and UI.

---

### PF-017 — Customer/Pet search
Status: DONE
Depends on: PF-013, PF-015

Implement fast search by:

- phone
- customer name
- pet name
- microchip

---

### PF-018 — CSV import
Status: DONE
Depends on: PF-012, PF-014

Import:

- customers
- pets

Must validate rows and show import errors.

---

## Phase 3 — Services + staff

### PF-019 — Service schema/API
Status: DONE
Depends on: PF-011

Implement:

- service
- category
- duration
- price
- active state

---

### PF-020 — Staff profile schema/API
Status: DONE
Depends on: PF-010

Implement staff profile and staff type.

---

### PF-021 — Working hours
Status: DONE
Depends on: PF-020

Implement:

- weekly schedule
- break
- leave
- blocked time

---

### PF-022 — Grooming pricing rules
Status: DONE
Depends on: PF-019

Support price rules by:

- species
- weight range
- service

---

## Phase 4 — Appointment

### PF-023 — Appointment schema
Status: DONE
Depends on: PF-019, PF-020

---

### PF-024 — Booking conflict engine
Status: DONE
Depends on: PF-021, PF-023

Implement conflict detection for:

- staff
- branch
- time
- blocked slots

Add unit tests.

---

### PF-025 — Appointment API
Status: DONE
Depends on: PF-024

CRUD + status transitions.

---

### PF-026 — Calendar UI
Status: DONE
Depends on: PF-025

Create:

- day view
- week view
- filters
- drag/reschedule only if safe

---

### PF-027 — Appointment detail drawer
Status: DONE
Depends on: PF-026

Show:

- customer
- pet
- service
- staff
- notes
- history
- status

---

## Phase 5 — Grooming Queue

### PF-028 — Grooming profile
Status: DONE
Depends on: PF-015

Store:

- preferred cut
- shampoo
- warnings
- behavior notes

---

### PF-029 — Grooming queue schema
Status: DONE
Depends on: PF-025

---

### PF-030 — Queue API
Status: DONE
Depends on: PF-029

Implement:

- check-in
- create queue item
- status transitions
- assign groomer

---

### PF-031 — Grooming board UI
Status: DONE
Depends on: PF-030

Kanban:

```text
Waiting
Bathing
Drying
Grooming
Finishing
Ready
Picked Up
```

---

### PF-032 — Queue alerts
Status: DONE
Depends on: PF-031

Highlight:

- overdue
- special warning
- aggressive behavior
- medical warning
- delayed pickup

---

## Phase 6 — POS

### PF-033 — Invoice schema
Status: DONE
Depends on: PF-025

---

### PF-034 — Invoice calculation engine
Status: DONE
Depends on: PF-033

Test:

- subtotal
- discount
- tax
- total
- rounding

---

### PF-035 — Invoice API
Status: DONE
Depends on: PF-034

---

### PF-036 — Payment API
Status: DONE
Depends on: PF-035

Methods:

- cash
- transfer
- promptpay
- card

---

### PF-037 — POS UI
Status: DONE
Depends on: PF-035, PF-036

---

### PF-038 — Receipt
Status: DONE
Depends on: PF-036

Create printable receipt.

---

## Phase 7 — Inventory

### PF-039 — Product schema/API
Status: DONE
Depends on: PF-011

---

### PF-040 — Inventory transaction engine
Status: DONE
Depends on: PF-039

Must use immutable transactions.

---

### PF-041 — Inventory UI
Status: DONE
Depends on: PF-040

---

### PF-042 — Low-stock + expiry
Status: DONE
Depends on: PF-040

---

### PF-043 — Inventory cost calculation
Status: DONE
Depends on: PF-040

Use consistent costing rule and document it.

---

## Phase 8 — Notifications + LINE

### PF-044 — Notification domain
Status: DONE
Depends on: PF-025

Create:

- notification
- template
- preferences

---

### PF-045 — BullMQ worker
Status: DONE
Depends on: PF-044

Queues:

```text
notification
reminder
campaign
```

---

### PF-046 — Email adapter
Status: DONE
Depends on: PF-045

Use provider abstraction.

---

### PF-047 — LINE adapter
Status: DONE
Depends on: PF-045

Implement:

- push message
- webhook signature validation
- inbound message logging

---

### PF-048 — Appointment reminder
Status: DONE
Depends on: PF-047

24h and 2h before appointment.

---

### PF-049 — Grooming ready notification
Status: DONE
Depends on: PF-047, PF-031

Send when queue status becomes READY.

Must be idempotent.

---

## Phase 9 — Retention

### PF-050 — Customer segmentation
Status: DONE
Depends on: PF-035

Create segments:

- new
- active
- at-risk
- lost
- VIP

---

### PF-051 — Grooming due detector
Status: DONE
Depends on: PF-050

Create configurable due rules.

---

### PF-052 — Vaccine due detector
Status: DONE
Depends on: PF-050

Prepare for veterinary module.

---

### PF-053 — Win-back campaign
Status: DONE
Depends on: PF-047, PF-050

---

### PF-054 — No-show report
Status: DONE
Depends on: PF-025

Calculate lost revenue.

---

## Phase 10 — Dashboard

### PF-055 — Owner dashboard API
Status: DONE
Depends on: PF-036, PF-040, PF-050

Metrics:

- revenue
- appointments
- no-show
- average ticket
- repeat revenue
- inactive customers

---

### PF-056 — Owner dashboard UI
Status: DONE
Depends on: PF-055

---

### PF-057 — Revenue recovery dashboard
Status: DONE
Depends on: PF-055

Show:

- no-show lost revenue
- inactive customer opportunity
- grooming due opportunity

---

## Phase 11 — Veterinary core

### PF-058 — Clinic visit schema
Status: DONE
Depends on: PF-014

---

### PF-059 — SOAP note API
Status: DONE
Depends on: PF-058

---

### PF-060 — SOAP UI
Status: DONE
Depends on: PF-059

---

### PF-061 — Prescription
Status: DONE
Depends on: PF-059

---

### PF-062 — Vaccination
Status: DONE
Depends on: PF-059

---

### PF-063 — Follow-up reminders
Status: DONE
Depends on: PF-062, PF-045

---

## Phase 12 — SaaS admin/billing

### PF-064 — Subscription plan schema
Status: DONE
Depends on: PF-011

---

### PF-065 — Feature flags
Status: DONE
Depends on: PF-064

---

### PF-066 — SaaS admin console
Status: DONE
Depends on: PF-064

---

### PF-067 — Usage metering
Status: DONE
Depends on: PF-064

---

## Phase 13 — Production hardening

### PF-068 — E2E critical flows
Status: DONE
Depends on: PF-057

Flows:

```text
Login
Create customer
Create pet
Book grooming
Check in
Run queue
Invoice
Pay
Send reminder
```

---

### PF-069 — Security review
Status: DONE
Depends on: PF-068

Review:

- auth
- RBAC
- tenant isolation
- file uploads
- rate limits
- webhooks
- secrets

---

### PF-070 — Backup + recovery
Status: DONE
Depends on: PF-069

---

### PF-071 — Observability
Status: DONE
Depends on: PF-069

Add:

- structured logs
- request IDs
- error tracking hooks
- job metrics

---

### PF-072 — Production deployment
Status: DONE
Depends on: PF-070, PF-071

Create:

- production Docker setup
- environment checklist
- migration process
- rollback plan
- deployment docs

---

# Antigravity task execution format

For each task, use:

```text
TASK: PF-XXX
TITLE: ...

GOAL:
...

FILES TO CHANGE:
...

DEPENDENCIES:
...

ACCEPTANCE CRITERIA:
...

TESTS:
...

STOP CONDITION:
Do not implement the next task.
```

After completion:

```text
TASK: PF-XXX
STATUS: DONE

FILES CHANGED:
...

DB CHANGES:
...

API CHANGES:
...

UI CHANGES:
...

TESTS:
...

COMMANDS:
...

RISKS:
...
```

# Priority for first usable MVP

The smallest valuable release is:

```text
PF-001
PF-002
PF-003
PF-004
PF-005
PF-006
PF-007
PF-008
PF-009
PF-010
PF-011
PF-012
PF-013
PF-014
PF-015
PF-016
PF-019
PF-020
PF-021
PF-023
PF-024
PF-025
PF-026
PF-028
PF-029
PF-030
PF-031
PF-033
PF-034
PF-035
PF-036
PF-037
```

This gives a sellable core:

```text
CRM
+
Booking
+
Grooming Queue
+
POS
```

Then continue with:

```text
Inventory
→ LINE
→ Retention
→ Dashboard
→ Veterinary
```
