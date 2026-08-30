import os

# Source is the project root
BASE = os.path.dirname(os.path.abspath(__file__))
public_dir = os.path.join(BASE, 'public')
os.makedirs(public_dir, exist_ok=True)

# Copy individual files
files = ['index.html', 'style.css', 'app.js']
for file_name in files:
    src = os.path.join(BASE, file_name)
    dst = os.path.join(public_dir, file_name)
    if os.path.exists(src):
        try:
            with open(src, 'r', encoding='utf-8') as sf:
                content = sf.read()
            with open(dst, 'w', encoding='utf-8') as df:
                df.write(content)
            print(f"Synced {file_name}")
        except Exception as e:
            print(f"Error copying {file_name}: {e}")

# Copy modules
src_mod = os.path.join(BASE, 'modules')
dst_mod = os.path.join(public_dir, 'modules')
os.makedirs(dst_mod, exist_ok=True)
if os.path.exists(src_mod):
    for item in os.listdir(src_mod):
        s = os.path.join(src_mod, item)
        d = os.path.join(dst_mod, item)
        if os.path.isfile(s) and s.endswith('.js'):
            try:
                with open(s, 'r', encoding='utf-8') as sf:
                    content = sf.read()
                with open(d, 'w', encoding='utf-8') as df:
                    df.write(content)
                print(f"Synced modules/{item}")
            except Exception as e:
                print(f"Error copying modules/{item}: {e}")
