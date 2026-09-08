# PetFlow — ตรวจความพร้อมทุกหน้าและบทบาท

วันที่ 8 กันยายน 2026 | ขอบเขต: source audit ระบบปัจจุบัน ไม่ใช่ diff review และไม่แก้ application code

## ข้อสรุป

ยังไม่พร้อมยืนยันการใช้งานจริงครบทุก role ระบบมีโครงสร้าง domain/backend และหน้าจอที่กว้าง แต่หลายหน้าจอยังเป็น demo ข้อมูลไม่ส่งถึงกัน และมีช่องโหว่ authorization/tenant isolation ที่ต้องปิดก่อนใช้ข้อมูลจริง

ตรวจ inventory ของ page.tsx ทั้ง 34 routes, shared auth/shell/booking, Next.js API ทั้ง 7 route files และตาม NestJS service/controller ของ workflow สำคัญ ไม่ได้กดทุกปุ่มด้วย browser หรือทดสอบด้วย PostgreSQL จริง จึงไม่ใช่ใบรับรองว่าพบบัคทั้งหมด รายการด้านล่างแยกหลักฐานจากโค้ดออกจากความเสี่ยงที่ต้องทดสอบ concurrency

## ข้อค้นพบเรียงความสำคัญ

### 1. Critical — Next.js API ไม่มี authentication และ tenant isolation ล้มเหลว

- `apps/web/app/api/customers/route.ts:4`, `pets/route.ts:4`, `appointments/route.ts:4`, `grooming/route.ts:4`: รับ tenantSlug จาก request; ถ้าหา tenant ไม่พบใช้ `where: {}` อ่านทุก tenant
- `apps/web/app/api/staff/route.ts:157`, `branches/route.ts`, `tenants/route.ts`: mutation อ้าง ID โดยไม่ตรวจ authenticated role/tenant
- ไม่พบ Next middleware ที่บังคับ auth; AppShell เป็น client component ไม่ป้องกัน route handler; Nest guards ไม่ครอบคลุม Next routes
- ผล: ผู้ไม่ล็อกอินสามารถเรียก handler อ่านข้อมูลหรือเปลี่ยนข้อมูลได้เมื่อเว็บเชื่อม DB; ไม่ได้ยิงแก้ข้อมูลจริงในการตรวจนี้
- แก้: ใช้ authenticated backend เส้นเดียว หรือ BFF ที่ตรวจ session และส่งต่อ NestJS; fail closed เมื่อไม่พบ tenant และห้ามรับ tenant identity จาก client สำหรับงานธุรกิจ

### 2. Critical — เจ้าของร้านเข้าศูนย์ SaaS ข้ามร้านได้

- `apps/api/src/saas-admin/saas-admin.controller.ts:24` อนุญาต TENANT_OWNER และ TENANT_ADMIN
- service อ่าน platform-wide และ PATCH `tenants/:id/status` ไม่มี current tenant scope
- ผล: เจ้าของร้าน A มีสิทธิ์ตามโค้ดอ่านร้านอื่นและสั่งเปลี่ยนสถานะร้าน B
- แก้: จำกัด SUPER_ADMIN สำหรับ platform API; tenant owner ใช้ endpoint ของร้านตนเอง

### 3. Critical — Login ไม่ตรวจรหัสผ่าน และบัญชีพนักงานใหม่กลายเป็น owner

- `apps/web/app/login/page.tsx:95`: เทียบ email กับ demo presets; email อื่นถูกสร้างเป็น TENANT_OWNER โดยตรง ไม่เรียก auth API
- `apps/web/contexts/auth-context.tsx:96`: เชื่อ localStorage เป็นตัวตน; role แก้ได้ฝั่ง browser
- ผล: บัญชีพนักงาน/หมอที่เพิ่มใหม่ไม่ถูกโหลด role จริง; บัญชีถูก suspend ยังใช้ demo login ได้
- แก้: ใช้ login/refresh/me/logout จริงและ server session; demo ต้องแยก environment และข้อมูล

### 4. High — Clinical และการเงินไม่ได้บังคับสิทธิ์ราย action

