import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getShadow } from '@/utils/getShadow';
import { usePathname, useRouter } from 'expo-router';
import { Bell, CheckCircle2, ChevronRight, FileText, LayoutGrid, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
    title: string;
    subtitle: string | React.ReactNode;
    rightAction?: { icon: any; onPress: () => void } | null;
    withSafeArea?: boolean;
    variant?: 'large' | 'inline';
}

const MENU_ITEMS = [
    { label: 'My Assignment', route: '/(assignment)/assignments', icon: CheckCircle2, activePath: 'assignments' },
    { label: 'My PCS', route: '/(pcs)/orders', icon: FileText, activePath: 'orders' },
    { label: 'My Admin', route: '/(admin)/requests', icon: FileText, activePath: 'requests' },
    { label: 'My Profile', route: '/(profile)/preferences', icon: User, activePath: 'preferences' },
];

export function ScreenHeader({
    title,
    subtitle,
    rightAction,
    withSafeArea = true,
    variant = 'large'
}: ScreenHeaderProps) {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const pathname = usePathname();
    const [menuVisible, setMenuVisible] = useState(false);

    const handleAlert = () => {
        Alert.alert("Notifications", "No new alerts at this time.");
    };

    const handleNavigation = (route: string) => {
        setMenuVisible(false);
        router.push(route as any);
    };

    const isInline = variant === 'inline';

    return (
        <View className="z-50">
            <View
                style={{
                    paddingTop: (withSafeArea ? insets.top : 0) + (isInline ? 8 : 12),
                    paddingHorizontal: 16,
                    paddingBottom: isInline ? 8 : 12
                }}
                className={`flex-row justify-between items-center bg-gray-100 dark:bg-black relative z-50`}
            >
                <View className="flex-row items-center flex-1 mr-4">
                    <Pressable
                        onPress={() => setMenuVisible(true)}
                        className="mr-4"
                        hitSlop={12}
                    >
                        {/* REPLACEMENT: LayoutGrid for 'System/Function' Context Switcher */}
                        <LayoutGrid
                            color={colors.text}
                            size={isInline ? 24 : 28}
                            strokeWidth={2} // TACTICAL: Increased weight
                        />
                    </Pressable>
                    <View className={isInline ? "flex-row items-baseline gap-2" : ""}>
                        <Text className={`${isInline ? 'text-lg' : 'text-2xl'} font-black text-slate-900 dark:text-white uppercase tracking-tight`}>
                            {title}
                        </Text>
                        <Text className={`text-blue-700 dark:text-blue-100 font-bold uppercase tracking-widest ${isInline ? 'text-[10px]' : 'text-sm mt-1'}`}>
                            {subtitle}
                        </Text>
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

                    <Pressable
                        onPress={handleAlert}
                        accessibilityLabel="Notifications"
                        hitSlop={12}
                    >
                        {({ pressed }) => (
                            <Bell
                                color={colors.text}
                                size={isInline ? 20 : 24}
                                strokeWidth={2}
                                style={{ opacity: pressed ? 0.7 : 1 }}
                            />
                        )}
                    </Pressable>
                </View>
            </View>

            <Modal
                transparent
                visible={menuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View className="flex-1 bg-black/50 backdrop-blur-sm">
                        <View
                            style={{
                                marginTop: (withSafeArea ? insets.top : 0) + (isInline ? 50 : 70),
                                marginLeft: 20
                            }}
                        >
                            <TouchableWithoutFeedback>
                                <View
                                    className="bg-white dark:bg-slate-900 rounded-xl w-64 overflow-hidden border border-slate-200 dark:border-slate-800"
                                    style={getShadow({
                                        shadowColor: "#000",
                                        shadowOffset: {
                                            width: 0,
                                            height: 10,
                                        },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 20,
                                        elevation: 10,
                                    })}
                                >
                                    <View className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                        <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Function Menu
                                        </Text>
                                    </View>
                                    {MENU_ITEMS.map((item, index) => {
                                        const Icon = item.icon;
                                        // ROBUST: Check if the pathname contains the unique segment for this spoke
                                        const isActive = pathname.includes(item.activePath);

                                        return (
                                            <Pressable
                                                key={item.label}
                                                onPress={() => handleNavigation(item.route)}
                                                className={`flex-row items-center justify-between p-4 border-b border-white/5 ${isActive
                                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                                    : 'active:bg-slate-50 dark:active:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                <View className="flex-row items-center gap-3">
                                                    <Icon
                                                        size={20} // VISUAL: Slightly larger for touch targets
                                                        strokeWidth={isActive ? 2.5 : 2}
                                                        color={isActive ? '#2563EB' : colors.text}
                                                        style={{ opacity: isActive ? 1 : 0.7 }}
                                                    />
                                                    <Text className={`font-semibold text-sm ${isActive
                                                        ? 'text-blue-700 dark:text-blue-400'
                                                        : 'text-slate-700 dark:text-slate-200'
                                                        }`}>
                                                        {item.label}
                                                    </Text>
                                                </View>
                                                {isActive && (
                                                    <ChevronRight
                                                        size={16}
                                                        color="#2563EB"
                                                        strokeWidth={3}
                                                    />
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View >
    );
}
