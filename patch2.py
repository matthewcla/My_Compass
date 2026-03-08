import re

with open('components/dashboard/StatusCard.tsx', 'r') as f:
    content = f.read()

def replace_gaining_command(match):
    varname = match.group(1)
    fallback = match.group(2)
    return f"""const {varname}Name = activeOrder?.gainingCommand.name || '{fallback}';
            const homePort = activeOrder?.gainingCommand.homePort;
            const {varname} = homePort ? `${{{varname}Name}} • ${{homePort}}` : {varname}Name;"""

content = re.sub(
    r'const ([a-zA-Z0-9_]+)Name = activeOrder\?\.gainingCommand\.name \|\| \'([^\']+)\';\n\s*const homePort = activeOrder\?\.gainingCommand\.homePort;\n\s*const \1 = homePort \? `\$\{\1Name\} \(\$\{homePort\}\)` : \1Name;',
    replace_gaining_command,
    content
)

with open('components/dashboard/StatusCard.tsx', 'w') as f:
    f.write(content)
