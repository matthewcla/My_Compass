// components/admin/AdminFilterChips.tsx
// Horizontal scrollable chip row for filtering admin requests by type.

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
                        className={`px-3.5 py-2 rounded-sm border ${isActive
                            ? 'bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-600'
                            : 'bg-transparent border-slate-300 dark:border-slate-800'
                            }`}
                        style={{ minHeight: 44, justifyContent: 'center' }}
                    >
                        <Text
                            className={`text-xs font-bold ${isActive
                                ? 'text-white'
                                : 'text-slate-600 dark:text-slate-400'
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