- `apps/api/src/common/guards/roles.guard.ts:26` ไม่มี @Roles แล้วอนุญาต
- `apps/api/src/clinical/soap-notes.controller.ts:28` ใส่ RolesGuard แต่ไม่ใส่ @Roles; service ไม่ตรวจผู้ใช้เป็นหมอ
- `apps/api/src/pos/payments.controller.ts:28` ใช้ JwtAuthGuard อย่างเดียว รวม DELETE payment
- `apps/web/components/layout/app-shell.tsx:30` ตรวจแค่มี user; การซ่อน sidebar ไม่ป้องกัน direct URL
- ผล: authenticated staff/groomer แก้ SOAP หรือ reverse payment ผ่าน API ได้ตาม branch/tenant ที่ service ยอมรับ
- แก้: permission ต่อ action เช่น clinical.write, payment.record, payment.reverse; owner ไม่ควรได้ clinical write อัตโนมัติถ้าไม่ได้รับหน้าที่นั้น

### 5. High — สาขาไม่ถูกจำกัดครบ

- appointments controller ส่งเพียง tenantId ไม่ส่ง allowedBranches; service findAll/findById/update ตรวจ tenant แต่ไม่ตรวจ branch membership
- `apps/api/src/pos/payments.service.ts:175` ใช้ query.branchId แทน allowedBranches โดยไม่ตรวจสมาชิก
- list ว่างถูกใช้ทั้งหมายถึง admin ทุกสาขาและพนักงานไม่มีสาขา (`payments.controller.ts:33`, `payments.service.ts:30`)
- ผล: พนักงานสาขา A อ่าน payment สาขา B ใน tenant เดียวกันด้วย query หรืออ่าน/แก้นัดต่างสาขาได้
- แก้: แยก unrestricted scope ออกจาก empty scope; intersect requested branch กับสิทธิ์ปัจจุบันทุกครั้ง

### 6. High — CRM, นัดหมาย และคิวไม่บันทึก workflow จริง

- `customers/new/page.tsx:55` รอ timer แล้ว redirect ไม่มี create; `customers/import/page.tsx:140` แสดงจำนวนสำเร็จจากการนับ array
- `components/appointments/new-appointment-modal.tsx:361` dispatch browser event ไม่มี API; refresh/เปลี่ยนหน้าไม่ใช่ persistence
- `grooming/queue/page.tsx:461` เปลี่ยนเฉพาะ state; check-in สร้าง ID ใน browser
- ผล: เจ้าหน้าที่อีกเครื่องไม่เห็นงานเดียวกัน; ลูกค้าใหม่/คิว/นัดที่แจ้งสำเร็จไม่เป็นข้อมูลกลาง

### 7. High — Visit ใหม่ไม่ต่อกับรายการตรวจ และ SOAP ไม่บันทึกจริง

- `clinical/visits/new/page.tsx:175` เขียน localStorage แต่ `clinical/page.tsx:190` อ่าน MOCK_VISITS
- `clinical/visits/[id]/soap/page.tsx:169` ใช้ MOCK_SOAP_DATA; `:202` timer แล้ว setData/history พร้อมผู้เขียน hardcoded
- ผล: หมอเปิด visit ใหม่แล้วไม่ได้ข้อมูลผู้ป่วยจาก server; บันทึกสำเร็จแต่ refresh แล้วหาย; ประวัติผู้เขียนไม่ใช่ผู้ใช้จริง
- แก้: query ตาม visitId จริง, mutation + server audit, refresh/cache invalidation และส่งรายการรักษาเข้า invoice ด้วย ID เดียวกัน

### 8. High — POS แจ้งรับเงินสำเร็จโดยไม่มี invoice/payment จริง

- `pos/page.tsx:561` สุ่ม invoiceNo และ setIsPaymentSuccess ไม่มี API
- `pos/page.tsx:482` ตัด localStorage stock โดยจับคู่ชื่อบางส่วน แล้ว clamp เหลือ 0 ไม่มี inventory transaction; inventory page ตั้งต้น INITIAL_INVENTORY_ITEMS
- receipt route `pos/receipt/[id]/page.tsx:21` สร้างข้อมูลตัวอย่างเอง
- ผล: ใบเสร็จ/สต็อก/รายงานไม่ reconcile; ขายเกินสต็อกหรือหักสินค้าชื่อคล้ายกันได้
- แก้: authoritative invoice/payment/stock transaction และ receipt โหลดจากบิลจริง; ไม่แจ้งสำเร็จก่อน server commit

### 9. High — SOAP backend อาจแก้ข้อมูลแล้วไม่มี audit snapshot

