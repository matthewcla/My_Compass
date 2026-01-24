import Colors from '@/constants/Colors';
import { AlertCircle, CheckCircle, Cloud } from 'lucide-react-native';
import React from 'react';
import { Text, View, useColorScheme } from 'react-native';

export type SyncStatus = 'synced' | 'pending_upload' | 'error';

interface SyncStatusBadgeProps {
    status: SyncStatus;
}

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    if (status === 'synced') {
        return (
            <View className="flex-row items-center bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                <CheckCircle size={14} className="text-green-600 dark:text-green-400 mr-2" color={colorScheme === 'dark' ? '#4ade80' : themeColors.status.success} strokeWidth={1.5} />
                <Text className="text-green-700 dark:text-green-300 text-xs font-semibold">Saved</Text>
            </View>
        );
    }

    if (status === 'pending_upload') {
        return (
            <View className="flex-row items-center bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                <Cloud size={14} className="text-amber-600 dark:text-amber-400 mr-2" color={colorScheme === 'dark' ? '#fbbf24' : themeColors.status.warning} strokeWidth={1.5} />
                <Text className="text-amber-700 dark:text-amber-300 text-xs font-semibold">Waiting...</Text>
            </View>
        );
    }

    if (status === 'error') {
        return (
            <View className="flex-row items-center bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-800">
                <AlertCircle size={14} className="text-red-600 dark:text-red-400 mr-2" color={colorScheme === 'dark' ? '#f87171' : themeColors.status.error} strokeWidth={1.5} />
                <Text className="text-red-700 dark:text-red-300 text-xs font-semibold">Sync Error</Text>
            </View>
        );
    }

    return null;
}
