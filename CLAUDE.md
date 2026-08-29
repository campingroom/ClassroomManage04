# ClassDesk — ระบบบริหารจัดการชั้นเรียน

โปรเจกต์เว็บแอปสำหรับครูใช้จัดการห้องเรียน (เช็คชื่อ, พฤติกรรม, คะแนน/เกรด, ตารางสอน, โหมดสอนสด,
ระบบเกม "มอนสเตอร์" จูงใจนักเรียน) เขียนด้วย Vanilla JavaScript ล้วน ไม่มีเฟรมเวิร์ก ไม่มี build step

## Stack / โครงสร้าง
- Frontend: HTML + Vanilla JS (ES2015+), โหลดผ่าน `<script>` tag ตามลำดับใน `index.html` — **ไม่ใช้ ES Modules**
  ทุกฟังก์ชัน/state ผูกกับ `window.*` (global namespace)
- Backend: Cloudflare Pages Functions (`functions/api/*.js`) + Cloudflare D1 (SQLite) สำหรับ login/register/sync ข้อมูลขึ้นคลาวด์
- Local storage เป็น local-first (`localStorage`) แล้วค่อยซิงก์ขึ้น D1 ทีหลัง (offline-first)
- Dev server: `./start_server.command` รัน `python3 -m http.server 8080` จาก **root ของโปรเจกต์โดยตรง**
  (ไม่ใช่จาก `public/`) → เปิดที่ `http://localhost:8080/index.html`
- `public/` = โฟลเดอร์สำหรับ deploy จริงบน Cloudflare Pages เท่านั้น ต้องรัน `python3 sync_public.py`
  ทุกครั้งหลังแก้ไฟล์ root (`index.html`, `style.css`, `app.js`, `modules/*.js`) เพื่อ sync เข้า `public/`
  **สคริปต์นี้ไม่ลบไฟล์เก่าที่ถูกลบออกจาก root ให้อัตโนมัติ ต้องลบไฟล์ที่ค้างใน `public/modules/` เองด้วย**

## งานที่เพิ่งทำไป (โดย Claude ผ่าน Cowork)

### 1. ปิดช่องโหว่ XSS
เพิ่ม `window.esc()` ใน `app.js` (บนสุดของไฟล์) แล้วครอบข้อมูลที่ผู้ใช้พิมพ์/นำเข้าทุกจุดก่อนแสดงผลผ่าน
`.innerHTML` — ครอบคลุมชื่อนักเรียน, ชื่อเล่น, เบอร์โทร, หมายเหตุพฤติกรรม, ชื่อวิชา/ห้อง/ครูผู้สอน,
ข้อมูลโรงเรียน/ผู้อำนวยการ (หน้าตั้งค่า + รายงาน ปพ.5), ชื่อสื่อการสอน, วันหยุดที่กำหนดเอง ฯลฯ
(~150 จุด ใน 12 ไฟล์: app.js, attendance-*.js, behavior.js, cloudflare_sync.js, dashboard.js,
live_mode.js, reports.js, rooms.js, schedule.js, settings.js, students.js, subjects.js, teaching.js)

**ยังไม่ได้ตรวจ/แก้:** อาจมีจุดเสี่ยงเล็กน้อยที่หลุดรอดจากการสแกน (โค้ดเบสใหญ่ ~15,000 บรรทัด)
แนะนำเวลาเพิ่มฟีเจอร์ใหม่ที่ต้องแสดงข้อความที่ผู้ใช้พิมพ์ผ่าน `.innerHTML` — ให้ครอบด้วย `window.esc(...)` เสมอ

