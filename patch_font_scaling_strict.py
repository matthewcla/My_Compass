import re
import glob

files = glob.glob('components/**/*.tsx', recursive=True)
count = 0
for file in files:
    with open(file, 'r') as f:
        content = f.read()
        
    def replacer(match):
        tag_content = match.group(1)
        if 'adjustsFontSizeToFit' not in tag_content and ('text-[20px]' in tag_content or 'Headline' in file):
             if 'numberOfLines={1}' in tag_content or 'numberOfLines={2}' in tag_content:
                 return f"<Text{tag_content} adjustsFontSizeToFit minimumFontScale={{0.9}}>"
             elif 'text-[20px]' in tag_content:
                 return f"<Text{tag_content} numberOfLines={{1}} adjustsFontSizeToFit minimumFontScale={{0.9}}>"
        return match.group(0)

    patched_content = re.sub(r'<Text([^>]*?text-\[20px\][^>]*?)>', replacer, content)
    
    if 'function Headline' in patched_content:
       patched_content = re.sub(
           r'(function Headline[^{]*{[^<]*<Text[^>]*?)numberOfLines=\{1\}([^>]*?text-\[20px\][^>]*?)>', 
           r'\1numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}\2>', 
           patched_content
       )
       patched_content = re.sub(
           r'(function Headline[^{]*{[^<]*<Text([^>]*?)text-\[20px\]([^>]*?)>)', 
           lambda m: m.group(1) if 'adjustsFontSizeToFit' in m.group(1) else f"<Text{m.group(2)}text-[20px]{m.group(3)} numberOfLines={{1}} adjustsFontSizeToFit minimumFontScale={{0.9}}>", 
           patched_content
       )

    if patched_content != content:
        with open(file, 'w') as f:
            f.write(patched_content)
        count += 1
        print(f"Patched {file}")

print(f"Total files patched with strict font scaling: {count}")
