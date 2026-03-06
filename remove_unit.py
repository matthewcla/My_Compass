import re

with open('components/dashboard/StatusCard.tsx', 'r') as f:
    content = f.read()

# 1. Remove the variable declarations
def remove_declarations(match):
    return ""

content = re.sub(
    r'\s+const ([a-zA-Z0-9_]+) = activeOrder\?\.gainingCommand\.name \|\| \'([^\']+)\';\n\s*const \1HomePort = activeOrder\?\.gainingCommand\.homePort;',
    remove_declarations,
    content
)

# 2. Update the JSX to remove the unit and homeport details
# Previous block was:
# <View className="flex-1 flex-col justify-center gap-[2px]">
#    <Headline...>...</Headline>
#    <View>
#        <Detail>{varname}</Detail>
#        {varnameHomePort && (
#             <Text ...>
#                 {varnameHomePort}
#             </Text>
#        )}
#    </View>
# </View>

# Or it might just be the old:
# <View className="flex-1">
#    <Headline...>...</Headline>
#    <Detail>{varname}</Detail>
# </View>

# First, fix the newer complex one:
content = re.sub(
    r'<View className="flex-1 flex-col justify-center gap-\[2px\]">\n\s*<Headline([^>]*)>([^<]+)</Headline>\n\s*<View>\n\s*<Detail>\{([a-zA-Z0-9_]+)\}</Detail>\n\s*\{\3HomePort && \(\n\s*<Text[^>]*>\n\s*\{\3HomePort\}\n\s*</Text>\n\s*\)\}\n\s*</View>\n\s*</View>',
    r'<View className="flex-1">\n                                        <Headline\1>\2</Headline>\n                                    </View>',
    content
)

# Also fix the simple one if it exists
content = re.sub(
    r'<View className="flex-1">\n\s*<Headline([^>]*)>([^<]+)</Headline>\n\s*<Detail>\{([a-zA-Z0-9_]+)\}</Detail>\n\s*</View>',
    r'<View className="flex-1">\n                                        <Headline\1>\2</Headline>\n                                    </View>',
    content
)


with open('components/dashboard/StatusCard.tsx', 'w') as f:
    f.write(content)