- `apps/api/src/clinical/soap-notes.service.ts:121` update pet, update visit แล้วสร้าง medical record แยกคำสั่ง ไม่อยู่ใน transaction เดียวกัน
- ไม่ตรวจ locked/completed lifecycle ก่อนแก้; dto.status เปลี่ยนสถานะได้
- ผล: หากบันทึก snapshot ล้มเหลว เวชระเบียนถูกเปลี่ยนไปแล้วแต่ประวัติไม่ครบ; ต้องมี finalize/addendum permissions

### 10. High — Payment race และการ reverse ลบประวัติ

- `apps/api/src/pos/payments.service.ts:25` อ่าน invoice ก่อน transaction; `:102` บวกยอดจาก snapshot เดิม แล้วเขียนค่า absolute
- ความเสี่ยง concurrency จากโค้ด: สองคำขอชำระบางส่วนพร้อมกันอาจสร้าง 2 payment แต่ paidAmount เหลือยอดของคำขอเดียว ไม่มี conditional update/lock ที่เห็นในเส้นทางนี้ ต้องยืนยันด้วย DB concurrency test
- `:263` reverse ใช้ payment.delete จึงเสีย payment เดิมแทนบันทึกรายการย้อนกลับ; การ reverse พร้อมกันมีความเสี่ยง snapshot เช่นเดียวกัน
- แก้: lock/version + idempotency, append reversal พร้อมผู้กระทำ/เหตุผลและยอดอ้างอิง

### 11. High — Booking validation ถูกข้ามและ state transition ไม่ครบ

- Next `api/appointments/route.ts:112` create โดยตรง ไม่ตรวจ conflict/schedule และ fallback ลูกค้า/สัตว์/ช่างเป็นรายการแรก
- Nest `appointments.service.ts:132` ตรวจ conflict แล้ว create แยก ไม่มี atomic exclusion/lock ในเส้นทางนี้; simultaneous booking ต้องทดสอบจริง
- `appointments.service.ts:381` updateStatus ใส่สถานะใหม่ตรง ๆ ไม่มี transition map เช่น COMPLETED -> PENDING ยังไปต่อได้
- Next `api/grooming/route.ts:70` update เฉพาะ status ข้าม timestamp, transition และ notification domain
- แก้: domain service เดียว, valid transitions และ atomic booking reservation

### 12. High — สร้างบัญชีด้วย hash คงที่ที่ตัว login ไม่รองรับ

- Next `api/staff/route.ts:108` และ `api/tenants/route.ts:108` ใส่ literal Argon2-looking hash ไม่ได้ hash password ที่ผู้ใช้กรอก
- `apps/api/src/users/users.service.ts:45` ใช้ bcrypt.compare
- ผล: เมื่อต่อ auth จริง บัญชีที่สร้างจาก UI เส้นทางนี้จะไม่ตรวจรหัสผ่านตามที่แสดงให้ผู้ใช้ได้
- แก้: ให้ UsersService สร้างบัญชี ใช้ hashing strategy ที่สอดคล้องกัน และไม่ส่ง success ก่อนสร้างสำเร็จ

### 13. Medium — Receptionist ไม่มีทางใช้งานตามบทบาท

- auth type มี RECEPTIONIST แต่ PRESET_USERS/หน้า login ไม่มี receptionist; sidebar ทุก nav item ไม่รวม receptionist (`sidebar.tsx:44`)
- STAFF/TENANT_ADMIN/BRANCH_MANAGER/SUPER_ADMIN ใน backend ไม่ตรง union ฝั่งเว็บ (เว็บใช้ SAAS_ADMIN)
- ผล: role หน้าเคาน์เตอร์ไม่สามารถเข้าถึง CRM, booking, check-in, POS ตามเมนู; การเพิ่ม staff ไม่แก้ปัญหา login owner fallback

### 14. Medium — วันที่และจำนวนเงินบางจุดไม่ตรงกัน

- booking modal `:336` ต่อเวลาไทยด้วย Z เช่น 09:00 ไทยถูกระบุเป็น 09:00 UTC = 16:00 ไทย
- POS `:382` หัก item discount ต่อ quantity แต่ receipt `:595` หัก discount ครั้งเดียว: quantity 2, unit 100 บาท, discount 10 บาทต่อชิ้น -> cart 180 บาท แต่ receipt line 190 บาท
- POS tax ใช้ 7% ทั้งบิลแม้รายการมี taxRate; ต้องใช้กติกาภาษีจาก configuration/backend ไม่ใช่สรุปข้อกฎหมาย

### 15. Medium — Settings เชื่อมไปหน้าที่ไม่มี และรายงานยังเป็น mock

