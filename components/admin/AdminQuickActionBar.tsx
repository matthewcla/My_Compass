// components/admin/AdminQuickActionBar.tsx
// Persistent bottom tray with quick-submit buttons for common request types.

import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { getShadow } from '@/utils/getShadow';
import { useRouter } from 'expo-router';
import {
    Calendar,
    FileText,
    MoreHorizontal,
    Shield,
} from 'lucide-react-native';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface QuickAction {
    icon: typeof Calendar;
    label: string;
    onPress: () => void;
}

export function AdminQuickActionBar() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const actions: QuickAction[] = [
        {
            icon: Calendar,
            label: 'Leave',
            onPress: () => router.push('/leave/request' as any),
        },
        {
            icon: FileText,
            label: 'Admin',
            onPress: () => Alert.alert('Coming Soon', 'Admin request submission will be available in a future update.'),
        },
        {
            icon: Shield,
            label: 'Special',
            onPress: () => Alert.alert('Coming Soon', 'Special request submission will be available in a future update.'),
        },
        {
            icon: MoreHorizontal,
            label: 'More',
            onPress: () => Alert.alert('Coming Soon', 'Additional request types will be available in a future update.'),
        },
    ];

    // Tab bar is 56px + insets.bottom — position above it
    const tabBarHeight = 56 + insets.bottom;

    return (
        <View
            style={{
                position: 'absolute',
                bottom: tabBarHeight + 8,
                left: 0,
                right: 0,
            }}
        >
            <View style={[
                { marginHorizontal: 16 },
                getShadow({
                    shadowColor: isDark ? '#000' : '#334155',
                    shadowOpacity: isDark ? 0.4 : 0.2,
                    shadowRadius: 16,
                    elevation: 8,
                }),
            ]}>
                <GlassView
                    intensity={100}
                    tint={isDark ? 'dark' : 'light'}
                    className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-600"
                >
                    <View className="flex-row items-center justify-around py-3 px-2">
                        {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <TouchableOpacity
                                    key={action.label}
                                    activeOpacity={0.7}
                                    onPress={action.onPress}
                                    className="items-center justify-center px-3 py-1.5"
                                    style={{ minWidth: 64 }}
                                >
                                    <View className="bg-slate-800 dark:bg-slate-200 w-10 h-10 rounded-full items-center justify-center mb-1">
                                        <Icon
                                            size={18}
                                            color={isDark ? '#0f172a' : '#ffffff'}
                                            strokeWidth={2}
                                        />
                                    </View>
                                    <Text className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        {action.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </GlassView>
            </View>
        </View>
    );
}
