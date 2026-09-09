# ตรวจซ้ำ role และปุ่มเพิ่มข้อมูล — 9 กันยายน 2026

ฐานโค้ด: fdaa1a8 | งานตรวจสอบตามคำขอ ไม่แก้ application code

## ข้อสรุป

ยังไม่สอดคล้องและยังไม่พร้อมรับรองใช้งานจริงครบ role มี 36 page routes แล้ว แต่สิทธิ์เมนู, ปุ่ม, API, ตัวตนผู้ใช้ และข้อมูลที่บันทึกยังไม่ได้ใช้กติกาเดียวกัน การเพิ่ม fetch ไม่เท่ากับเชื่อม workflow สำเร็จ

ตรวจโค้ดล่าสุดและเรียก handler จริงที่สกัดผ่าน TypeScript AST โดยจำลอง response ใน VM (ไม่เรียก network/DB) ไม่ใช่ browser end-to-end และไม่รับรองทุกปุ่มผ่าน รายงานเดิมวันที่ 8 กันยายนเป็นประวัติ; ใช้รายงานนี้สำหรับสถานะที่ตรวจซ้ำ

## จุดที่แก้แล้วจากรอบก่อน

- Nest SaaS admin จำกัด SUPER_ADMIN แล้ว (`apps/api/src/saas-admin/saas-admin.controller.ts:24`) แต่ Next `/api/tenants` ยังไม่มี auth
- SOAP mutation ระบุ VETERINARIAN แล้ว และ owner bypass ไม่ผ่านรายการที่กำหนดหมอ; prescription/vaccination ยังไม่ได้ใช้กติกาเดียวกัน
- Next routes หลายตัวเปลี่ยน tenant-not-found เป็น 404 แล้ว จึงไม่ query ทุก tenant จาก slug ที่ไม่พบ แต่ยังเชื่อ slug ของ client และไม่ตรวจตัวตน
- เพิ่ม receptionist menu, หน้า services/notifications และแก้การแปลงเวลานัดเป็น +07:00
- เพิ่ม fetch ใน CRM/booking/queue; staff API hash ด้วย bcrypt แล้ว แต่ payload ฝั่ง UI ยังไม่ครบ

## ผลทดสอบที่ทำซ้ำได้

รัน `node scripts/audit-role-actions.cjs` -> exit 1; ตรวจ 6 กรณีและพบข้อผิดพลาดทั้ง 6 (ตั้งใจให้เป็น red tests จนกว่าบัคจะถูกแก้):

| กรณี | ควรเป็น | ผล handler จริง |
| --- | --- | --- |
| Login backend ตอบสำเร็จแบบ `{success,data:{user,tokens}}` | ได้ user profile | success=false, ไม่สร้าง profile |
| เพิ่มนัด API ตอบ 500 | error และไม่เพิ่มนัดสำเร็จ | dispatch appointment-created + success |
| เพิ่มลูกค้าสำเร็จ แต่เพิ่มสัตว์ตอบ 500 | แจ้ง partial failure | redirect กลับรายการ, error=null |
| เพิ่มพนักงาน เลือกรหัส/สาขาเอง และ API ตอบ 500 | ส่งค่าครบ, ไม่ success | ไม่ส่ง password/branchId แต่แจ้งสำเร็จ |
| บันทึก SOAP ตอบ 401 | แจ้งหมดสิทธิ์/ต้อง login | success=true และเพิ่ม history ใน state |
| เพิ่มบริการคอมมิชชัน 0% | เก็บ 0 | เก็บ 10 |

Harness ใช้ handler จาก source ปัจจุบัน ไม่คัดลอก business logic และไม่ใช้บัญชีจริง; fixtures ใช้ประกอบ proof เฉพาะกรณี ไม่ทดแทนการทดสอบ React, route middleware, DB transaction หรือ concurrent users

## Findings

### P1 — Login อ่าน envelope ผิดและ fallback กลบความผิดพลาด

