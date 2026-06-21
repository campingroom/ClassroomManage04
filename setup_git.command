#!/bin/bash
cd "$(dirname "$0")"

echo "=========================================="
echo "🐙 เริ่มต้นตั้งค่า Git และเชื่อมต่อ GitHub"
echo "=========================================="

# 1. Initialize Git
echo "1. กำลังสร้าง Git Local Repository..."
git init

# 2. Config Git local (เฉพาะโปรเจกต์นี้)
git config user.email "campingroom@gmail.com"
git config user.name "campingroom"

# 3. Add and Commit
echo "2. กำลังทำการบันทึกประวัติ (Git Commit)..."
git add .
git commit -m "Initial commit with Cloudflare sync"

echo "✅ บันทึกโค้ดลงในเครื่องเรียบร้อยแล้ว!"
echo ""
echo "------------------------------------------"
echo "📢 ขั้นตอนถัดไปฝั่งคุณครู:"
echo "1. เปิดเว็บเบราว์เซอร์ไปที่ https://github.com/new"
echo "2. สร้าง Repository ใหม่ ตั้งชื่อว่า: ClassroomManage04 (ห้ามติ๊กสร้าง Readme/gitignore)"
echo "3. เมื่อสร้างเสร็จแล้ว ให้กด ENTER ในหน้าจอนี้เพื่อไปต่อ..."
echo "------------------------------------------"

read -p "กด ENTER เมื่อสร้าง Repository บนเว็บ GitHub เรียบร้อยแล้ว..."

echo ""
echo "3. กำลังนำส่งโค้ดขึ้น GitHub (Git Push)..."
git remote add origin https://github.com/campingroom/ClassroomManage04.git
git branch -M main
git push -u origin main

echo ""
echo "=========================================="
echo "🎉 นำโค้ดขึ้น GitHub เรียบร้อยแล้ว!"
echo "คุณครูสามารถกลับไปยังหน้าเว็บ Cloudflare เพื่อรีเฟรชค้นหาห้องเก็บโค้ด ClassroomManage04 ได้เลยครับ"
echo "=========================================="
sleep 5
