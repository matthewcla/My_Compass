// components/admin/AdminQuickActionBar.tsx
// Persistent bottom tray with quick-submit buttons for common request types.

import { SolidView } from '@/components/ui/SolidView';
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
            onPress: () => router.push('/admin/submit' as any),
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
                    shadowColor: '#000',
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 8,
                }),
            ]}>
                <SolidView
                    intensity={100}
                    tint="dark"
                    className="rounded-sm overflow-hidden border border-slate-700/50"
                >
                    <View className="flex-row items-center justify-around py-3 px-2">
                        {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <TouchableOpacity
                                    key={action.label}
                                    activeOpacity={0.7}
                                    onPress={action.onPress}
                                    className="items-center justify-center px-3 py-2"
                                    style={{ minWidth: 64, minHeight: 44 }}
                                >
                                    <View className="bg-slate-800 w-10 h-10 rounded-sm items-center justify-center mb-1 border border-slate-700/50">
                                        <Icon
                                            size={18}
                                            color="#e2e8f0"
                                            strokeWidth={2}
                                        />
                                    </View>
                                    <Text className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                        {action.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </SolidView>
            </View>
        </View>
    );
}
