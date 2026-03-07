import re
import glob
import os

files = glob.glob('components/**/*.tsx', recursive=True)
count = 0
for file in files:
    with open(file, 'r') as f:
        content = f.read()
        
    # Find Text components with text-[20px] and numberOfLines={1}
    # that do not already have adjustsFontSizeToFit
    # We'll use a regex that matches the opening tag of a Text component containing text-[20px]
    
    modified = False
    new_content = ""
    
    # We will look for <Text ... text-[20px] ... > and inject adjustsFontSizeToFit minimumFontScale={0.85}
    # It might be spread across lines, but usually it's on one line.
    
    def replacer(match):
        tag_content = match.group(1)
        if 'adjustsFontSizeToFit' not in tag_content and ('text-[20px]' in tag_content or 'Headline' in file):
             # Ensure we also have numberOfLines={1} to warrant scaling
             if 'numberOfLines={1}' in tag_content or 'numberOfLines={2}' in tag_content:
                 # It already has numberOfLines, just add the scaling props
                 return f"<Text{tag_content} adjustsFontSizeToFit minimumFontScale={{0.85}}>"
             elif 'text-[20px]' in tag_content:
                 # Add numberOfLines and scaling props
                 return f"<Text{tag_content} numberOfLines={{1}} adjustsFontSizeToFit minimumFontScale={{0.85}}>"
        return match.group(0)

    # Replace in <Text ...> tags
    patched_content = re.sub(r'<Text([^>]*?text-\[20px\][^>]*?)>', replacer, content)
    
    # Also handle custom Headline components if they exist and wrap Text
    if 'function Headline' in patched_content:
       patched_content = re.sub(
           r'(function Headline[^{]*{[^<]*<Text[^>]*?)numberOfLines=\{1\}([^>]*?text-\[20px\][^>]*?)>', 
           r'\1numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}\2>', 
           patched_content
       )
       patched_content = re.sub(
           r'(function Headline[^{]*{[^<]*<Text([^>]*?)text-\[20px\]([^>]*?)>)', 
           lambda m: m.group(1) if 'adjustsFontSizeToFit' in m.group(1) else f"<Text{m.group(2)}text-[20px]{m.group(3)} numberOfLines={{1}} adjustsFontSizeToFit minimumFontScale={{0.85}}>", 
           patched_content
       )

    if patched_content != content:
        with open(file, 'w') as f:
            f.write(patched_content)
        count += 1
        print(f"Patched {file}")

print(f"Total files patched for font scaling: {count}")
