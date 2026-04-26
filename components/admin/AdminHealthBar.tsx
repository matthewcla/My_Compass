// components/admin/AdminHealthBar.tsx
// Top status strip — three tappable buckets: Action Required / In Progress / Completed
// Now includes "Last synced" footer and improved active state with glow effect.

import { SolidView } from '@/components/ui/SolidView';
import { AdminStatus, useAdminStore } from '@/store/useAdminStore';
import { getShadow } from '@/utils/getShadow';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface BucketConfig {
    key: AdminStatus;
    label: string;
    icon: typeof AlertTriangle;
}

const BUCKETS: BucketConfig[] = [
    { key: 'action_required', label: 'Action\nRequired', icon: AlertTriangle },
    { key: 'in_progress', label: 'In\nProgress', icon: Clock },
    { key: 'completed', label: 'Completed', icon: CheckCircle },
];

interface AdminHealthBarProps {
    lastSyncedLabel?: string;
}

export function AdminHealthBar({ lastSyncedLabel }: AdminHealthBarProps) {
    const requests = useAdminStore(state => state.requests);
    const activeFilter = useAdminStore(state => state.activeStatusFilter);
    const setStatusFilter = useAdminStore(state => state.setStatusFilter);
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[colorScheme];

    const counts = useMemo(() => ({
        actionRequired: requests.filter(r => r.status === 'action_required').length,
        inProgress: requests.filter(r => r.status === 'in_progress').length,
        completed: requests.filter(r => r.status === 'completed').length,
    }), [requests]);

    const countMap: Record<AdminStatus, number> = {
        action_required: counts.actionRequired,
        in_progress: counts.inProgress,
        completed: counts.completed,
    };

    const allClear = counts.actionRequired === 0;

    return (
        <SolidView
            intensity={100}
            tint="default"
            className="rounded-none border-2 border-outline-variant bg-surface"
        >
                <View className="flex-row items-stretch p-2 gap-2">
                    {BUCKETS.map((bucket) => {
                        const isActive = activeFilter === bucket.key;
                        const count = countMap[bucket.key];
                        const Icon = bucket.icon;

                        const getBucketColors = (key: AdminStatus) => {
                            switch (key) {
                                case 'action_required':
                                    return {
                                        activeText: 'text-secondary',
                                        iconActive: themeColors.status.warning,
                                        iconInactive: isDark ? '#475569' : '#64748B',
                                    };
                                case 'in_progress':
                                    return {
                                        activeText: 'text-primary',
                                        iconActive: Colors.blue[isDark ? 500 : 600],
                                        iconInactive: isDark ? '#475569' : '#64748B',
                                    };
                                case 'completed':
                                    return {
                                        activeText: 'text-on-surface',
                                        iconActive: themeColors.status.success,
                                        iconInactive: isDark ? '#475569' : '#64748B',
                                    };
                            }
                        };
                        const colors = getBucketColors(bucket.key);
                        const iconColorActive = colors.iconActive;

                        return (
                            <TouchableOpacity
                                key={bucket.key}
                                activeOpacity={0.7}
                                onPress={() => setStatusFilter(isActive ? null : bucket.key)}
                                className={`flex-1 items-center justify-center py-2.5 px-2 rounded-none border-2 ${isActive
                                    ? 'bg-surface-container-highest border-outline'
                                    : 'bg-transparent border-transparent'
                                    }`}
                            >
                                <Icon
                                    size={16}
                                    color={isActive ? iconColorActive : colors.iconInactive}
                                    strokeWidth={2.5}
                                />
                                <Text
                                    className={`text-2xl font-black mt-0.5 ${isActive ? colors.activeText : 'text-on-surface'}`}
                                >
                                    {count}
                                </Text>
                                <Text
                                    className={`text-[8px] font-bold uppercase tracking-wider text-center leading-[11px] ${isActive ? colors.activeText : 'text-on-surface-variant'}`}
                                    numberOfLines={2}
                                >
                                    {bucket.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* All Clear Banner */}
                {allClear && (
                    <View className="bg-primary-container px-4 py-1.5 border-t-2 border-primary-container">
                        <Text className="text-on-primary-container text-xs font-bold text-center">
                            ✅ All clear — no pending actions
                        </Text>
                    </View>
                )}

                {/* Last Synced Footer */}
                {lastSyncedLabel && (
                    <View className="border-t-2 border-outline-variant px-3 py-1.5">
                        <Text className="text-[10px] font-medium text-on-surface-variant text-center">
                            Last synced: {lastSyncedLabel}
                        </Text>
                    </View>
                )}
            </SolidView>
    );
}
