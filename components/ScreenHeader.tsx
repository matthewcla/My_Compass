import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SearchConfig, useHeaderStore } from '@/store/useHeaderStore';
import { Search } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
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
    const isGlobalSearch = searchConfig?.mode === 'global';
    const searchInputRef = React.useRef<TextInput>(null);
    const globalSearchRowRef = React.useRef<View>(null);
    const registerGlobalSearchBlur = useHeaderStore((state) => state.registerGlobalSearchBlur);
    const setGlobalSearchBottomY = useHeaderStore((state) => state.setGlobalSearchBottomY);
    const globalSearchBottomY = useHeaderStore((state) => state.globalSearchBottomY);

    // Local state to prevent race conditions/flickering with async store updates
    const [localSearchValue, setLocalSearchValue] = React.useState(searchConfig?.value || '');

    const globalSearchOnPress = isGlobalSearch ? searchConfig.onPress : undefined;

    // Sync local state when prop changes externally (e.g. clear button, or initial load)
    // We only sync if the values are significantly different to avoid loop
    React.useEffect(() => {
        if (searchConfig?.value !== undefined && searchConfig.value !== localSearchValue) {
            setLocalSearchValue(searchConfig.value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchConfig?.value]);

    const handleSearchChange = (text: string) => {
        // 1. Immediate local update (Sync) - Fixes flickering
        setLocalSearchValue(text);

        // 2. Propagate to store (Async)
        searchConfig?.onChangeText?.(text);
    };

    const handleGlobalSearchFocus = React.useCallback(() => {
        if (!isGlobalSearch) return;
        requestAnimationFrame(() => {
            globalSearchOnPress?.();
        });
    }, [globalSearchOnPress, isGlobalSearch]);

    const focusGlobalSearchInput = React.useCallback(() => {
        searchInputRef.current?.focus();
    }, []);

    React.useEffect(() => {
        if (!isGlobalSearch) {
            registerGlobalSearchBlur(null);
            setGlobalSearchBottomY(null);
            return;
        }

        const blurInput = () => {
            searchInputRef.current?.blur();
        };

        registerGlobalSearchBlur(blurInput);
        return () => {
            registerGlobalSearchBlur(null);
            setGlobalSearchBottomY(null);
        };
    }, [isGlobalSearch, registerGlobalSearchBlur, setGlobalSearchBottomY]);

    const handleGlobalSearchLayout = React.useCallback(() => {
        if (!isGlobalSearch || !globalSearchRowRef.current) return;

        globalSearchRowRef.current.measureInWindow((_x, y, _width, height) => {
            const nextBottom = y + height;
            if (!Number.isFinite(nextBottom)) return;

            if (globalSearchBottomY === null || Math.abs(globalSearchBottomY - nextBottom) >= 1) {
                setGlobalSearchBottomY(nextBottom);
            }
        });
    }, [globalSearchBottomY, isGlobalSearch, setGlobalSearchBottomY]);

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
                    {isGlobalSearch ? (
                        <View
                            ref={globalSearchRowRef}
                            onLayout={handleGlobalSearchLayout}
                            className="flex-row items-center bg-white dark:bg-slate-900 rounded-3xl px-4 border border-slate-200 dark:border-slate-800 shadow-sm"
                            accessibilityRole="search"
                            accessibilityLabel={searchConfig.placeholder || 'Global search'}
                        >
                            <Pressable onPress={focusGlobalSearchInput} hitSlop={10}>
                                <Search
                                    size={22}
                                    color={colors.text}
                                    strokeWidth={2.5}
                                    style={{ marginRight: 20 }}
                                    className="opacity-70"
                                />
                            </Pressable>

                            <TextInput
                                ref={searchInputRef}
                                value={searchConfig.value || ''}
                                onChangeText={isGlobalSearch ? searchConfig.onChangeText : undefined}
                                onFocus={handleGlobalSearchFocus}
                                placeholder={searchConfig.placeholder || 'Search...'}
                                placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                                className="flex-1 text-slate-900 dark:text-white text-[17px] font-medium leading-5 py-3.5"
                                style={{ outline: 'none' } as any}
                                autoCorrect={false}
                                autoCapitalize="none"
                                returnKeyType="search"
                                showSoftInputOnFocus={true}
                                accessibilityLabel={searchConfig.placeholder || 'Global search input'}
                            />

                            {Platform.OS === 'web' && (
                                <View className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700">
                                    <Text className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        ⌘K
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View
                            className="flex-row items-center bg-white dark:bg-slate-900 rounded-3xl px-4 border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <Pressable onPress={() => searchInputRef.current?.focus()} hitSlop={10}>
                                <Search
                                    size={22}
                                    color={colors.text}
                                    strokeWidth={2.5}
                                    style={{ marginRight: 20 }}
                                    className="opacity-70"
                                />
                            </Pressable>
                            <TextInput
                                ref={searchInputRef}
                                value={localSearchValue}
                                onChangeText={handleSearchChange}
                                placeholder={searchConfig.placeholder || 'Search...'}
                                placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                                className="flex-1 text-slate-900 dark:text-white text-[17px] font-medium leading-5 py-3.5"
                                style={{ outline: 'none' } as any}
                                showSoftInputOnFocus={true}
                            />
                        </View>
                    )}
                </View>
            )}
        </View >
    );
}
