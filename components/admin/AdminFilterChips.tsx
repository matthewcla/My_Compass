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
                            ? 'bg-primary border-primary'
                            : 'bg-transparent border-outline'
                            }`}
                        style={{ minHeight: 44, justifyContent: 'center' }}
                    >
                        <Text
                            className={`text-xs font-bold ${isActive
                                ? 'text-on-primary'
                                : 'text-on-surface-variant'
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
