# เกณฑ์เปรียบเทียบ workflow PetFlow กับระบบในตลาด

ตรวจเอกสารทางการวันที่ 8 กันยายน 2026 — ศึกษา ezyVet, Provet และ MoeGo จากคู่มือ/API ของผู้ผลิต ไม่ได้ทดลองบัญชีจริงของคู่แข่ง รายงานนี้เป็นเกณฑ์ประกอบการตรวจโค้ด ไม่ใช่คำยืนยันว่า PetFlow ผ่านเกณฑ์แล้ว และการที่คู่แข่งมีฟีเจอร์ไม่ได้ทำให้ฟีเจอร์นั้นเป็นข้อบังคับของ MVP

## สิ่งที่พบในระบบอื่น

| ประเด็น | หลักฐานจากผู้ผลิต | เกณฑ์นำมาใช้ตรวจ PetFlow |
| --- | --- | --- |
| สิทธิ์แยกตามการกระทำ | ezyVet แยกสิทธิ์สร้าง/แก้ clinical record, lock/unlock และแก้ข้อมูลที่อนุมัติแล้ว ไม่ได้มีแค่เข้าเมนูได้หรือไม่ได้ [User account permissions](https://docs.ezyvet.com/en/browse-documentation/ezyvet/reference-information/permissions-and-access/user-account-permissions) | ทำ matrix อ่าน/สร้าง/แก้/ยกเลิก/อนุมัติ/คืนเงิน/ส่งออก และตรวจทั้ง UI กับ API |
| บทบาทเจ้าของกับหมอไม่เหมือนกัน | ezyVet ยกตัวอย่างผู้จัดการดูแล invoice และสินค้า ขณะที่สัตวแพทย์ตรวจและสั่งวินิจฉัย โดยไม่จำเป็นต้องให้ทุกคนทำทุกอย่าง [Role-based permissions](https://www.ezyvet.com/blog/why-every-veterinary-practice-should-be-using-role-based-permissions) | เจ้าของที่ไม่ใช่หมอไม่ควรได้สิทธิ์เขียนประวัติทางคลินิกโดยอัตโนมัติเพียงเพราะเป็นเจ้าของ; ให้กำหนดสิทธิ์เพิ่มได้ตามหน้าที่จริง |
| พนักงานกับปฏิทินคนอื่น | MoeGo แยกสร้างนัดให้ตนเอง/คนอื่น การสร้างให้คนอื่นต้องเข้าถึงลูกค้าและปฏิทินคนนั้นด้วย ส่วนเก็บค่าปรับ no-show ต้องมีสิทธิ์รับเงิน [Appointment Permission](https://www.moego.pet/help/en/articles/13052656-appointment-permission) | ทดสอบ dependency ของสิทธิ์: เปิดหน้าได้แต่เรียกข้อมูลประกอบไม่ได้, groomer เปลี่ยนผู้รับผิดชอบข้ามคน/สาขาได้หรือไม่ |
| จองตามทรัพยากรและเวลาจริง | ezyVet ใช้ planning guides, unavailable slots, duration และ timezone; หมอที่ทำงานหลายสาขาต้องพิจารณาความไม่ว่างข้ามสาขาด้วย [Availability](https://developers.ezyvet.com/guides/availability.html) | ตรวจชั่วโมงเปิด, กะ, วันลา, เวลาพัก, ระยะบริการ/บัฟเฟอร์ และหมอคนเดียวกันข้ามสาขา; ทดสอบเลื่อนนัดและคำขอพร้อมกัน |
| ส่งต่องานจากนัดสู่คลินิกและบิล | ezyVet booking flow เชื่อม appointment, consult ตามชนิดนัด และ billing triggers ตามทรัพยากร [Booking Appointments](https://developers.ezyvet.com/guides/booking.html) | check-in ต้องพาไปงานที่เกี่ยวข้องได้และไม่สร้างคิว/visit/บิลซ้ำ; grooming-only ไม่จำเป็นต้องสร้างเวชระเบียน |
| แยกตรวจเสร็จ ออกจากเก็บเงิน | Provet มี lifecycle ของ consultation และสร้าง invoice เมื่อ finalize; บันทึกรายการรักษา ยา diagnosis และ notes แยกเป็นรายการที่เชื่อม visit [Consultations](https://developers.provetcloud.com/restapi/howto_consultations.html) | ปุ่มจบการตรวจไม่ควรแปลว่ารับเงินจริงแล้ว; ค่าใช้จ่ายที่หมอบันทึกต้องส่งถึงแคชเชียร์ครบ และการแก้หลังจบต้องมีกติกา |
| ประวัติที่ล็อกแล้ว | Provet มีสิทธิ์แยกสำหรับแก้ notes หลัง finalize และแก้ locked notes ผ่าน API [API permissions](https://developers.provetcloud.com/restapi/permissions.html) | เก็บผู้เขียน/เวลา/ประวัติแก้ไขหรือ addendum; receptionist ไม่ควรแก้ผลวินิจฉัยย้อนหลังได้เพราะแก้ pet profile ได้ |
| หน้าปฏิบัติงานแสดงข้อมูลที่จำเป็น | MoeGo appointment drawer รวม notes, incidents, vaccines, unpaid balance, service duration และผู้รับผิดชอบ มี alert เมื่อชนตารางหรือพนักงานไม่อยู่กะ และแยก Checked In / Ready / Finished [Appointment detail](https://help.moego.pet/en/articles/14026461-appointment-detail-overview-desktop) | คิวต้องเห็นหมายเหตุแพ้/กัด/การดูแลพิเศษ; Ready ยังไม่ใช่รับกลับแล้ว; การเตือนอย่างเดียวของคู่แข่งไม่ใช่เหตุผลให้ลดข้อกำหนด PetFlow ที่ห้าม overlap เว้นแต่ตั้งค่าอนุญาต |
| ยกเลิกนัดไม่เท่ากับคืนเงิน | MoeGo ระบุว่ายกเลิกนัดที่จ่ายแล้วไม่คืนเงินอัตโนมัติ ต้องดำเนิน refund แยก [Cancel & No Show](https://help.moego.pet/en/articles/13928127-appointment-cancel-no-show) | ยกเลิกนัดไม่ควรลบ payment หรือทำรายงานรายได้หาย; ต้องเห็นว่าคืนหรือยังไม่คืน |
| เอกสารการเงินกับเงินจริง | Provet แยก invoice, invoicepayment และ credit note; การออก credit note ยังต้องบันทึก payout/refund จริงอีกขั้น [Billing & Invoicing](https://developers.provetcloud.com/restapi/howto_billing.html) | immutable paid invoice, partial payment, credit/void และ refund ต้อง reconcile กัน; ห้ามถือการเปลี่ยนสถานะอย่างเดียวเป็นหลักฐานว่าคืนเงินจริง |
| สต็อกมีเอกสารอ้างอิง | ezyVet receive invoice สร้างทั้งเอกสารรับและ inventory record ก่อนปรับ balance ของสถานที่นั้น [Managing Inventory](https://developers.ezyvet.com/guides/managing-inventory.html) | รับเข้า/ขาย/ใช้รักษา/คืน/ปรับยอดต้องมี transaction และ branch ที่ถูกต้อง; ยกเลิกหรือ retry ไม่ตัดสต็อกซ้ำ |
| แจ้งเตือนผูกเหตุการณ์ | MoeGo ตั้ง template และช่องทางตามลูกค้า/บริการได้ ส่งข้อความเลื่อนนัด ยกเลิก Ready และ receipt; receipt อัตโนมัติหลังจ่ายครบ trigger ครั้งเดียว [Auto Messages](https://help.moego.pet/en/articles/11394911-communication-set-up-auto-messages-reminders-and-replies) | LINE-ready ต้องเชื่อมเหตุการณ์จริง; retry ไม่ส่งซ้ำ, เลื่อน/ยกเลิกต้องไม่ปล่อย reminder เก่า และต้องแยกข้อความบริการจาก marketing consent |
| ตัวเลขเจ้าของตรวจย้อนกลับได้ | MoeGo finance reports ใช้วันที่ transaction และอธิบายความต่างจาก sales date พร้อมลิงก์ invoice/booking [Finance reports](https://www.moego.pet/help/en/articles/14191846-finance-reports) | dashboard ต้องนิยามรายได้/ยอดรับ/หนี้/คืนเงินชัดเจนและกรองสาขา; ตัวเลขรวมต้องไล่กลับถึงรายการได้ |

## Role matrix ที่เสนอให้ใช้เป็นฐานตรวจ

ตารางนี้เป็นข้อเสนอสำหรับ PetFlow ไม่ใช่การอ้างว่าทุกคู่แข่งใช้ค่าเริ่มต้นเดียวกัน และควรปรับตามหน้าที่ของแต่ละร้าน

| งาน | Receptionist / พนักงานหน้าเคาน์เตอร์ | Groomer | Veterinarian | Owner / Manager |
| --- | --- | --- | --- | --- |
| ลูกค้า/สัตว์ | อ่าน/สร้าง/แก้ข้อมูลธุรการในสาขาที่ได้รับสิทธิ์ | อ่านสัตว์และข้อมูลดูแลที่เกี่ยวข้อง | อ่านประวัติและข้อมูลจำเป็น | จัดการตามสิทธิ์และดูภาพรวม |
| นัดหมาย | สร้าง/เลื่อน/ยกเลิก/check-in | ดูงานและตารางที่ได้รับสิทธิ์ | ดูตาราง/เริ่มตรวจ | จัดการกำลังคน/ตั้งค่ากติกา |
| Grooming | รับเข้า/ส่งมอบตามสิทธิ์ | เปลี่ยนขั้นตอนงานและบันทึกการดูแล | อ่านข้อมูลเกี่ยวข้อง | ดู throughput/แก้ปัญหาหน้างาน |
| Clinical | เตรียมข้อมูลและอ่านคำแนะนำที่เกี่ยวข้อง | ไม่แก้ diagnosis/prescription | เขียน/จบ/เพิ่มบันทึกแก้ไข | ไม่เขียน clinical โดยอัตโนมัติถ้าไม่มีสิทธิ์หมอ |
| POS | รับเงินตามสิทธิ์ | ไม่จำเป็นต้องเห็นกำไรหรือคืนเงิน | ส่งรายการรักษาเข้า billing | อนุมัติ void/refund/ส่วนลดพิเศษ |
| Inventory | ขายสินค้าตามสิทธิ์ | บันทึกใช้วัสดุที่อนุญาต | ใช้/จ่ายยาตามสิทธิ์ | รับเข้า/ปรับยอด/ต้นทุน/รายงาน |
| Reports/settings | ข้อมูลการปฏิบัติงานที่จำเป็น | งานตนเอง | งานคลินิก | การเงิน สาขา บุคลากร การตั้งค่าที่ได้รับสิทธิ์ |

ทุกช่องต้องตรวจ tenant และ allowedBranches ที่ backend อีกชั้น การซ่อนเมนูไม่พอ รายงานของคู่แข่งไม่ใช่หลักฐานยืนยัน tenant isolation ของระบบใด

## สถานการณ์รับงานที่ควรผ่านก่อนเรียกว่าใช้งานจริงครบ role

1. Receptionist สร้างลูกค้า+สัตว์ → นัด → check-in → หมอหรือ groomer เปิดงานเดียวกัน → ส่งค่าใช้จ่าย → receptionist รับเงิน → owner ตรวจยอดตรงกัน
2. สัตว์ตัวเดิมมีงานรักษาและ grooming ในวันเดียว: ไม่แย่งสถานะ ไม่สร้างใบเสร็จซ้ำ และแต่ละทีมเห็นหมายเหตุที่จำเป็น
3. บุคลากรย้ายสาขา/หมดสิทธิ์/ออกจากงาน: token และ API เดิมไม่คงสิทธิ์เกินจริง
4. เลื่อน/ยกเลิก/no-show หลังมีมัดจำ: นัด คิว เงิน สต็อก และ reminder สอดคล้องกัน
5. สองคนกดจองหรือรับเงินพร้อมกัน รวมถึง retry เมื่อเครือข่ายหลุด: ไม่มีนัดซ้อน รับเงินซ้ำ ตัดสต็อกซ้ำ หรือส่งข้อความซ้ำ
6. หมอ finalize แล้วพบข้อมูลผิด: มีการแก้ไขที่ตรวจย้อนกลับได้และผู้ไม่มีสิทธิ์แก้ไม่ได้
7. ลองทุก URL และ API ด้วยทุก role รวม ID ต่าง tenant/สาขา: backend ปฏิเสธแม้ UI จะไม่แสดงปุ่ม

ข้อเสนอทดสอบเหล่านี้อนุมานจาก workflow ข้างต้นและข้อกำหนด AGENTS.md; ไม่ใช่ผลทดสอบ PetFlow ที่ทำแล้ว
