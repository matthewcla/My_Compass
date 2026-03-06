import re

with open('components/dashboard/StatusCard.tsx', 'r') as f:
    content = f.read()

# 1. Remove daysOnStation Pill from welcome-aboard
content = re.sub(
    r'\s+<Pill bg="bg-green-100 dark:bg-green-900/40" border="border-green-200 dark:border-green-700/50">\n\s*<PillText color="text-green-800 dark:text-green-200">Day \{daysOnStation\}</PillText>\n\s*</Pill>',
    '',
    content
)

# 2. Remove daysToReport blocks
content = re.sub(
    r'\s*\{daysToReport !== null && \(\n\s*<View className="flex-row items-baseline gap-1">\n\s*<Text className="[^"]+">\{daysToReport\}</Text>\n\s*<Text className="[^"]+">Days</Text>\n\s*</View>\n\s*\)\}',
    '',
    content
)

# 2b. The complex urgencyColor daysToReport block in plan-move
content = re.sub(
    r'\s*\{daysToReport !== null && \(\n\s*<View className="flex-row items-baseline gap-1">\n\s*<Text className=\{`\$\{urgencyColor\.num\}[^`]*`\}>\{daysToReport\}</Text>\n\s*<Text className=\{`\$\{urgencyColor\.label\}[^`]*`\}>Days</Text>\n\s*</View>\n\s*\)\}',
    '',
    content
)

# 3. Remove procEstDate Pill from processing
content = re.sub(
    r'\s*<Pill bg="bg-stone-100 dark:bg-stone-800/60" border="border-stone-200 dark:border-stone-600/50">\n\s*<PillText color="text-stone-700 dark:text-stone-300">\n\s*\{procEstDate \? `Est\. \$\{new Date\(procEstDate\)\.toLocaleDateString\(\)\}` : \'Pending\'\}\n\s*</PillText>\n\s*</Pill>',
    '',
    content
)

# 4. Remove daysUntilClose from negotiation
content = re.sub(
    r'\s*\{daysUntilClose !== null && \(\n\s*<View className="flex-row items-baseline gap-1">\n\s*<Text className="text-amber-950 dark:text-white text-3xl font-black font-mono tracking-tighter">\{daysUntilClose\}</Text>\n\s*<Text className="text-amber-700 dark:text-amber-400 text-\[11px\] font-bold uppercase tracking-wider">Days</Text>\n\s*</View>\n\s*\)\}',
    '',
    content
)

with open('components/dashboard/StatusCard.tsx', 'w') as f:
    f.write(content)
