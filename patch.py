import re

with open('components/dashboard/StatusCard.tsx', 'r') as f:
    content = f.read()

# 1. Update gaining commands
def replace_gaining_command(match):
    varname = match.group(1)
    fallback = match.group(2)
    return f"""const {varname}Name = activeOrder?.gainingCommand.name || '{fallback}';
            const homePort = activeOrder?.gainingCommand.homePort;
            const {varname} = homePort ? `${{{varname}Name}} (${{homePort}})` : {varname}Name;"""

content = re.sub(
    r'const ([a-zA-Z0-9_]+) = activeOrder\?\.gainingCommand\.name \|\| \'([^\']+)\';',
    replace_gaining_command,
    content
)

# 2. Remove bottom parts starting with mt-4
# They look like:
#                             <View className="mt-4 flex-row items-end justify-between">
#                               ...
#                             </View>
#                         </View>
# The regex finds the mt-4 view and everything up to its closing </View> followed by </View> for the px-5 py-5 container.
def remove_bottom_row(match):
    return '\n                        </View>'

content = re.sub(
    r'\n\s*<View className="mt-4 flex-row items-end justify-between">.*?</View>\n\s*</View>',
    remove_bottom_row,
    content,
    flags=re.DOTALL
)

# 3. Remove CTAButton and ProgressDots
content = re.sub(
    r'\n\nfunction CTAButton[\s\S]*?(?=\Z)',
    '\n',
    content
)

with open('components/dashboard/StatusCard.tsx', 'w') as f:
    f.write(content)