### 2. แตกไฟล์ `modules/attendance.js` (เดิม 2,188 บรรทัด/102KB — ไฟล์ใหญ่สุดในโปรเจกต์)
แยกเป็น 5 ไฟล์ตามหน้าที่ (โหลดเรียงตามนี้ใน `index.html`):
- `attendance-core.js` — data layer: อ่าน/บันทึกสถานะเช็คชื่อ + ค่าคงที่ร่วม (ATT_DAY_NAMES, ATT_STATUS_CFG)
- `attendance-holidays.js` — วันหยุดราชการ/วันหยุดที่ครูกำหนดเอง
- `attendance-checkin.js` — หน้าจอเช็คชื่อรายวัน (ปฏิทิน, เลือกวิชา/คาบ, บันทึกสถานะ)
- `attendance-summary.js` — สรุปผล/drill-down รายวิชา-รายห้อง + ตารางสรุปรายเดือน/รายวัน
- `attendance-calendar.js` — ปฏิทินวิชาการรายภาคเรียน

ไฟล์ `modules/attendance.js` เดิมถูกเปลี่ยนเป็นไฟล์ว่าง (มีคอมเมนต์บอกว่าเลิกใช้แล้ว) —
**ลบไฟล์นี้ทิ้งได้เลยทั้งที่ root และใน `public/modules/`** (ระบบที่แก้ให้ไม่มีสิทธิ์ลบไฟล์บนเครื่องผู้ใช้)

ทุกฟังก์ชัน (50 ตัว) ยืนยันแล้วว่าย้ายครบไม่ตกหล่น ผ่าน `node --check` และทดสอบจริงผ่านเบราว์เซอร์
(เช็คชื่อ/รายงาน & สถิติ/รายวัน/ปฏิทินวิชาการ) ไม่มี error

## ปัญหาที่พบระหว่างทดสอบ (มีอยู่ก่อนแล้ว ไม่เกี่ยวกับการแก้ไขรอบนี้)
Console error ตอนซิงก์คลาวด์:
```
Cloudflare sync profile push error: Error: D1_ERROR: FOREIGN KEY constraint failed
    at window.performProfilePush (modules/cloudflare_sync.js:824)
    at async window.pullAllDataFromCloudflare (modules/cloudflare_sync.js:578)
```
ยังไม่ได้ตรวจสอบสาเหตุ — น่าจะเกี่ยวกับ schema ใน D1 (`schema.sql`) กับข้อมูล profile ที่พยายาม push
ไม่ตรงกัน (อาจเป็น semester_id หรือ user_id ที่อ้างอิงไม่ถึงกัน)

## สิ่งที่ยังไม่ได้ทำ (ผู้ใช้เลือกโฟกัสแค่ security + เริ่มแตกไฟล์ใหญ่ก่อนในรอบที่แล้ว)
1. **แตกไฟล์ใหญ่ที่เหลือ** ในลักษณะเดียวกับ attendance.js:
   - `modules/live_mode.js` (~2,175 บรรทัด/75KB) — โหมดสอนสด
   - `modules/teaching.js` (~1,300+ บรรทัด/52KB) — งาน/คะแนน/สื่อการสอน
   - `modules/reports.js` (~1,443 บรรทัด/64KB) — รายงาน
2. **ย้ายจาก global `window.x = ...` ไปเป็น module pattern จริง** (ES Modules หรืออย่างน้อย IIFE +
   expose เฉพาะ public API) เพื่อลดความเสี่ยงชื่อชนกันและทำให้ทดสอบได้ (ยังไม่มี test suite เลยในโปรเจกต์นี้)
3. **แก้ D1 FOREIGN KEY error** ข้างบน
4. ตรวจสอบเพิ่มเติมว่ามีจุด `.innerHTML` ที่ยังไม่ได้ escape ตกหล่นหรือไม่ (ดู `git log` / diff ล่าสุดเทียบกับ
   ตอนที่ยังไม่แก้ เพื่อดู pattern ที่ใช้)

## คำสั่งที่ใช้บ่อย
```bash
./start_server.command          # เปิด dev server ที่ localhost:8080
python3 sync_public.py          # sync root -> public/ (รันก่อน deploy เสมอ)
node --check modules/xxx.js     # เช็ค syntax หลังแก้ไฟล์ JS
git status && git diff          # ดูการเปลี่ยนแปลงก่อน commit
```
