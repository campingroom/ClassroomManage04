#!/usr/bin/env python3
import os
import re
import sys
import json
import subprocess

BASE = os.path.dirname(os.path.abspath(__file__))
wrangler_toml_path = os.path.join(BASE, 'wrangler.toml')
schema_sql_path = os.path.join(BASE, 'schema.sql')

def run_cmd(args):
    env = os.environ.copy()
    env["PATH"] = "/usr/local/bin:" + env.get("PATH", "")
    return subprocess.run(args, capture_output=True, text=True, env=env)

def main():
    print("=== 🗄️ เริ่มการตั้งค่า Cloudflare D1 Database ===")

    # 1. Check Login
    print("\n🔍 ตรวจสอบการเข้าสู่ระบบ Cloudflare...")
    res = run_cmd(['npx', 'wrangler', 'whoami'])
    if "Not logged in" in res.stdout or "Not logged in" in res.stderr or "not logged in" in res.stdout.lower():
        print("\n❌ ยังไม่ได้เข้าสู่ระบบ Cloudflare (Wrangler CLI)!")
        print("👉 กรุณารันคำสั่งนี้ก่อนเพื่อล็อกอิน:")
        print("   npx wrangler login")
        return False

    # 2. Get existing databases
    print("🔍 กำลังตรวจสอบฐานข้อมูลที่มีอยู่ในระบบ...")
    res_list = run_cmd(['npx', 'wrangler', 'd1', 'list', '--json'])
    
    db_id = None
    if res_list.returncode == 0:
        try:
            dbs = json.loads(res_list.stdout)
            for db in dbs:
                if db.get('name') == 'classroom_db':
                    db_id = db.get('uuid')
                    print(f"✓ พบฐานข้อมูลเดิม: classroom_db (ID: {db_id})")
                    break
        except Exception as e:
            # Fallback if JSON parsing fails
            matches = re.findall(r'classroom_db\s+([a-f0-9\-]+)', res_list.stdout)
            if matches:
                db_id = matches[0]
                print(f"✓ พบฐานข้อมูลเดิม: classroom_db (ID: {db_id})")

    # 3. Create database if not exists
    if not db_id:
        print("➕ ไม่พบฐานข้อมูล classroom_db กำลังสร้างใหม่...")
        res_create = subprocess.run(
            ['npx', 'wrangler', 'd1', 'create', 'classroom_db'],
            capture_output=True, text=True
        )
        if res_create.returncode != 0:
            print("❌ ไม่สามารถสร้างฐานข้อมูล D1 ได้:")
            print(res_create.stderr)
            return False
        
        # Parse database_id from output
        out = res_create.stdout + "\n" + res_create.stderr
        match = re.search(r'database_id\s*=\s*["\']([^"\']+)["\']', out)
        if match:
            db_id = match.group(1)
            print(f"✓ สร้างฐานข้อมูลสำเร็จ! ID: {db_id}")
        else:
            print("❌ ไม่สามารถระบุ database_id จากผลลัพธ์การสร้างได้")
            print(out)
            return False

    # 4. Update wrangler.toml with the database_id
    if os.path.exists(wrangler_toml_path):
        print("📝 กำลังอัปเดต wrangler.toml ด้วย database_id ที่ถูกต้อง...")
        with open(wrangler_toml_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace database_id
        pattern = r'(database_id\s*=\s*["\'])([^"\']+)(["\'])'
        if re.search(pattern, content):
            new_content = re.sub(pattern, rf'\1{db_id}\3', content)
        else:
            # Append if not present
            new_content = content + f'\ndatabase_id = "{db_id}"\n'

        with open(wrangler_toml_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("✓ อัปเดต wrangler.toml เรียบร้อยแล้ว!")
    else:
        # Create a new wrangler.toml if missing
        print("📝 สร้างไฟล์ wrangler.toml ใหม่...")
        new_toml = f'''name = "classroom-management-04"
pages_build_output_dir = "public"
compatibility_date = "2024-03-01"

[[d1_databases]]
binding = "DB"
database_name = "classroom_db"
database_id = "{db_id}"
'''
        with open(wrangler_toml_path, 'w', encoding='utf-8') as f:
            f.write(new_toml)
        print("✓ สร้าง wrangler.toml สำเร็จ!")

    # 5. Initialize/update database schema
    if os.path.exists(schema_sql_path):
        print("🗄️ กำลังนำเข้าโครงสร้างตารางข้อมูล (schema.sql) ไปยัง D1...")
        res_exec = subprocess.run([
            'npx', 'wrangler', 'd1', 'execute', 'classroom_db', '--remote', '--file=schema.sql', '-y'
        ])
        if res_exec.returncode == 0:
            print("🎉 ตั้งค่าตารางข้อมูลสำเร็จพร้อมใช้งาน!")
        else:
            print("❌ ไม่สามารถเชื่อมต่อตารางข้อมูลไปยัง D1 ได้สำเร็จ")
            return False
    else:
        print("⚠️ ไม่พบไฟล์ schema.sql ไม่สามารถสร้างตารางได้")

    print("\n🌟 เสร็จสิ้นขั้นตอนการตั้งค่าฐานข้อมูลเรียบร้อย!")
    return True

if __name__ == '__main__':
    if not main():
        sys.exit(1)