`apps/web/contexts/auth-context.tsx:185` อ่าน `data.user`/`data.tokens` แต่ `apps/api/src/common/interceptors/transform.interceptor.ts:28` ห่อ response เป็น `{success:true,data:...}` เกิด exception แล้วถูก catch เงียบ บัญชีจริงจึง login ไม่สำเร็จใน contract นี้

fallback demo ทำงานแม้ server ตอบปฏิเสธ ไม่จำกัดเฉพาะ offline development; session เก็บ localStorage และไม่ได้ refresh/me ตรวจตัวตนใหม่ทุกครั้ง ต้องแยก demo environment และ fail closed เมื่อ server ปฏิเสธ

### P1 — ปุ่มเพิ่มนัดยังเลือกข้อมูลตัวอย่างและแจ้งสำเร็จแม้บันทึกไม่ได้

`components/appointments/new-appointment-modal.tsx:44` มี PRESET_CUSTOMERS c1/p1; services/staff ก็เป็น preset ไม่ได้โหลดจาก CRM/services ที่เพิ่มจริง

`:311` handleSubmit ส่งไป `/api/appointments` แต่ไม่จัดการ non-2xx แล้ว dispatch success เสมอ (`:400`) พร้อม ID จำลอง กรณีลูกค้าใหม่ API อาจสร้าง customer/pet ไปแล้วแต่ appointment ล้มเหลวเพราะ service preset ไม่พบ และไม่มี transaction ครอบทั้งหมด

prefill รับ date/time/staff/service/mode แต่ไม่ใช้ customerId/petId; ปุ่มเปิดจากข้อมูลลูกค้าจึงไม่รับประกันว่าฟอร์มเลือกสัตว์ตัวนั้น ส่วน mode CLINIC/GROOMING_QUEUE ยัง POST appointment endpoint เดิม ไม่สร้าง visit/queue ตามชื่อปุ่ม

### P1 — ปุ่มเพิ่มลูกค้า+สัตว์ละเลย failure และข้อมูลที่กรอก

`apps/web/app/customers/new/page.tsx:80` ไม่ตรวจ pet response.ok; บันทึกลูกค้าแล้วสัตว์ล้มเหลวยัง redirect เสมอ ไม่มี transaction หรือ UI กู้ partial failure

เงื่อนไขเพิ่มสัตว์ตรวจ petName แต่ไม่ตรวจ includePet: กรอกชื่อสัตว์แล้วกดข้ามยังส่งสร้างสัตว์ได้ ค่า notes/allergies/behavioralNotes/birthDate ที่มีในฟอร์มไม่ได้ส่งใน payload นี้ ข้อมูลสำคัญจึงหายตั้งแต่ขั้นรับเข้า

### P1 — เพิ่มพนักงานไม่ส่งรหัสผ่าน/สาขาที่เลือก

`settings/staff/page.tsx:197` แสดง success และเพิ่ม s-Date.now ในรายการก่อน server; `:232` ส่งเพียง name/email/phone/role ไม่มี password และ branchId

API `api/staff/route.ts:107` จึงใช้ password123 และสาขาแรก ผู้ใช้เห็นรหัส/สาขาใน success modal คนละค่ากับ DB; subsequent edit ใช้ ID จำลองแทน ID ที่ server สร้างจนกว่าจะ reload

### P1 — เพิ่มคิวจากคนละปุ่มให้ผลคนละแบบ

- TopBar เพิ่มนัดหมาย/คิว -> NewAppointmentModal -> POST appointments
- Queue เช็กอิน -> POST grooming แต่ไม่ส่ง groomerId/serviceId ที่ผู้ใช้เลือก (`grooming/queue/page.tsx:556`)
- `api/grooming/route.ts:147` เลือกบริการแรก, ช่างว่างหากไม่มี groomerId, ราคา 500 บาทคงที่ ขณะที่ UI แสดงช่าง/บริการที่เลือกเอง
- status PATCH ไม่ตรวจ response.ok และ update local state ก่อน; ไม่มี rollback
- ต้องแยกความหมาย: จองล่วงหน้า / เช็กอินจากนัดเดิม / walk-in และเชื่อม appointmentId/customerId/petId/serviceId จริงให้ชัด

