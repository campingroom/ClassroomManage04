#!/usr/bin/env python3
import os
import shutil
import subprocess

BASE = os.path.dirname(os.path.abspath(__file__))

def run_cmd(args):
    env = os.environ.copy()
    env["PATH"] = "/usr/local/bin:" + env.get("PATH", "")
    return subprocess.run(args, capture_output=True, text=True, env=env)

def main():
    print("🚀 เริ่มการจัดเตรียมระบบสำหรับ Cloudflare Pages...")
    
    # 1. Check if logged in to Wrangler
    res = run_cmd(['npx', 'wrangler', 'whoami'])
    if "Not logged in" in res.stdout or "Not logged in" in res.stderr or "not logged in" in res.stdout.lower():
        print("\n❌ ยังไม่ได้เข้าสู่ระบบ Cloudflare (Wrangler CLI)!")
        print("👉 กรุณาเปิด Terminal ของคุณในโฟลเดอร์โปรเจกต์นี้ แล้วรันคำสั่ง:")
        print("   npx wrangler login")
        print("\nเมื่อล็อกอินสำเร็จแล้ว ให้รันสคริปต์นี้ใหม่อีกครั้งครับ\n")
        return

    # 2. Setup public directory for multi-file deployment (Non-standalone)
    print("\n📦 กำลังคัดลอกไฟล์แอปพลิเคชันเวอร์ชันดั้งเดิม (Multi-file) ไปยังโฟลเดอร์ public...")
    public_dir = os.path.join(BASE, 'public')
    if os.path.exists(public_dir):
        try:
            shutil.rmtree(public_dir)
        except Exception as e:
            print(f"  ⚠️ ไม่สามารถลบโฟลเดอร์ public เดิมได้ (อาจติดสิทธิ์ TCC): {e}")
            
    os.makedirs(public_dir, exist_ok=True)

    # List of individual files to copy
    files_to_copy = ['index.html', 'style.css', 'app.js']
    for file_name in files_to_copy:
        src = os.path.join(BASE, file_name)
        dst = os.path.join(public_dir, file_name)
        if os.path.exists(src):
            try:
                # Direct read & write to bypass potential TCC metadata copy locks
                with open(src, 'r', encoding='utf-8') as sf:
                    content = sf.read()
                with open(dst, 'w', encoding='utf-8') as df:
                    df.write(content)
                print(f"  ✓ คัดลอก {file_name}")
            except Exception as e:
                print(f"  ⚠️ ไม่สามารถคัดลอก {file_name}: {e}")

    # Copy modules folder
    modules_src = os.path.join(BASE, 'modules')
    modules_dst = os.path.join(public_dir, 'modules')
    if os.path.exists(modules_src):
        os.makedirs(modules_dst, exist_ok=True)
        for item in os.listdir(modules_src):
            s = os.path.join(modules_src, item)
            d = os.path.join(modules_dst, item)
            if os.path.isfile(s) and s.endswith('.js'):
                try:
                    with open(s, 'r', encoding='utf-8') as sf:
                        content = sf.read()
                    with open(d, 'w', encoding='utf-8') as df:
                        df.write(content)
                    print(f"  ✓ คัดลอก modules/{item}")
                except Exception as e:
                    print(f"  ⚠️ ไม่สามารถคัดลอก modules/{item}: {e}")

    # 3. Deploy to Cloudflare Pages
    print("\n⚡ กำลังอัปโหลดข้อมูลไปยัง Cloudflare Pages...")
    
    # Run wrangler deploy command
    # Note: Wrangler automatically uses project name from wrangler.toml
    deploy_process = subprocess.run([
        'npx', 'wrangler', 'pages', 'deploy', 'public'
    ])
    
    if deploy_process.returncode != 0:
        print("\n❌ การอัปโหลดล้มเหลว")
    else:
        print("\n🎉 อัปโหลดและเปิดใช้งานบน Cloudflare Pages สำเร็จแล้ว!")

if __name__ == '__main__':
    main()
