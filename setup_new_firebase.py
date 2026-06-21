#!/usr/bin/env python3
import os
import random
import subprocess
import json

BASE = os.path.dirname(os.path.abspath(__file__))

def run_cmd(args):
    print(f"👉 Running: {' '.join(args)}")
    res = subprocess.run(args, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"❌ Error: {res.stderr.strip()}")
    return res

def main():
    print("🌟 เริ่มต้นขั้นตอนการสร้างและตั้งค่าระบบ Firebase ใหม่...")
    
    # 1. Generate a unique project ID
    rand_suffix = random.randint(10000, 99999)
    project_id = f"camp-classrm-{rand_suffix}"
    display_name = f"Classroom Manage {rand_suffix}"
    
    print(f"\n1. กำลังสร้างโปรเจกต์ Firebase ID: {project_id}...")
    res = run_cmd(['npx', '-y', 'firebase-tools@latest', 'projects:create', project_id, '--display-name', display_name])
    if res.returncode != 0:
        print("❌ ไม่สามารถสร้างโปรเจกต์ใหม่ได้")
        return
        
    print(f"✓ สร้างโปรเจกต์ {project_id} สำเร็จ!")
    
    # 2. Create default Firestore database
    # Location asia-northeast1 (Tokyo) is close to Thailand and free-tier eligible.
    print(f"\n2. กำลังสร้างฐานข้อมูล Firestore ในภูมิภาค asia-northeast1...")
    res = run_cmd([
        'npx', '-y', 'firebase-tools@latest', 
        'firestore:databases:create', '(default)', 
        '--location', 'asia-northeast1', 
        '--type', 'FIRESTORE_ONLY', 
        '--delete-protection', 'DISABLED', 
        '--project', project_id
    ])
    if res.returncode != 0:
        print("❌ ไม่สามารถสร้างฐานข้อมูล Firestore ได้")
        return
    print("✓ สร้างฐานข้อมูล Firestore สำเร็จ!")
    
    # 3. Create Web App
    print(f"\n3. กำลังสร้าง Web App ในโปรเจกต์...")
    res = run_cmd([
        'npx', '-y', 'firebase-tools@latest', 
        'apps:create', 'WEB', 'camp-classroom04', 
        '--project', project_id
    ])
    if res.returncode != 0:
        print("❌ ไม่สามารถสร้าง Web App ได้")
        return
    print("✓ สร้าง Web App สำเร็จ!")
    
    # 4. Get SDK configuration
    print(f"\n4. กำลังดึงข้อมูลการเชื่อมต่อ (SDK Config)...")
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
        
    # 5. Update .firebaserc with new project ID
    rc_path = os.path.join(BASE, '.firebaserc')
    rc_data = {"projects": {"default": project_id}}
    with open(rc_path, 'w') as f:
        json.dump(rc_data, f, indent=2)
    print(f"✓ อัปเดตไฟล์ .firebaserc เป็นโปรเจกต์ใหม่เรียบร้อย")

    # 6. Rebuild and Deploy
    print("\n5. กำลังคอมไพล์และอัปโหลดข้อมูลไปยังโฮสติ้งใหม่...")
    deploy_script = os.path.join(BASE, 'deploy_firebase.py')
    # Run the deploy script locally (will run within the same script context)
    import deploy_firebase
    # Hack deploy_firebase active_project or just run it via subprocess
    res = subprocess.run(['python3', deploy_script])
    if res.returncode != 0:
        print("❌ การคอมไพล์หรืออัปโหลดล้มเหลว")
        return
        
    print(f"\n🎉 ตั้งค่าระบบ Firebase ใหม่และอัปโหลดขึ้นโฮสติ้งเรียบร้อยแล้ว!")
    print(f"👉 เว็บไซต์ใช้งานจริงใหม่ของคุณคือ: https://{project_id}.web.app")
    print(f"👉 หน้าควบคุม (Console): https://console.firebase.google.com/project/{project_id}/overview")

if __name__ == '__main__':
    main()
