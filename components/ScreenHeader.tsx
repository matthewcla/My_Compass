import { SearchConfig } from '@/store/useHeaderStore';
import { useUIStore } from '@/store/useUIStore';
import { Menu } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
    title: string;
    subtitle: string | React.ReactNode;
    leftAction?: { icon: React.ElementType<any>; onPress: () => void } | null;
    rightAction?: { icon: React.ElementType<any>; onPress: () => void } | null;
    withSafeArea?: boolean;
    variant?: 'large' | 'inline';
    searchConfig?: SearchConfig | null;
    showWebMenu?: boolean;
}

export function ScreenHeader({
    title,
    subtitle,
    leftAction,
    rightAction,
    withSafeArea = true,
    variant = 'large',
    searchConfig,
    showWebMenu = false
}: ScreenHeaderProps) {
    const GLOBAL_SEARCH_RADIUS = 24;

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const insets = useSafeAreaInsets();
    const toggleDrawer = useUIStore(state => state.toggleDrawer);

    const isInline = variant === 'inline';
    const hasHeaderContent = Boolean(title || subtitle || rightAction || (showWebMenu && Platform.OS === 'web') || leftAction);
    
    // Web menu replaces left action if true and on web, and no explicit leftAction was provided
    const actualLeftAction = (showWebMenu && Platform.OS === 'web' && !leftAction)
        ? { icon: Menu, onPress: toggleDrawer }
        : leftAction;

    return (
        <View className="z-50">
            {hasHeaderContent && (
                <View
                    style={{
                        paddingTop: (withSafeArea ? Math.max(insets.top, 20) : 0) + (isInline ? 8 : 12),
                        paddingHorizontal: 16,
                        paddingBottom: isInline ? 8 : 12
                    }}
                    className={`flex-row justify-between items-center relative z-50`}
                >
                    <View className="flex-row items-center gap-3 flex-1 mr-4">
                        {actualLeftAction && (
                            <Pressable
                                onPress={actualLeftAction.onPress}
                                hitSlop={12}
                                className="p-2.5 rounded-xl hover:bg-slate-900/5 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 ease-out"
                            >
                                {({ pressed, hovered }: any) => {
                                    const LeftIcon = actualLeftAction.icon;
                                    // Deep Navy in Light Mode, Soft Slate in Dark Mode
                                    const iconColor = isDark ? "#f8fafc" : "#0A1628";
                                    
                                    return (
                                        <LeftIcon
                                            color={iconColor}
                                            size={isInline ? 20 : 24}
                                            strokeWidth={2.5}
                                            style={{ 
                                                opacity: pressed ? 0.7 : (hovered ? 0.9 : 1),
                                                transform: [{ scale: hovered && !pressed ? 1.05 : 1 }]
                                            }}
                                        />
                                    );
                                }}
                            </Pressable>
                        )}
                        <View className={isInline ? "flex-row items-baseline gap-2" : ""}>
                            {title ? (
                                <Text className={`${isInline ? 'text-lg' : 'text-2xl'} font-bold text-slate-900 dark:text-white tracking-tight`}>
                                    {title}
                                </Text>
                            ) : null}
                            {subtitle ? (
                                <Text className={`text-slate-500 dark:text-blue-100 font-bold uppercase tracking-widest ${isInline ? 'text-[10px]' : 'text-sm mt-1'}`}>
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
                                className="p-2.5 rounded-xl hover:bg-slate-900/5 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 ease-out"
                            >
                                {({ pressed, hovered }: any) => {
                                    const Icon = rightAction.icon;
                                    const iconColor = isDark ? "#f8fafc" : "#0A1628";
                                    return (
                                        <Icon
                                            color={iconColor}
                                            size={isInline ? 20 : 24}
                                            strokeWidth={2}
                                            style={{ 
                                                opacity: pressed ? 0.7 : (hovered ? 0.9 : 1),
                                                transform: [{ scale: hovered && !pressed ? 1.05 : 1 }]
                                            }}
                                        />
                                    );
                                }}
                            </Pressable>
                        )}
                    </View>
                </View>
            )}

        </View>
    );
}
