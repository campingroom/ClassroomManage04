#!/bin/bash
cd "$(dirname "$0")"
python3 setup_database.py
echo ""
read -p "กด [Enter] เพื่อปิดหน้าต่างนี้..."
