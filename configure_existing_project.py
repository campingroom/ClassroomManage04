#!/usr/bin/env python3
import os
import subprocess
import json

BASE = os.path.dirname(os.path.abspath(__file__))

def run_cmd(args):
    print(f"👉 Running: {' '.join(args)}")
    env = os.environ.copy()
    env["PATH"] = "/usr/local/bin:" + env.get("PATH", "")
    res = subprocess.run(args, capture_output=True, text=True, env=env)
    if res.returncode != 0:
        print(f"❌ Error: {res.stderr.strip()}")
    return res

def main():
    project_id = "campproject-classroom04"
    print(f"🌟 เริ่มต้นตั้งค่าสำหรับโปรเจกต์เดิม: {project_id}...")
    
    # 1. Create Web App
    print(f"\n1. กำลังสร้าง Web App ในโปรเจกต์...")
    res = run_cmd([
        'npx', '-y', 'firebase-tools@latest', 
        'apps:create', 'WEB', 'camp-classroom04', 
        '--project', project_id
    ])
    
    # If app already exists, we will continue to fetch the config
    if res.returncode != 0 and "already exists" not in res.stderr:
        print("⚠️ เกิดความคลาดเคลื่อนในการสร้างแอป (อาจมีแอปอยู่แล้ว จะดำเนินการดึงค่าต่อ)")
    
    # 2. Get SDK configuration
    print(f"\n2. กำลังดึงข้อมูลการเชื่อมต่อ (SDK Config)...")
    res = run_cmd([
        'npx', '-y', 'firebase-tools@latest', 
        'apps:sdkinfo', 'WEB', 
        '--project', project_id, 
        '--json'
    ])
    if res.returncode != 0:
        print("❌ ไม่สามารถดึง SDK Config ได้")
        return
        
    try:
        data = json.loads(res.stdout)
        sdk_config = data.get('result', {}).get('sdkConfig')
        if not sdk_config:
            print("❌ ไม่พบข้อมูล sdkConfig ในผลลัพธ์")
            return
            
        # Write config to firebase_config.json
        config_path = os.path.join(BASE, 'firebase_config.json')
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(sdk_config, f, indent=2)
        print(f"✓ บันทึกไฟล์ตั้งค่าเชื่อมต่อที่: {config_path}")
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการแกะข้อมูล: {e}")
        return
        
    # 3. Update .firebaserc with the project ID
    rc_path = os.path.join(BASE, '.firebaserc')
    rc_data = {"projects": {"default": project_id}}
    with open(rc_path, 'w') as f:
        json.dump(rc_data, f, indent=2)
    print(f"✓ อัปเดตไฟล์ .firebaserc เป็น {project_id} เรียบร้อย")

    # 4. Rebuild and Deploy
    print("\n3. กำลังคอมไพล์และอัปโหลดข้อมูลไปยังโฮสติ้งใหม่...")
    deploy_script = os.path.join(BASE, 'deploy_firebase.py')
    res = subprocess.run(['python3', deploy_script])
    if res.returncode != 0:
        print("❌ การคอมไพล์หรืออัปโหลดล้มเหลว")
        return
        
    print(f"\n🎉 ตั้งค่าระบบ Firebase และอัปโหลดขึ้นโฮสติ้ง {project_id} เรียบร้อยแล้ว!")
    print(f"👉 เว็บไซต์ใช้งานจริงใหม่ของคุณคือ: https://{project_id}.web.app")
    print(f"👉 หน้าควบคุม (Console): https://console.firebase.google.com/project/{project_id}/overview")

if __name__ == '__main__':
    main()