- `settings/page.tsx:58` /services และ `:65` /notifications ไม่มี page route จึงไม่สามารถตั้งบริการ/ข้อความจากลิงก์นี้
- owner metrics, retention, no-show, revenue-recovery, commission, subscription, usage, flags เป็น constants/state
- ผล: เจ้าของยังใช้ตัวเลขตัดสินยอดจริงไม่ได้; การต่ออายุ/เติมเครดิต/เปิด flag ในหน้าจอไม่ยืนยันผล backend

## Coverage หน้าจอทั้ง 34 routes

M = mock/state, L = localStorage, D = เรียก Next API บางส่วนแต่มี auth/scope issues ข้างต้น, N = navigation
สถานะนี้คือเส้นทางข้อมูลที่ตรวจพบ ไม่ใช่เปอร์เซ็นต์ความสำเร็จของ UI tests

| Route | สถานะที่พบ | ผลต่อการใช้งาน |
| --- | --- | --- |
| /login | M | ไม่ตรวจ password/role จริง |
| / | M | dashboard ตัวอย่าง |
| /dashboard/owner | M | metrics ตัวอย่าง |
| /appointments | M | calendar + browser event ไม่ persisted |
| /grooming | N | redirect ไป queue |
| /grooming/queue | M | เปลี่ยนสถานะ/check-in ใน state; LINE preview |
| /customers | M | ค้นจาก INITIAL_CUSTOMERS |
| /customers/new | M | timer แล้วกลับรายการ |
| /customers/import | M | parse CSV แต่ import ไม่เขียน DB |
| /customers/[id] | M | customer object ตัวอย่าง |
| /pets/[id] | M | pet/timeline object ตัวอย่าง |
| /clinical | M | MOCK_VISITS ไม่โหลด visit ที่สร้างใน storage |
| /clinical/visits/new | L | visit อยู่ใน browser |
| /clinical/visits/[id]/soap | M | mock SOAP/prescriptions; save ผ่าน timer |
| /clinical/vaccinations | M | mock vaccinations |
| /clinical/follow-ups | M | mock follow-ups |
| /pos | M/L | รับเงิน state, หัก stock storage |
| /pos/receipt/[id] | M | receipt data ตัวอย่าง |
| /inventory | M | initial inventory/transaction logs |
| /retention | M | mock segmented customers |
| /retention/grooming-due | M | mock due pets |
| /retention/vaccine-due | M | mock due pets |
| /retention/campaigns | M | mock campaigns/state |
| /reports | N | ลิงก์หน้ารายงาน |
| /reports/no-show | M | mock summary/offenders |
| /reports/revenue-recovery | M | mock opportunities |
| /reports/staff-commission | M | mock staff data; export เป็น alert |
| /settings | N | มีลิงก์ไป /services, /notifications ที่ไม่มีหน้า |
| /settings/staff | D/L | API บางส่วน + optimistic storage; hash/role ผิด |
| /settings/branches | D/L | API บางส่วน + storage fallback; ไม่บังคับ scope |
| /settings/subscription | M | mock subscription และ timer |
| /settings/usage | M | mock usage/topup state |
| /admin | D/M | Next tenants API; audit log ตัวอย่าง |
| /admin/feature-flags | M | flags state; client role gate |

ทุก route ที่อยู่ใต้ AppShell มีเพียง client authentication ร่วมกัน; การมีหน้า loading.tsx/error.tsx ไม่พิสูจน์ loading/empty/API error/403 ของแต่ละ workflow โดยเฉพาะหน้าที่ยังไม่เรียก API

## Role readiness

| Role | ใช้งานจริงครบหรือไม่ | อุปสรรคหลัก |
| --- | --- | --- |
| Receptionist / STAFF | ไม่ครบ | เมนู/role ไม่ตรง, CRM/check-in/POS ไม่เชื่อมข้อมูลจริง |
| Groomer | ไม่ครบ | คิวเฉพาะ browser, assignment/branch enforcement ไม่ครบ |
| Veterinarian | ไม่ครบ | visit/SOAP/prescription ไม่เป็นข้อมูลกลาง, backend clinical permission ไม่ครบ |
| Owner / Tenant admin | ไม่ครบ | reports/settings บางส่วน mock และมีสิทธิ์ข้าม tenant ผ่าน SaaS admin |
| Platform admin | ไม่ครบ | SAAS_ADMIN vs SUPER_ADMIN และ platform API เปิดกว้างเกินไป |

