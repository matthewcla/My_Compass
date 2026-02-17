// components/admin/AdminHealthBar.tsx
// Top status strip — three tappable buckets: Action Required / In Progress / Completed
// Now includes "Last synced" footer and improved active state with glow effect.

import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { AdminStatus, useAdminStore } from '@/store/useAdminStore';
import { getShadow } from '@/utils/getShadow';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface BucketConfig {
    key: AdminStatus;
    label: string;
    icon: typeof AlertTriangle;
    colors: {
        activeBg: string;
        activeBorder: string;
        activeText: string;
        iconActive: string;
        iconInactive: string;
        glowColor: string;
    };
}

const BUCKETS: BucketConfig[] = [
    {
        key: 'action_required',
        label: 'Action\nRequired',
        icon: AlertTriangle,
        colors: {
            activeBg: 'bg-amber-100 dark:bg-amber-900/50',
            activeBorder: 'border-amber-400 dark:border-amber-600',
            activeText: 'text-amber-900 dark:text-amber-100',
            iconActive: '#d97706',
            iconInactive: '#64748b',
            glowColor: '#f59e0b',
        },
    },
    {
        key: 'in_progress',
        label: 'In\nProgress',
        icon: Clock,
        colors: {
            activeBg: 'bg-blue-100 dark:bg-blue-900/50',
            activeBorder: 'border-blue-400 dark:border-blue-600',
            activeText: 'text-blue-900 dark:text-blue-100',
            iconActive: '#2563eb',
            iconInactive: '#64748b',
            glowColor: '#3b82f6',
        },
    },
    {
        key: 'completed',
        label: 'Completed',
        icon: CheckCircle,
        colors: {
            activeBg: 'bg-green-100 dark:bg-green-900/50',
            activeBorder: 'border-green-400 dark:border-green-600',
            activeText: 'text-green-900 dark:text-green-100',
            iconActive: '#15803d',
            iconInactive: '#64748b',
            glowColor: '#22c55e',
        },
    },
];

interface AdminHealthBarProps {
    lastSyncedLabel?: string;
}

export function AdminHealthBar({ lastSyncedLabel }: AdminHealthBarProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const requests = useAdminStore(state => state.requests);
    const activeFilter = useAdminStore(state => state.activeStatusFilter);
    const setStatusFilter = useAdminStore(state => state.setStatusFilter);

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
        <View style={getShadow({
            shadowColor: isDark ? '#94a3b8' : '#64748b',
            shadowOpacity: isDark ? 0.12 : 0.14,
            shadowRadius: 12,
            elevation: 4,
        })}>
            <GlassView
                intensity={70}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
                <View className="flex-row items-stretch p-2 gap-2">
                    {BUCKETS.map((bucket) => {
                        const isActive = activeFilter === bucket.key;
                        const count = countMap[bucket.key];
                        const Icon = bucket.icon;

                        const iconColorActive = isDark
                            ? (bucket.key === 'action_required' ? '#fbbf24' : bucket.key === 'in_progress' ? '#60a5fa' : '#4ade80')
                            : bucket.colors.iconActive;

                        return (
                            <TouchableOpacity
                                key={bucket.key}
                                activeOpacity={0.7}
                                onPress={() => setStatusFilter(isActive ? null : bucket.key)}
                                className={`flex-1 items-center justify-center py-2.5 px-2 rounded-lg border-2 ${isActive
                                    ? `${bucket.colors.activeBg} ${bucket.colors.activeBorder}`
                                    : 'bg-transparent border-transparent'
                                    }`}
                                style={isActive ? getShadow({
                                    shadowColor: bucket.colors.glowColor,
                                    shadowOpacity: isDark ? 0.35 : 0.25,
                                    shadowRadius: 8,
                                    elevation: 4,
                                }) : undefined}
                            >
                                <Icon
                                    size={16}
                                    color={isActive ? iconColorActive : bucket.colors.iconInactive}
                                    strokeWidth={2.5}
                                />
                                <Text
                                    className={`text-2xl font-black mt-0.5 ${isActive ? bucket.colors.activeText : 'text-slate-700 dark:text-slate-200'}`}
                                >
                                    {count}
                                </Text>
                                <Text
                                    className={`text-[8px] font-bold uppercase tracking-wider text-center leading-[11px] ${isActive ? bucket.colors.activeText : 'text-slate-500 dark:text-slate-400'}`}
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
                    <View className="bg-green-50 dark:bg-green-900/20 px-4 py-1.5 border-t border-green-100 dark:border-green-800/30">
                        <Text className="text-green-700 dark:text-green-300 text-xs font-bold text-center">
                            ✅ All clear — no pending actions
                        </Text>
                    </View>
                )}

                {/* Last Synced Footer */}
                {lastSyncedLabel && (
                    <View className="border-t border-slate-100 dark:border-slate-700/50 px-3 py-1.5">
                        <Text className="text-[10px] font-medium text-slate-400 dark:text-slate-500 text-center">
                            Last synced: {lastSyncedLabel}
                        </Text>
                    </View>
                )}
            </GlassView>
        </View>
    );
}
