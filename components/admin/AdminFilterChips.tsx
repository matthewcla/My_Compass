// components/admin/AdminFilterChips.tsx
// Horizontal scrollable chip row for filtering admin requests by type.

import { useColorScheme } from '@/components/useColorScheme';
import { AdminFilterType, useAdminStore } from '@/store/useAdminStore';
import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

interface ChipConfig {
    key: AdminFilterType;
    label: string;
}

const CHIPS: ChipConfig[] = [
    { key: 'ALL', label: 'All' },
    { key: 'LEAVE', label: 'Leave' },
    { key: 'REENLISTMENT', label: 'Reenlistment' },
    { key: 'OBLISERVE', label: 'OBLISERVE' },
    { key: 'SPECIAL_REQUEST', label: 'Special' },
    { key: 'ADMIN_REQUEST', label: 'Admin' },
    { key: 'MY_ACTION', label: 'My Action' },
];

export function AdminFilterChips() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const activeFilter = useAdminStore(state => state.activeTypeFilter);
    const setTypeFilter = useAdminStore(state => state.setTypeFilter);

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 0, gap: 8 }}
        >
            {CHIPS.map((chip) => {
                const isActive = activeFilter === chip.key;

                return (
                    <TouchableOpacity
                        key={chip.key}
                        activeOpacity={0.7}
                        onPress={() => setTypeFilter(chip.key)}
                        className={`px-3.5 py-2 rounded-full border ${isActive
                                ? 'bg-slate-800 dark:bg-slate-100 border-slate-800 dark:border-slate-100'
                                : 'bg-transparent border-slate-300 dark:border-slate-600'
                            }`}
                    >
                        <Text
                            className={`text-xs font-bold ${isActive
                                    ? 'text-white dark:text-slate-900'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            {chip.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}
