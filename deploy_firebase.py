#!/usr/bin/env python3
import os
import shutil
import subprocess
import json

BASE = os.path.dirname(os.path.abspath(__file__))

def run_cmd(args):
    env = os.environ.copy()
    env["PATH"] = "/usr/local/bin:" + env.get("PATH", "")
    return subprocess.run(args, capture_output=True, text=True, env=env)

def main():
    print("🚀 เริ่มการจัดเตรียมระบบสำหรับ Firebase Hosting...")
    
    # 1. Check if logged in
    res = run_cmd(['npx', '-y', 'firebase-tools@latest', 'projects:list'])
    if "Authentication Error" in res.stderr or "Authentication Error" in res.stdout:
        print("\n❌ ยังไม่ได้เข้าสู่ระบบ Firebase CLI!")
        print("👉 กรุณาเปิด Terminal ของคุณในโฟลเดอร์โปรเจกต์นี้ แล้วรันคำสั่ง:")
        print("   npx firebase login")
        print("\nเมื่อล็อกอินสำเร็จแล้ว ให้รันสคริปต์นี้ใหม่อีกครั้งครับ\n")
        return

    # 2. Get list of projects
    print("🔍 กำลังดึงรายการโปรเจกต์ Firebase ของคุณ...")
    try:
        list_res = run_cmd(['npx', '-y', 'firebase-tools@latest', 'projects:list', '--json'])
        proj_data = json.loads(list_res.stdout)
        projects = proj_data.get('result', [])
    except Exception:
        projects = []

    if not projects:
        print("\n⚠️ ไม่พบโปรเจกต์ Firebase ในบัญชีของคุณ")
        print("👉 กรุณาสร้างโปรเจกต์ใหม่ใน Firebase Console (https://console.firebase.google.com/)")
        print("จากนั้นให้รันสคริปต์นี้ใหม่อีกครั้งครับ\n")
        return

    # Check if .firebaserc already exists and has a default project
    rc_path = os.path.join(BASE, '.firebaserc')
    active_project = ""
    if os.path.exists(rc_path):
        try:
            with open(rc_path, 'r') as f:
                rc_data = json.load(f)
                active_project = rc_data.get('projects', {}).get('default', '')
        except Exception:
            pass

    if active_project and any(p.get('projectId') == active_project for p in projects):
        print(f"✓ ใช้โปรเจกต์ปัจจุบัน: {active_project}")
    else:
        print("\nรายการโปรเจกต์ Firebase ของคุณ:")
        for idx, p in enumerate(projects, 1):
            print(f"  {idx}. {p.get('displayName')} ({p.get('projectId')})")
        
        print("\n👉 กรุณาเลือกโปรเจกต์โดยป้อนตัวเลข (เช่น 1) หรือพิมพ์ Project ID ที่ต้องการใช้:")
        sel = input("เลือกโปรเจกต์: ").strip()
        
        selected_project = ""
        if sel.isdigit():
            val = int(sel) - 1
            if 0 <= val < len(projects):
                selected_project = projects[val].get('projectId')
        else:
            if any(p.get('projectId') == sel for p in projects):
                selected_project = sel

        if not selected_project:
            print("❌ เลือกโปรเจกต์ไม่ถูกต้อง")
            return
        
        # Write .firebaserc
        rc_data = {"projects": {"default": selected_project}}
        with open(rc_path, 'w') as f:
            json.dump(rc_data, f, indent=2)
        print(f"✓ ตั้งค่าโปรเจกต์เริ่มต้นเป็น: {selected_project}")
        active_project = selected_project

    # 3. Rebuild standalone.html
    build_script = os.path.join(BASE, 'build_standalone.py')
    print("\n📦 กำลังคอมไพล์แอปพลิเคชัน (build_standalone.py)...")
    res = subprocess.run(['python3', build_script])
    if res.returncode != 0:
        print("⚠️ คอมไพล์ส่งคืน error แต่จะลองตรวจสอบไฟล์ที่มีอยู่...")
    
    # 4. Setup public directory
    public_dir = os.path.join(BASE, 'public')
    if not os.path.exists(public_dir):
        os.makedirs(public_dir)

    # 5. Copy compiled HTML to public/index.html
    # Check multiple locations for the compiled standalone file
    compiled_candidates = [
        os.path.join(BASE, 'standalone.html'),
        '/Users/mariesmac/.gemini/antigravity-ide/scratch/standalone.html',
    ]
    compiled_html = None
    for candidate in compiled_candidates:
        if os.path.exists(candidate):
            compiled_html = candidate
            break
    
    if not compiled_html:
        print("❌ ไม่พบไฟล์ standalone.html ที่คอมไพล์แล้ว")
        return

    target_html = os.path.join(public_dir, 'index.html')
    
    try:
        shutil.copy2(compiled_html, target_html)
        print(f"✓ เตรียมไฟล์ public/index.html สำเร็จ (จาก {compiled_html})")
    except Exception as e:
        print(f"❌ คัดลอกไฟล์ไม่สำเร็จ: {e}")
        return

    # 6. Deploy to Firebase Hosting
    print("\n⚡ กำลังอัปโหลดข้อมูลไปยัง Firebase Hosting...")
    deploy_res = subprocess.run([
        'npx', '-y', 'firebase-tools@latest', 'deploy', '--only', 'hosting', '--project', active_project
    ])
    
    if deploy_res.returncode != 0:
        print("❌ การอัปโหลดล้มเหลว")
    else:
        print("\n🎉 อัปโหลดและเปิดใช้งานบน Firebase Hosting สำเร็จแล้ว!")

if __name__ == '__main__':
    main()
