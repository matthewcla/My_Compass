import re
import glob
import os

files = glob.glob('components/**/*.tsx', recursive=True)
count = 0
for file in files:
    with open(file, 'r') as f:
        content = f.read()
        
    if 'text-[22px]' in content:
        new_content = content.replace('text-[22px]', 'text-[20px]')
        with open(file, 'w') as f:
            f.write(new_content)
        count += 1
        print(f"Patched {file}")
print(f"Total files patched: {count}")