### P1 — หมอบันทึก SOAP ผ่าน token คนละที่และไม่ตรวจผล

`clinical/visits/[id]/soap/page.tsx:205` อ่าน petflow_token แต่ AuthProvider เก็บ accessToken ใน petflow_current_user ไม่มี writer สำหรับ petflow_token ในโค้ดที่ค้น

ยังใช้ MOCK_SOAP_DATA แทนโหลด visitId จาก URL; save/complete อยู่ใน finally ที่แสดง success เสมอแม้ 401/403/500 และผู้เขียน history hardcoded หน้าเปิด visit เขียน localStorage แต่ clinical list อ่าน MOCK_VISITS

### P1 — UI role ยังไม่ตรง action ที่อนุญาต

- receptionist เข้า services ได้พร้อมปุ่มเพิ่ม/แก้/ลบบริการ ไม่มีสิทธิ์แยกดูราคากับเปลี่ยนราคา
- receptionist ไม่มีเมนู clinical เพื่อรับเคส OPD แต่ปุ่ม global เปิด mode CLINIC ได้ และ direct URL ไม่มี page-level role gate
- owner/admin เข้า SOAP ได้เห็นปุ่มบันทึก แต่ backend SOAP อนุญาตเฉพาะหมอ; UI กลบ 403 เป็น success
- STAFF อยู่ใน type แต่ไม่มี nav item อนุญาต; ไม่กำหนด workflow ของ role นี้
- `top-bar.tsx:86` ซ่อนปุ่มเพิ่มเฉพาะ SAAS_ADMIN ไม่รวม SUPER_ADMIN จึงแสดงเพิ่มนัดให้ platform admin ที่เปลี่ยนชื่อ role แล้ว
- branch selector เป็น div ไม่มี onClick เปลี่ยนสาขาจริง และ POST ไม่ส่ง branch context จึงใช้สาขาแรก

ควรมี permission ต่อ action แล้วใช้เป็นฐานร่วมสำหรับเมนู/ปุ่ม/route/API เช่น customer.create, appointment.create, queue.checkIn, clinical.write, service.manage, staff.manage และ invoice.void

### P1 — การป้องกัน API ยังไม่ครบแม้บางจุดแก้แล้ว

Next routes customers/pets/appointments/grooming/staff/branches/tenants ยังไม่มี auth/session validation และรับ tenantSlug จาก client; `/api/tenants` อ่าน platform-wide ได้; `/api/grooming` PATCH ใช้ id ตรง ๆ

Nest prescriptions/vaccinations/clinic-visits มี RolesGuard แต่ไม่ระบุ @Roles บน mutation ที่ตรวจ; RolesGuard อนุญาตเมื่อไม่พบ metadata ส่วน invoice controller ใช้ Jwt guard โดยไม่แยกสิทธิ์ void/delete

จึงห้ามสรุปว่าปิดช่องโหว่จากการแก้เฉพาะ SOAP และ saas-admin ใน Nest แล้ว ต้องตรวจทุก request path ที่หน้าเว็บใช้จริง

### P2 — เพิ่มบริการยังไม่ส่งต่อไปหน้าจอง/POS

`services/page.tsx:193` เปลี่ยน state เท่านั้น; booking และ POS ใช้ catalog ของตนเอง จึงเพิ่มบริการแล้วไม่พบในหน้าถัดไปหรือหายเมื่อ reload

`parseFloat(formCommission) || 10` ทำให้ 0% กลายเป็น 10%; harness ยืนยันแล้ว ควรแยก invalid/missing ออกจากเลขศูนย์

### P1 — POS และรายงานยังไม่ใช่ flow จริง

`pos/page.tsx:562` ยังสุ่มบิลและ set success ไม่มี payment API; inventory stock อยู่ใน localStorage และจับคู่บางส่วนของชื่อ; รายงาน owner/recovery/no-show/commission ยังเป็น mock

subscription/usage/notifications/feature-flags เป็น state/demo บางส่วน ไม่ควรเรียกว่าเชื่อมครบหรือรับรองผลส่ง LINE/ชำระแพ็กเกจจริง

