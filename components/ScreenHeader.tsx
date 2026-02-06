import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SearchConfig } from '@/store/useHeaderStore';
import { Search } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
    title: string;
    subtitle: string | React.ReactNode;
    rightAction?: { icon: any; onPress: () => void } | null;
    withSafeArea?: boolean;
    variant?: 'large' | 'inline';
    searchConfig?: SearchConfig | null;
}

export function ScreenHeader({
    title,
    subtitle,
    rightAction,
    withSafeArea = true,
    variant = 'large',
    searchConfig
}: ScreenHeaderProps) {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const isInline = variant === 'inline';
    const searchInputRef = React.useRef<TextInput>(null);

    return (
        <View className="z-50 bg-gray-100 dark:bg-black">
            <View
                style={{
                    paddingTop: (withSafeArea ? Math.max(insets.top, 20) : 0) + (isInline ? 8 : 12),
                    paddingHorizontal: 16,
                    paddingBottom: isInline ? 8 : 12
                }}
                className={`flex-row justify-between items-center relative z-50`}
            >
                <View className="flex-row items-center flex-1 mr-4">
                    <View className={isInline ? "flex-row items-baseline gap-2" : ""}>
                        {title ? (
                            <Text className={`${isInline ? 'text-lg' : 'text-2xl'} font-black text-slate-900 dark:text-white uppercase tracking-tight`}>
                                {title}
                            </Text>
                        ) : null}
                        {subtitle ? (
                            <Text className={`text-blue-700 dark:text-blue-100 font-bold uppercase tracking-widest ${isInline ? 'text-[10px]' : 'text-sm mt-1'}`}>
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                </View>

                <View className="flex-row items-center gap-4">
                    {rightAction && (
                        <Pressable
                            onPress={rightAction.onPress}
                            hitSlop={12}
                        >
                            {({ pressed }) => {
                                const Icon = rightAction.icon;
                                return (
                                    <Icon
                                        color={colors.text}
                                        size={isInline ? 20 : 24}
                                        strokeWidth={2}
                                        style={{ opacity: pressed ? 0.7 : 1 }}
                                    />
                                );
                            }}
                        </Pressable>
                    )}
                </View>
            </View>

            {searchConfig && searchConfig.visible && (
                <View className="px-5 pb-4">
                    <Pressable
                        onPress={() => searchInputRef.current?.focus()}
                        className="flex-row items-center bg-white dark:bg-slate-900 rounded-3xl px-4 py-3.5 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <Search size={22} color={colors.text} strokeWidth={2.5} className="opacity-70" />
                        <TextInput
                            ref={searchInputRef}
                            value={searchConfig.value}
                            onChangeText={searchConfig.onChangeText}
                            placeholder={searchConfig.placeholder || 'Search...'}
                            placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                            className="flex-1 ml-4 text-slate-900 dark:text-white text-[17px] font-medium leading-5 py-0"
                            style={{ outline: 'none' } as any}
                        />
                    </Pressable>
                </View>
            )}
        </View >
    );
}
