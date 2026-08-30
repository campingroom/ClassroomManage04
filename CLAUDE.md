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
- D1 database: `classroom_db` (uuid `d6835529-837d-4df6-b629-57e5cf766ec3`) — เข้าถึงตรวจ schema/ข้อมูลได้ผ่าน
  Cloudflare D1 MCP tools เวลา debug ปัญหา sync (อย่า query คอลัมน์ที่มี PII เช่น `email` ตรงๆ — auto mode
  classifier จะบล็อก ใช้ query แบบนับจำนวน/เช็ค existence แทน)
- โค้ดที่ยังไม่ merge เข้า `main` อยู่ใน branch `cloudflare-migration-and-refactor` (ดู PR #1)

## โมดูล `modules/` ปัจจุบัน (หลังแตกไฟล์ใหญ่ทั้งหมดแล้ว)
ทุกไฟล์ใหญ่เดิม (attendance/live_mode/teaching/reports) ถูกแตกเป็นไฟล์ย่อยตามหน้าที่ครบแล้ว ไม่มีไฟล์
เดี่ยวไหนเกิน ~900 บรรทัดอีกต่อไป:
- **เช็คชื่อ**: `attendance-core.js`, `attendance-holidays.js`, `attendance-checkin.js`,
  `attendance-summary.js`, `attendance-calendar.js`
- **โหมดสอนสด**: `live-core.js` (state/เสียง/หน้าจอหลัก), `live-points.js` (เป้าหมายห้อง/สุ่มชื่อ/1v1/
  leaderboard), `live-classroom-tools.js` (confetti/แบ่งกลุ่ม/วงล้อ/บอร์ดนำเสนอ), `live-widget.js`
  (mood check/breathing/timer/noise meter)
- **งาน & คะแนนเก็บ**: `teaching-assignments.js` (to-do งาน), `teaching-workgrid.js` (ตารางให้คะแนนตาม
  ช่วง pre/mid-exam/post/final), `teaching-materials.js` (สื่อการสอน), `teaching-assessment.js`
  (คะแนน/เกรดรวม)
- **รายงาน**: `reports-summary.js` (ตารางสรุป+CSV), `reports-print-class.js` (พิมพ์ ปพ.5 ทั้งห้อง),
  `reports-print-individual.js` (พิมพ์ ปพ.6 รายบุคคล), `reports-attendance-stats.js` (สถิติเข้าเรียน+Excel)
- ไฟล์อื่นที่ยังไม่ถูกแตก (ขนาดโอเคอยู่แล้ว): `behavior.js`, `cloudflare_sync.js`, `dashboard.js`,
  `monster_engine.js`, `rooms.js`, `schedule.js`, `settings.js`, `students.js`, `subjects.js`

เวลาแตกไฟล์ในลักษณะนี้ต่อ (ถ้ามีไฟล์ใหม่โตขึ้นจนควรแตกอีก): แตกตาม comment header ที่มีอยู่แล้วในไฟล์
เดิม → extract ด้วย `sed -n 'A,Bp'` ต่อ section (แม่นกว่าพิมพ์ซ้ำเอง) → เช็คด้วย `node --check` ทุกไฟล์ →
diff รายชื่อ `window.*` ก่อน/หลังด้วย grep เพื่อยืนยันไม่มีฟังก์ชันตกหล่น/ซ้ำ → อัปเดต `<script>` ใน
`index.html` → ลบไฟล์เดิม → `python3 sync_public.py` → ลบไฟล์ค้างใน `public/modules/` เอง → ทดสอบจริงใน
เบราว์เซอร์ทุกหน้าที่กระทบ (ดู console error)

## ความปลอดภัย (Security)

### ปิดช่องโหว่ XSS (เสร็จแล้ว)
เพิ่ม `window.esc()` ใน `app.js` (บนสุดของไฟล์) แล้วครอบข้อมูลที่ผู้ใช้พิมพ์/นำเข้าทุกจุดก่อนแสดงผลผ่าน
`.innerHTML` — ครอบคลุมชื่อนักเรียน, ชื่อเล่น, เบอร์โทร, หมายเหตุพฤติกรรม, ชื่อวิชา/ห้อง/ครูผู้สอน,
ข้อมูลโรงเรียน/ผู้อำนวยการ (หน้าตั้งค่า + รายงาน ปพ.5), ชื่อสื่อการสอน, วันหยุดที่กำหนดเอง ฯลฯ (~150 จุด)

**ยังไม่ได้ตรวจซ้ำ:** อาจมีจุดเสี่ยงเล็กน้อยที่หลุดรอดจากการสแกนครั้งแรก (โค้ดเบสใหญ่ ~15,000 บรรทัด)
แนะนำเวลาเพิ่มฟีเจอร์ใหม่ที่ต้องแสดงข้อความที่ผู้ใช้พิมพ์ผ่าน `.innerHTML` — ให้ครอบด้วย `window.esc(...)` เสมอ

### JWT ไม่เคยตรวจลายเซ็น (เสร็จแล้ว — แก้ใน `functions/api/_utils.js`)
`verifyToken()` เดิม decode payload อย่างเดียวโดยไม่เช็ค HMAC signature เลย และมี fallback เก่าที่เอา
token ดิบมาใช้เป็น `userId` ตรงๆ ถ้า token ไม่ใช่ JWT 3 ส่วน (สำหรับ "legacy sharing key" ที่ตอนนี้ปิดใช้
งานแล้ว) — แปลว่าใครก็ปลอม token เพื่ออ้างเป็น user คนไหนก็ได้ ตอนนี้ตรวจ signature จริงด้วย
`crypto.subtle.verify` แล้ว และลบ fallback เก่าทิ้ง

## D1 FOREIGN KEY error ตอนซิงก์คลาวด์ (แก้แล้ว — ยังไม่ deploy)

**อาการเดิม:**
```
Cloudflare sync profile push error: Error: D1_ERROR: FOREIGN KEY constraint failed
    at window.performProfilePush (modules/cloudflare_sync.js:824)
    at async window.pullAllDataFromCloudflare (modules/cloudflare_sync.js:578)
```

**สาเหตุที่แท้จริง** (ยืนยันด้วยการ query schema จริงบน D1 ผ่าน MCP): ฐานข้อมูลจริง (`classroom_db`) ยังมี
`FOREIGN KEY (user_id) REFERENCES users(id)` อยู่บน `user_profiles` และ `user_semesters` ตั้งแต่สร้างครั้ง
แรก — รอบก่อนมีคนแก้ `schema.sql` ลบ FK ออกไปเพื่อพยายามแก้ปัญหานี้ แต่ **ไม่มีผลอะไรเลย** เพราะ
`CREATE TABLE IF NOT EXISTS` ไม่ได้รันซ้ำกับตารางที่มีอยู่แล้ว ต้นตอจริงคือ token เก่า/ปลอม (เช่น token
ที่ค้างใน browser จากก่อน commit "Update D1 Database ID") decode ได้ `userId` ที่ไม่มีจริงในตาราง
`users` แล้ว INSERT ก็เลยชน constraint

**สิ่งที่แก้ไปแล้ว** (อยู่ใน PR #1, branch `cloudflare-migration-and-refactor`):
1. `functions/api/_utils.js` — `verifyToken()` ตรวจลายเซ็นจริง (ดูหัวข้อ Security ด้านบน)
2. `functions/api/sync/profile.js`, `functions/api/sync/semester.js` — เช็คว่า `user_id` มีอยู่จริงในตาราง
   `users` ก่อน INSERT เสมอ ถ้าไม่มีคืน 401 พร้อม `code: "USER_NOT_FOUND"` แทนที่จะปล่อยให้ D1 throw
   raw constraint error ออกมา
3. `modules/cloudflare_sync.js` — `performProfilePush`/`performSemesterPush` เจอ 401 แล้วบังคับ
   `cloudflareLogout(true)` เหมือนที่ `pullAllDataFromCloudflare` ทำอยู่แล้ว (เดิมแค่ throw แล้ว retry ด้วย
   token เดิมที่พังตลอดไปเรื่อยๆ)
4. `schema.sql` — คืนค่า `FOREIGN KEY` กลับมาให้ตรงกับฐานข้อมูลจริง

**บั๊กแทรกที่เจอระหว่างทดสอบ (แก้แล้วในไฟล์เดียวกัน):** ฟังก์ชัน push/pull 6 ตัวใน `cloudflare_sync.js`
(`performProfilePush`, `performSemesterPush`, `pullAllDataFromCloudflare`,
`pullSemesterDataFromCloudflare`, `pushGlobalProfileToCloudflare`, `pushSemesterDataToCloudflare`) เช็ค
แค่ `window.firebaseUser` เป็น truthy โดยไม่เช็ค `.isLocal` — แปลว่าโหมด **Offline/Local Trial** ก็ยังพยายาม
ยิง sync ขึ้นคลาวด์ด้วย token ปลอม (`local_offline_token`) ทุกครั้งที่แก้ข้อมูล ถ้าไม่แก้ตรงนี้ด้วย ผู้ใช้
โหมด Offline จะโดนเด้ง logout ทุกครั้งที่แก้ไขข้อมูล (จาก fix ข้อ 3 ด้านบน) — ตอนนี้ทั้ง 6 จุดเช็ค
`window.firebaseUser.isLocal` แล้วข้ามการซิงก์ไปเลยถ้าเป็น local mode

**⚠️ ยังไม่ deploy ขึ้น Cloudflare จริง** — fix ฝั่ง `functions/api/*` ต้อง deploy ก่อนถึงจะมีผลกับ production
(โค้ด frontend/local ทดสอบผ่านหมดแล้ว แต่ backend ที่รันอยู่ตอนนี้ยังเป็นเวอร์ชันเก่า)

## สิ่งที่ยังไม่ได้ทำ
1. **Deploy fix ของ `functions/api/*` ขึ้น Cloudflare จริง** (ดูหัวข้อ D1 ด้านบน)
2. **Merge PR #1** เข้า `main` เมื่อ deploy+ตรวจสอบแล้วโอเค
3. **ย้ายจาก global `window.x = ...` ไปเป็น module pattern จริง** (ES Modules หรืออย่างน้อย IIFE +
   expose เฉพาะ public API) เพื่อลดความเสี่ยงชื่อชนกันและทำให้ทดสอบได้ (ยังไม่มี test suite เลยในโปรเจกต์นี้)
4. ตรวจสอบเพิ่มเติมว่ามีจุด `.innerHTML` ที่ยังไม่ได้ escape ตกหล่นหรือไม่ (ดู `git log` / diff ล่าสุดเทียบกับ
   ตอนที่ยังไม่แก้ เพื่อดู pattern ที่ใช้)

## คำสั่งที่ใช้บ่อย
```bash
./start_server.command          # เปิด dev server ที่ localhost:8080
python3 sync_public.py          # sync root -> public/ (รันก่อน deploy เสมอ)
node --check modules/xxx.js     # เช็ค syntax หลังแก้ไฟล์ JS
git status && git diff          # ดูการเปลี่ยนแปลงก่อน commit
```
