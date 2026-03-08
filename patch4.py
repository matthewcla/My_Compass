import re

with open('components/dashboard/StatusCard.tsx', 'r') as f:
    content = f.read()

def replace_gaining_command(match):
    varname = match.group(1)
    fallback = match.group(2)
    return f"""const {varname} = activeOrder?.gainingCommand.name || '{fallback}';
            const {varname}HomePort = activeOrder?.gainingCommand.homePort;"""

# Fix the regex to match the exact spacing in the current StatusCard.tsx
# In StatusCard.tsx currently:
#             const gainingCommandName = activeOrder?.gainingCommand.name || 'Gaining Command';
#             const homePort = activeOrder?.gainingCommand.homePort;
#             const gainingCommand = homePort ? `${gainingCommandName} (${homePort})` : gainingCommandName;

content = re.sub(
    r'const ([a-zA-Z0-9_]+)Name = activeOrder\?\.gainingCommand\.name \|\| \'([^\']+)\';\n\s*const homePort = activeOrder\?\.gainingCommand\.homePort;\n\s*const ([a-zA-Z0-9_]+) = homePort \? `\$\{\1Name\} \(\$\{homePort\}\)` : \1Name;',
    lambda m: f"""const {m.group(3)} = activeOrder?.gainingCommand.name || '{m.group(2)}';
            const {m.group(3)}HomePort = activeOrder?.gainingCommand.homePort;""",
    content
)

# And for patch2 if it somehow executed:
content = re.sub(
    r'const ([a-zA-Z0-9_]+)Name = activeOrder\?\.gainingCommand\.name \|\| \'([^\']+)\';\n\s*const homePort = activeOrder\?\.gainingCommand\.homePort;\n\s*const ([a-zA-Z0-9_]+) = homePort \? `\$\{\1Name\} • \$\{homePort\}` : \1Name;',
    lambda m: f"""const {m.group(3)} = activeOrder?.gainingCommand.name || '{m.group(2)}';
            const {m.group(3)}HomePort = activeOrder?.gainingCommand.homePort;""",
    content
)


# Now, update the JSX to render two <Detail> components if homePort exists
content = re.sub(
    r'<View className="flex-1">\n\s*<Headline(?: color=("[^"]+"))?>([^<]+)</Headline>\n\s*<Detail>\{([a-zA-Z0-9_]+)\}</Detail>\n\s*</View>',
    lambda m: f"""<View className="flex-1 flex-col justify-center gap-[2px]">
                                        <Headline{f' color={m.group(1)}' if m.group(1) else ''}>{m.group(2)}</Headline>
                                        <View>
                                            <Detail>{{{m.group(3)}}}</Detail>
                                            {{{m.group(3)}HomePort && (
                                                <Text className="text-slate-500 dark:text-slate-500 font-[500] text-[12px] opacity-80" numberOfLines={{1}}>
                                                    {{{m.group(3)}HomePort}}
                                                </Text>
                                            )}}
                                        </View>
                                    </View>""",
    content
)

with open('components/dashboard/StatusCard.tsx', 'w') as f:
    f.write(content)
