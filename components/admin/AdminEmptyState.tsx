// components/admin/AdminEmptyState.tsx
// Positive empty state when no active admin requests are pending.

import { useColorScheme } from '@/components/useColorScheme';
import { ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export function AdminEmptyState() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View className="items-center justify-center py-16 px-8">
            <View className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full mb-5">
                <ShieldCheck
                    size={48}
                    color={isDark ? '#4ade80' : '#15803d'}
                    strokeWidth={1.5}
                />
            </View>
            <Text className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
                You're all clear
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 text-center leading-5">
                No pending admin requests.{'\n'}Use the bar below to submit something new.
            </Text>
        </View>
    );
}
