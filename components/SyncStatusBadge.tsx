import { AlertCircle, CheckCircle, Cloud } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export type SyncStatus = 'synced' | 'pending_upload' | 'error';

interface SyncStatusBadgeProps {
    status: SyncStatus;
}

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
    if (status === 'synced') {
        return (
            <View className="flex-row items-center bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
                <CheckCircle size={14} className="text-green-600 mr-2" color="#16a34a" />
                <Text className="text-green-700 text-xs font-semibold">Saved</Text>
            </View>
        );
    }

    if (status === 'pending_upload') {
        return (
            <View className="flex-row items-center bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200">
                <Cloud size={14} className="text-amber-600 mr-2" color="#d97706" />
                <Text className="text-amber-700 text-xs font-semibold">Waiting...</Text>
            </View>
        );
    }

    if (status === 'error') {
        return (
            <View className="flex-row items-center bg-red-100 px-3 py-1.5 rounded-full border border-red-200">
                <AlertCircle size={14} className="text-red-600 mr-2" color="#dc2626" />
                <Text className="text-red-700 text-xs font-semibold">Sync Error</Text>
            </View>
        );
    }

    return null;
}
