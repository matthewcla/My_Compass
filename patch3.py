import re

with open('components/dashboard/StatusCard.tsx', 'r') as f:
    content = f.read()

def replace_gaining_command(match):
    varname = match.group(1)
    fallback = match.group(2)
    return f"""const {varname} = activeOrder?.gainingCommand.name || '{fallback}';
            const {varname}HomePort = activeOrder?.gainingCommand.homePort;"""

# First, fix the logic extracting the variables
content = re.sub(
    r'const ([a-zA-Z0-9_]+)Name = activeOrder\?\.gainingCommand\.name \|\| \'([^\']+)\';\n\s*const homePort = activeOrder\?\.gainingCommand\.homePort;\n\s*const \1 = homePort \? `\$\{\1Name\} \(\$\{homePort\}\)` : \1Name;',
    replace_gaining_command,
    content
)

# Also fix the patch2 output if it was run
content = re.sub(
    r'const ([a-zA-Z0-9_]+)Name = activeOrder\?\.gainingCommand\.name \|\| \'([^\']+)\';\n\s*const homePort = activeOrder\?\.gainingCommand\.homePort;\n\s*const \1 = homePort \? `\$\{\1Name\} • \$\{homePort\}` : \1Name;',
    replace_gaining_command,
    content
)

# Now, update the JSX to render two <Detail> components if homePort exists
def replace_jsx(match):
    varname = match.group(1)
    return f"""<View className="flex-1 flex-col gap-0.5">
                                        <Headline color={match.group(2) if match.group(2) else ""}>{match.group(3)}</Headline>
                                        <Detail>{{{varname}}}</Detail>
                                        {{{varname}HomePort && (
                                            <Detail color="text-slate-500 dark:text-slate-400 font-[400] text-[12px] opacity-70">
                                                {{{varname}HomePort}}
                                            </Detail>
                                        )}}
                                    </View>"""

content = re.sub(
    r'<View className="flex-1">\n\s*<Headline(?: color=("[^"]+"))?>([^<]+)</Headline>\n\s*<Detail>\{([a-zA-Z0-9_]+)\}</Detail>\n\s*</View>',
    lambda m: f"""<View className="flex-1 flex-col justify-center gap-[2px]">
                                        <Headline{f' color={m.group(1)}' if m.group(1) else ''}>{m.group(2)}</Headline>
                                        <View>
                                            <Detail>{{{m.group(3)}}}</Detail>
                                            {{{m.group(3)}HomePort && (
                                                <Text className="text-slate-500 dark:text-slate-500 font-[400] text-[12px] opacity-80" numberOfLines={{1}}>
                                                    {{{m.group(3)}HomePort}}
                                                </Text>
                                            )}}
                                        </View>
                                    </View>""",
    content
)

with open('components/dashboard/StatusCard.tsx', 'w') as f:
    f.write(content)