## ตาราง role ที่เสนอ (ข้อเสนอ ไม่ใช่สิทธิ์ที่ผ่านแล้ว)

| Role | ปุ่มหลักที่ควรมี | ปุ่มที่ต้องจำกัด/แยกสิทธิ์ |
| --- | --- | --- |
| Receptionist | เพิ่มลูกค้า/สัตว์, จอง, เช็กอินกรูมมิ่ง/OPD, ออกบิล/รับเงิน | เปลี่ยนราคาบริการ, ปรับต้นทุน, เพิ่มผู้ใช้, เขียน SOAP/สั่งยา, void/refund |
| Groomer | ดูคิวที่ได้รับสิทธิ์, เปลี่ยนขั้นตอน, บันทึกดูแล | เพิ่มนัดให้คนอื่น, เปลี่ยนราคา/พนักงาน, เขียนเวชระเบียน |
| Veterinarian | รับตรวจ, SOAP, prescription/vaccine, ส่งค่าใช้จ่าย | จัดการผู้ใช้, refund/ราคา/สาขา เว้นได้รับสิทธิ์เพิ่ม |
| Owner | บุคลากร/บริการ/สาขา/รายงาน/อนุมัติการเงิน | clinical.write ไม่ให้อัตโนมัติเพียงเป็น owner |
| Tenant admin / Branch manager | งานบริหารตามขอบเขตและสาขา | สิทธิ์ platform และ clinical ต้องแยก |
| STAFF | ต้องกำหนดชุดงานชัดเจน | ตอนนี้มี type แต่ไม่มีเมนูรองรับ |
| SUPER_ADMIN | ดูแล platform | ซ่อนปุ่มเพิ่มงานร้านเมื่อไม่มี tenant context ที่เลือกอย่างมีสิทธิ์ |

## Coverage ส่วนอื่น

ตรวจ inventory 36 routes และตาม handler/API ของเส้นทางเพิ่มข้อมูลข้างต้น; routes CRM list/calendar/queue เริ่ม fetch แล้ว แต่รายละเอียด customer/pet, clinical และ reports ยังมี mock จึงยังไม่ส่งต่อด้วย record ID เดียวกันครบระบบ การตรวจนี้ไม่ใช่ browser walkthrough ทุก route/ทุก role

## ลำดับแก้

1. ใช้ auth envelope/token/tenant/branch ที่ถูกต้องและปิด Next API bypass
2. กำหนด permission และความหมายปุ่มให้ตรงกัน แยก booking/check-in/visit
3. เปลี่ยน preset catalog เป็นข้อมูลกลาง; ส่ง payload ครบ; แสดง success หลังตรวจ server response เท่านั้น
4. ใช้ transaction สำหรับ customer+pet+booking ที่ต้องสำเร็จร่วมกัน; แสดง partial failure หากกระบวนการแยกได้
5. ต่อ clinical -> invoice/payment/stock -> reports; ทดสอบข้าม role/เครื่อง/สาขา และ reload/retry

## Completion report

- TASK: ตรวจซ้ำ role/action consistency และ workflow ปัจจุบัน
- STATUS: ตรวจเสร็จ พบข้อผิดพลาดยืนยันด้วย handler 6 กรณี; ยังไม่พร้อมรับรองใช้งานครบ
- FILES CHANGED: เพิ่มรายงานนี้และ scripts/audit-role-actions.cjs
- DB CHANGES / API CHANGES / UI CHANGES: ไม่มี
- TESTS: diagnostic harness 6 failed expectations (บัคปัจจุบัน); pnpm typecheck ผ่าน; targeted auth/roles unit tests ผ่าน 2 suites / 9 tests; node --check ผ่าน
- COMMANDS RUN: git status/log, rg, Get-Content, node scripts/audit-role-actions.cjs, pnpm typecheck, pnpm --filter @petflow/api test -- --runInBand roles.guard.spec.ts auth.service.spec.ts
- REMAINING RISKS: ยังไม่รัน browser/DB integration/full test suite รอบนี้; ไม่แก้บัคหรือเปลี่ยน task status ระหว่าง audit
