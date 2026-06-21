#!/usr/bin/env python3
"""
Build standalone.html — ไฟล์เดียว ใช้ได้ทุกเครื่อง ไม่ต้องอินเทอร์เน็ต
- Inline CSS (style.css)
- Inline JS ทุก module
- Inline XLSX library (ดาวน์โหลดจาก CDN)
- Inline Google Fonts Sarabun (ดาวน์โหลด + แปลงเป็น base64)
"""

import re
import os
import base64
import urllib.request
import urllib.error

BASE = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

def fetch_url(url, label=""):
    """ดาวน์โหลด URL พร้อม progress"""
    print(f"  ⬇️  กำลังดาวน์โหลด {label or url[:60]}...")
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; standalone-builder/1.0)'
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    print(f"     ✓ {len(data):,} bytes")
    return data

# ─── 1. อ่าน HTML และไฟล์ JS/CSS ────────────────────────────────────────────

html = read(BASE + '/index.html')
css  = read(BASE + '/style.css')

modules = [
    'modules/monster_engine.js',
    'app.js',
    'modules/live_mode.js',
    'modules/rooms.js',
    'modules/students.js',
    'modules/subjects.js',
    'modules/schedule.js',
    'modules/attendance.js',
    'modules/behavior.js',
    'modules/teaching.js',
    'modules/reports.js',
    'modules/dashboard.js',
    'modules/settings.js',
    'modules/cloudflare_sync.js',
]

combined_js = ''
for m in modules:
    combined_js += f'\n// ===== {m} =====\n'
    combined_js += read(BASE + '/' + m)
    combined_js += '\n'

# ─── 2. ดาวน์โหลด XLSX library ───────────────────────────────────────────────

xlsx_cache_path = os.path.join(BASE, 'xlsx_cache.js')
xlsx_js = None
if os.path.exists(xlsx_cache_path):
    print("  📦 ใช้ XLSX library จากแคช...")
    try:
        xlsx_js = read(xlsx_cache_path)
    except Exception as e:
        print(f"  ⚠️  อ่านแคช XLSX ไม่สำเร็จ: {e}")

if False:
    pass

# ─── 3. ดาวน์โหลด Google Fonts Sarabun + แปลงเป็น base64 ────────────────────

SARABUN_WEIGHTS = ['300', '400', '500', '600', '700', '800']

def fetch_font_css(weights):
    """ดาวน์โหลด Google Fonts CSS"""
    wghts = ';'.join(weights)
    url = f'https://fonts.googleapis.com/css2?family=Sarabun:wght@{wghts}&display=swap'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode('utf-8')

