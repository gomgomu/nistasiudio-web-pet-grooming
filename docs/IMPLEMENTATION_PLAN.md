# PetFlow — Implementation Plan

## 0. Product strategy

Build a Thai-first Pet Business OS using:

- Next.js
- Node.js / NestJS
- Tailwind CSS
- PostgreSQL / Prisma
- Redis / BullMQ
- LINE-ready notification architecture

Initial wedge:

> Grooming + CRM + Booking + Queue + POS

Then add:

> Inventory + LINE automation + Retention

Then:

> Veterinary workflows

The MVP must prove three outcomes:

1. Less admin work
2. Fewer missed appointments
3. More repeat revenue

---

# Phase 0 — Foundation

## Outcome

A runnable monorepo with web + API + database + local infrastructure.

### Scope

- pnpm workspace
- Next.js app
- NestJS API
- shared packages
- PostgreSQL
- Redis
- Docker Compose
- environment config
- lint/typecheck/test setup
- health endpoints

### Exit criteria

```text
/web boots
/api boots
PostgreSQL connects
Redis connects
/api/health returns OK
```

---

# Phase 1 — Identity + Multi-tenancy

## Outcome

Secure SaaS foundation.

### Scope

- Tenant
- Branch
- User
- Roles
- Permissions
- Login
- Refresh token
- Current-user endpoint
- tenant context
- branch access

### Exit criteria

- Owner can create tenant
- User can authenticate
- API derives tenant from auth
- Tenant isolation tests pass

---

# Phase 2 — Customer + Pet CRM

## Outcome

Single source of truth for customers and pets.

### Scope

- Customer CRUD
- Pet CRUD
- Pet photo
- tags
- notes
- customer profile
- pet profile
- pet timeline shell
- search/filter
- import CSV

### Exit criteria

Reception can create customer + multiple pets and immediately search them.

---

# Phase 3 — Services + Staff + Availability

## Outcome

Booking engine has real configuration.

### Scope

- services
- service categories
- service duration
- pricing rules
- staff
- staff working hours
- branch hours
- blocked time

### Exit criteria

Admin can configure a grooming service and staff availability.

---

# Phase 4 — Appointment + Calendar

## Outcome

Reliable appointment scheduling.

### Scope

- create appointment
- reschedule
- cancel
- status transitions
- day/week calendar
- booking conflict detection
- appointment details
- customer/pet lookup
- staff assignment

### Exit criteria

No accidental overlapping bookings.

---

# Phase 5 — Grooming Queue

## Outcome

Operations screen for grooming staff.

### Scope

- check-in
- queue board
- status transitions
- groomer assignment
- expected finish time
- special-care warnings
- ready-for-pickup
- queue history

### Exit criteria

A booking can move from arrival to pickup without paper.

---

# Phase 6 — POS

## Outcome

Turn completed services into revenue.

### Scope

- cart
- service/product items
- discounts
- tax configuration
- invoice
- payment
- receipt
- refund/void workflow

### Exit criteria

Completed grooming can be invoiced and paid.

---

# Phase 7 — Inventory

## Outcome

Track stock and cost.

### Scope

- products
- categories
- suppliers
- stock-in
- stock-out
- consumption
- adjustment
- transfer
- low-stock
- expiry
- inventory ledger

### Exit criteria

Every stock movement is traceable.

---

# Phase 8 — Notifications + LINE-ready architecture

## Outcome

Automate customer communication.

### Scope

- notification templates
- notification preferences
- BullMQ
- email adapter
- LINE adapter
- webhook architecture
- appointment reminder
- queue ready notification
- payment confirmation

### Exit criteria

Notifications are queued, retried, logged, and idempotent.

---

# Phase 9 — Retention Engine

## Outcome

Generate repeat revenue.

### Scope

Segments:

- new
- active
- at-risk
- lost
- VIP

Triggers:

- grooming due
- vaccine due
- inactive
- no-show
- follow-up due
- birthday

Campaign:

- audience
- message
- schedule
- status
- results

### Exit criteria

Owner can identify inactive customers and trigger a campaign.

---

# Phase 10 — Owner Dashboard + Reports

## Outcome

Owner sees business performance.

### Scope

- revenue
- appointments
- no-show
- average ticket
- customer retention
- repeat revenue
- service ranking
- groomer performance
- inventory cost
- basic gross profit

### Exit criteria

Owner can answer:

- How much did we sell?
- How many appointments?
- How many no-shows?
- What services sell?
- Which customers are inactive?
- What revenue might be recovered?

---

# Phase 11 — Veterinary Core

Only after the grooming workflow is stable.

### Scope

- visit
- SOAP
- vitals
- diagnosis
- treatment
- prescription
- vaccination
- follow-up
- attachments

### Important

Do NOT add AI diagnosis in MVP.

AI may later summarize notes or create drafts, but clinical decisions remain with veterinarians.

---

# Phase 12 — SaaS Billing + Admin

### Scope

- plans
- feature flags
- subscriptions
- usage
- MRR
- churn
- tenant admin
- storage limits
- billing integration abstraction

---

# Phase 13 — Production hardening

### Scope

- backups
- observability
- structured logs
- error tracking
- rate limits
- security review
- tenant isolation audit
- performance baseline
- E2E tests
- deployment

---

# Recommended delivery order

```text
Foundation
→ Auth/Tenant
→ Customer/Pet
→ Services/Staff
→ Appointment
→ Grooming Queue
→ POS
→ Inventory
→ Notifications
→ Retention
→ Dashboard
→ Veterinary
→ Billing
→ Hardening
```

---

# Architecture principles

1. Modular monolith first
2. Tenant isolation everywhere
3. Backend owns business rules
4. Immutable financial/stock history
5. Async notifications
6. Thai-first UX
7. Mobile workflow for staff
8. Import/export from day one
9. Avoid premature AI
10. Ship measurable business value each phase