## เทียบคู่แข่งและสิ่งที่ทำมาถูกทิศทาง

PetFlow เลือกหมวดงานมาถูกทิศ: CRM -> booking -> grooming/clinical -> POS -> inventory -> reminders/retention -> owner reports และ backend มี conflict engine, invoice calculator, transaction services, SOAP snapshots และ notification queues อยู่แล้ว ไม่จำเป็นต้องเริ่มออกแบบใหม่ทั้งหมด

ช่องว่างใหญ่คือการเชื่อมใช้งานจริงและสิทธิ์ต่อ action: MoeGo แยกสิทธิ์นัดของตน/ผู้อื่นและการรับเงิน, ezyVet เชื่อมนัด/consult/billing และทรัพยากร, Provet แยก finalized notes/locked notes/financial operations ข้อเสนอนี้เป็นการเทียบ documented workflow ไม่ใช่ benchmark ว่าคู่แข่งไม่มีบัค

ดู [COMPETITOR_WORKFLOW_RESEARCH.md](./COMPETITOR_WORKFLOW_RESEARCH.md) สำหรับ primary sources, role matrix ที่เสนอ และ acceptance scenarios

## ลำดับแก้ที่เสนอ

1. ปิด Next API auth bypass และจำกัด SaaS admin; ต่อ login จริงและกำหนด role/branch contract กลาง
2. ต่อ receptionist -> customer/pet -> appointment -> queue ให้ persisted และข้ามเครื่องได้ พร้อม negative permission tests
3. ต่อ veterinarian -> visit/SOAP/prescription -> cashier invoice -> payment/stock; รักษา audit/atomicity/idempotency
4. ต่อ owner reports, retention/LINE, settings และแยก demo data ออกจาก production
5. รับรองด้วย role × action × branch × tenant tests และ browser end-to-end บน DB ทดสอบจริง รวม refresh, retry และ concurrent requests

ทำทีละ task ตาม AGENTS.md ไม่ควรแก้ทั้งหมดเป็นก้อนเดียว; ไม่มีการเปลี่ยนสถานะ DONE ใน TASKS.md ระหว่าง audit นี้

## การตรวจสอบและข้อจำกัด

- `pnpm typecheck`: ผ่าน
- `pnpm lint`: ผ่าน exit 0, web มี 243 warnings, 0 errors
- `pnpm --filter @petflow/api test -- --runInBand`: ผ่าน 53 suites / 416 tests
- ชุด integration/e2e ใช้ Prisma mock; critical-flows ตั้ง email receptionist แต่ role TENANT_ADMIN และ tenant isolation fixture บางตัวใช้ owner จึงไม่ใช่การทดสอบครบทุก role
- `pnpm --filter @petflow/api test:e2e -- --runInBand`: ผ่าน 4 suites / 50 tests โดยใช้ Prisma mock; มี console error ระหว่าง critical flow ว่าส่ง grooming ready notification ไม่สำเร็จ (queue item not found) แต่ test ยังผ่าน จึงไม่ถือว่ารับรอง delivery จริง
- ไม่ยิง request ที่แก้ข้อมูลธุรกิจจริง ไม่รัน migration ไม่แก้ API/UI และไม่อ้างว่าทดสอบ LINE/payment provider จริง

## Task completion report

| Field | Result |
| --- | --- |
| TASK | ตรวจระบบปัจจุบันทุกหน้า/role และเทียบ documented competitor workflows ตามคำขอ |
| STATUS | Audit เสร็จ; production readiness ไม่ผ่านจากข้อค้นพบข้างต้น |
| FILES CHANGED | เพิ่ม docs/ROLE_WORKFLOW_AUDIT.md และ docs/COMPETITOR_WORKFLOW_RESEARCH.md |
| DB CHANGES | ไม่มี |
| API CHANGES | ไม่มี |
| UI CHANGES | ไม่มี |
| TESTS | Unit 416 ผ่าน; mock-backed integration/e2e 50 ผ่าน; ไม่เพิ่ม tests เพราะเป็น audit |
| COMMANDS RUN | rg inventory/search, Get-Content, git status --short, pnpm typecheck, pnpm lint, pnpm --filter @petflow/api test -- --runInBand, pnpm --filter @petflow/api test:e2e -- --runInBand |
| REMAINING RISKS | ยังไม่ทดสอบ browser ทุกปุ่ม/ทุก role, DB concurrency, external providers; critical authorization และ persistence issues ยังไม่ได้แก้ |
