#!/bin/bash
cd "$(dirname "$0")"
clear
echo "========================================================="
echo "🏫 Classroom Manager - Local Web Server"
echo "========================================================="
echo "กำลังเปิดเซิร์ฟเวอร์จำลองเพื่อทดลองใช้งาน..."
echo "เปิดเบราว์เซอร์แล้วเข้าใช้งานที่ลิงก์ด้านล่างนี้:"
echo ""
echo "👉 🔗 http://localhost:8080/index.html"
echo ""
echo "💡 สำหรับเชื่อมต่อจาก iPad / iPhone ในวง Wi-Fi เดียวกัน:"
# Get local IP
IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || ipconfig getifaddr ap1 || hostname -I | awk '{print $1}')
if [ ! -z "$IP" ]; then
  echo "👉 🔗 http://$IP:8080/index.html"
else
  echo "👉 🔗 http://[ไอพีเครื่องคอมพิวเตอร์ของคุณ]:8080/index.html"
fi
echo "========================================================="
echo "⚠️ โปรดอย่าปิดหน้าต่าง Terminal นี้ขณะใช้งาน"
echo "💡 กดปุ่ม Ctrl + C บนคีย์บอร์ดเพื่อปิดเซิร์ฟเวอร์"
echo "========================================================="
echo ""
python3 -m http.server 8080
