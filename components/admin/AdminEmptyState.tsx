// components/admin/AdminEmptyState.tsx
// Positive empty state when no active admin requests are pending.

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export function AdminEmptyState() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View className="items-center justify-center py-16 px-8">
            <View className="bg-primary-container p-6 rounded-full mb-5">
                <ShieldCheck
                    size={48}
                    color={Colors[colorScheme ?? 'light'].status.success}
                    strokeWidth={1.5}
                />
            </View>
            <Text className="text-xl font-bold text-on-surface text-center mb-2">
                You're all clear
            </Text>
            <Text className="text-sm text-on-surface-variant text-center leading-5">
                No pending admin requests.{'\n'}Use the bar below to submit something new.
            </Text>
        </View>
    );
}