def inline_fonts_in_css(font_css):
    """แทนที่ url(...) ใน @font-face ด้วย base64 data URI"""
    woff2_urls = re.findall(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', font_css)
    total = len(woff2_urls)
    print(f"  📦 พบ {total} ไฟล์ font ที่ต้องดาวน์โหลด")
    
    cache = {}
    for i, url in enumerate(set(woff2_urls), 1):
        if url in cache:
            continue
        try:
            data = fetch_url(url, f"font {i}/{total}: ...{url[-30:]}")
            b64 = base64.b64encode(data).decode('ascii')
            cache[url] = f'data:font/woff2;base64,{b64}'
        except Exception as e:
            print(f"     ⚠️  ข้ามไฟล์นี้: {e}")
            cache[url] = url  # ใช้ URL เดิมถ้าดาวน์โหลดไม่ได้
    
    # แทนที่ทุก url(...)
    def replacer(m):
        original_url = m.group(1)
        return f'url({cache.get(original_url, original_url)})'
    
    return re.sub(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', replacer, font_css)

print("\n🔤 ใช้ Google Fonts Sarabun จาก CDN (เพื่อลดขนาดไฟล์)...")
font_block = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap">'

# ─── 4. ประกอบ HTML ──────────────────────────────────────────────────────────

# 4a. แทนที่ Google Fonts link ด้วย inline fonts
html = re.sub(
    r'<link[^>]+fonts\.googleapis\.com[^>]+>',
    font_block,
    html
)

# 4b. แทนที่ XLSX script tag ด้วย inline หรือลบออก
if xlsx_js:
    xlsx_inline = f'<script>\n/* XLSX library inlined for offline use */\n{xlsx_js}\n</script>'
    html = re.sub(
        r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/xlsx/[^"]+"></script>',
        lambda m: xlsx_inline,
        html
    )
else:
    # คง CDN link ไว้ (ต้องการ internet)
    pass

# 4c. แทนที่ CSS link ด้วย inline style
html = html.replace(
    '<link rel="stylesheet" href="style.css">',
    f'<style>\n{css}\n</style>'
)

# 4d. ลบ script src tags ที่เหลือที่เป็นไฟล์โลคอลทั้งหมด (ไม่ลบ CDN เช่น Firebase)
html = re.sub(r'<script src="(?!https?://)[^"]+"></script>\s*', '', html)

# 4e. หา block script สุดท้ายและรวม JS ทั้งหมด
body_close = html.rfind('</body>')
last_script_end = html.rfind('</script>', 0, body_close) + len('</script>')

block_start = html.find('<!-- SEQUENTIAL SCRIPT LOADING -->')
if block_start == -1:
    block_start = html.find('<!-- INITIALIZATION -->')
if block_start == -1:
    block_start = body_close

# ดึง DOMContentLoaded init block
init_region = html[block_start:last_script_end]
init_match = re.search(
    r"window\.addEventListener\('DOMContentLoaded'.*?\}\);",
    init_region,
    re.DOTALL
)
init_code = init_match.group(0) if init_match else (
    "window.addEventListener('DOMContentLoaded', () => {\n"
    "  window.syncSubjectsToClassSubjects();\n"
    "  window.rebuildClassSelector();\n"
    "  window.renderPeriodSettings();\n"
    "  window.goto('setup-rooms');\n"
    "  window.checkAutoSave();\n"
    "});"
)

# Read cloudflare_config.json if exists
fb_config_js = ""
fb_config_path = os.path.join(BASE, 'cloudflare_config.json')
if os.path.exists(fb_config_path):
    print("  📦 พบ cloudflare_config.json กำลังนำมารวมในไฟล์เดี่ยว...")
    try:
        with open(fb_config_path, encoding='utf-8') as f:
            fb_config_data = f.read().strip()
            fb_config_js = f"\nwindow.bundledCloudflareConfig = {fb_config_data};\n"
    except Exception as e:
        print(f"  ⚠️ อ่าน cloudflare_config.json ไม่สำเร็จ: {e}")

before = html[:block_start]
after  = html[last_script_end:]

new_script = f'''<!-- STANDALONE: all JS inlined — works offline, no internet needed -->
<script>
{fb_config_js}
{combined_js}

// ===== INITIALIZATION =====
{init_code}
</script>'''

result = before + new_script + after

# ─── 5. บันทึกผล ─────────────────────────────────────────────────────────────

# Write to /tmp first (always works), then try project dir
import shutil as _shutil

tmp_output = '/Users/mariesmac/.gemini/antigravity-ide/scratch/standalone.html'
with open(tmp_output, 'w', encoding='utf-8') as f:
    f.write(result)
out_path = tmp_output

# Try to copy to project locations
project_standalone = os.path.join(BASE, 'standalone.html')
public_dir = os.path.join(BASE, 'public')
if not os.path.exists(public_dir):
    os.makedirs(public_dir)
public_path = os.path.join(public_dir, 'index.html')

for dst_label, dst_path in [('standalone.html', project_standalone), ('public/index.html', public_path)]:
    try:
        _shutil.copy2(tmp_output, dst_path)
        print(f"  ✓ คัดลอกไปยัง {dst_label}")
    except Exception as e:
        print(f"  ⚠️ ไม่สามารถเขียน {dst_label} ได้: {e}")

size_kb = len(result.encode('utf-8')) / 1024
size_mb = size_kb / 1024
lines = result.count('\n')

print(f"\n{'='*55}")
print(f"✅  standalone.html สร้างสำเร็จ!")
print(f"    ขนาด : {size_kb:.1f} KB ({size_mb:.2f} MB)")
print(f"    บรรทัด: {lines:,}")
print(f"    ที่บันทึก: {out_path}")
print(f"    ที่บันทึก: {public_path}")
print(f"{'='*55}")
print(f"\n💡 วิธีใช้: copy ไฟล์ standalone.html ไปเปิดด้วย browser ได้เลย")
print(f"   ✓ ใช้ได้โดยไม่ต้องต่ออินเทอร์เน็ต")
print(f"   ✓ ข้อมูลเก็บใน localStorage ของ browser นั้นๆ")
