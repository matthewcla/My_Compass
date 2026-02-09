import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SearchConfig, useHeaderStore } from '@/store/useHeaderStore';
import { useSpotlightStore } from '@/store/useSpotlightStore';
import { Search, X } from 'lucide-react-native';
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
    const GLOBAL_SEARCH_RADIUS = 24;

    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const isInline = variant === 'inline';
    const isGlobalSearch = searchConfig?.mode === 'global';
    const searchInputRef = React.useRef<TextInput>(null);
    const globalSearchRowRef = React.useRef<View>(null);
    const spotlightIsOpen = useSpotlightStore((state) => state.isOpen);
    const registerGlobalSearchBlur = useHeaderStore((state) => state.registerGlobalSearchBlur);
    const setGlobalSearchBottomY = useHeaderStore((state) => state.setGlobalSearchBottomY);
    const globalSearchFrame = useHeaderStore((state) => state.globalSearchFrame);
    const setGlobalSearchFrame = useHeaderStore((state) => state.setGlobalSearchFrame);
    const triggerGlobalSearchDismiss = useHeaderStore((state) => state.triggerGlobalSearchDismiss);
    const triggerGlobalSearchSubmit = useHeaderStore((state) => state.triggerGlobalSearchSubmit);

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

        globalSearchRowRef.current?.measureInWindow((x, y, width, height) => {
            const nextBottom = y + height;
            if (
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                !Number.isFinite(width) ||
                !Number.isFinite(height) ||
                !Number.isFinite(nextBottom)
            ) {
                return;
            }

            setGlobalSearchFrame({
                x,
                y,
                width,
                height,
                bottom: nextBottom,
                borderRadius: GLOBAL_SEARCH_RADIUS,
                measuredAt: Date.now(),
            });
        });

        // Fire immediately — no requestAnimationFrame delay
        globalSearchOnPress?.();
    }, [globalSearchOnPress, isGlobalSearch, setGlobalSearchFrame]);

    const focusGlobalSearchInput = React.useCallback(() => {
        globalSearchRowRef.current?.measureInWindow((x, y, width, height) => {
            const nextBottom = y + height;
            if (
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                !Number.isFinite(width) ||
                !Number.isFinite(height) ||
                !Number.isFinite(nextBottom)
            ) {
                return;
            }

            setGlobalSearchFrame({
                x,
                y,
                width,
                height,
                bottom: nextBottom,
                borderRadius: GLOBAL_SEARCH_RADIUS,
                measuredAt: Date.now(),
            });
        });
        searchInputRef.current?.focus();
    }, [setGlobalSearchFrame]);

    React.useEffect(() => {
        if (!isGlobalSearch) {
            registerGlobalSearchBlur(null);
            setGlobalSearchFrame(null);
            setGlobalSearchBottomY(null);
            return;
        }

        const blurInput = () => {
            searchInputRef.current?.blur();
        };

        registerGlobalSearchBlur(blurInput);
        return () => {
            registerGlobalSearchBlur(null);
            setGlobalSearchFrame(null);
            setGlobalSearchBottomY(null);
        };
    }, [isGlobalSearch, registerGlobalSearchBlur, setGlobalSearchBottomY, setGlobalSearchFrame]);

    // Auto-focus the search input when spotlight opens (e.g. via ⌘K)
    React.useEffect(() => {
        if (spotlightIsOpen && isGlobalSearch) {
            searchInputRef.current?.focus();
        }
    }, [spotlightIsOpen, isGlobalSearch]);

    const handleGlobalSearchLayout = React.useCallback(() => {
        if (!isGlobalSearch || !globalSearchRowRef.current) return;

        globalSearchRowRef.current.measureInWindow((x, y, width, height) => {
            const nextBottom = y + height;
            if (
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                !Number.isFinite(width) ||
                !Number.isFinite(height) ||
                !Number.isFinite(nextBottom)
            ) {
                return;
            }

            const hasChanged =
                !globalSearchFrame ||
                Math.abs(globalSearchFrame.x - x) >= 1 ||
                Math.abs(globalSearchFrame.y - y) >= 1 ||
                Math.abs(globalSearchFrame.width - width) >= 1 ||
                Math.abs(globalSearchFrame.height - height) >= 1 ||
                Math.abs(globalSearchFrame.bottom - nextBottom) >= 1;

            if (!hasChanged) return;

            setGlobalSearchFrame({
                x,
                y,
                width,
                height,
                bottom: nextBottom,
                borderRadius: GLOBAL_SEARCH_RADIUS,
                measuredAt: Date.now(),
            });
        });
    }, [globalSearchFrame, isGlobalSearch, setGlobalSearchFrame]);

    const hasHeaderContent = Boolean(title || subtitle || rightAction);

    return (
        <View className="z-50 bg-gray-100 dark:bg-black">
            {hasHeaderContent && (
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
            )}

            {searchConfig && searchConfig.visible && (
                <View className={`px-5 pb-4 ${!hasHeaderContent ? 'pt-4' : ''}`}>
                    {isGlobalSearch ? (
                        <View
                            ref={globalSearchRowRef}
                            onLayout={handleGlobalSearchLayout}
                            className={`flex-row items-center bg-white dark:bg-slate-900 px-4 border border-slate-200 dark:border-slate-800 ${spotlightIsOpen ? 'rounded-t-3xl' : 'rounded-3xl shadow-sm'}`}
                            style={spotlightIsOpen ? { borderBottomWidth: 0 } : undefined}
                            accessibilityRole="search"
                            accessibilityLabel={searchConfig.placeholder || 'Global search'}
                        >
                            {spotlightIsOpen ? (
                                <Pressable
                                    onPress={() => triggerGlobalSearchDismiss()}
                                    hitSlop={10}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close search"
                                >
                                    <X
                                        size={20}
                                        color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'}
                                        strokeWidth={2.5}
                                        style={{ marginRight: 20 }}
                                    />
                                </Pressable>
                            ) : (
                                <Pressable onPress={focusGlobalSearchInput} onPressIn={handleGlobalSearchLayout} hitSlop={10}>
                                    <Search
                                        size={22}
                                        color={colors.text}
                                        strokeWidth={2.5}
                                        style={{ marginRight: 20 }}
                                        className="opacity-70"
                                    />
                                </Pressable>
                            )}

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
                                onSubmitEditing={() => {
                                    if (spotlightIsOpen) triggerGlobalSearchSubmit();
                                }}
                            />

                            {!spotlightIsOpen && Platform.OS === 'web' && (
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
