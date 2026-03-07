import re
import glob

files = glob.glob('components/**/*.tsx', recursive=True)
count = 0
for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # Revert adjustsFontSizeToFit minimumFontScale={0.85}
    if 'adjustsFontSizeToFit minimumFontScale={0.85}' in content:
        new_content = content.replace(' adjustsFontSizeToFit minimumFontScale={0.85}', '')
        if 'adjustsFontSizeToFit' in new_content:
            new_content = new_content.replace(' adjustsFontSizeToFit', '')
        
        with open(file, 'w') as f:
            f.write(new_content)
        count += 1
        print(f"Reverted {file}")

print(f"Total files reverted for font scaling: {count}")
