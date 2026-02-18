import { useColorScheme } from '@/components/useColorScheme';
import { FilterState } from '@/store/useAssignmentStore';
import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DiscoveryFiltersProps {
    visible: boolean;
    onClose: () => void;
    showProjected: boolean;
    onToggleProjected: () => void;
    availableLocations: string[];
    availableDutyTypes: string[];
    selectedLocations: string[];
    selectedDutyTypes: string[];
    selectedPayGrades: string[];
    onUpdateFilters: (filters: Partial<FilterState>) => void;
}

/**
 * Expanded filter drawer for the Discovery screen.
 * Sections: Projected Toggle, Duty Station, Rank (±1), Duty Type (Sea/Shore).
 */
export function DiscoveryFilters({
    visible,
    onClose,
    showProjected,
    onToggleProjected,
    availableLocations,
    availableDutyTypes,
    selectedLocations,
    selectedDutyTypes,
    selectedPayGrades,
    onUpdateFilters,
}: DiscoveryFiltersProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const toggleChip = (
        value: string,
        current: string[],
        key: keyof FilterState,
    ) => {
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        onUpdateFilters({ [key]: updated });
    };

    // Rank chips: current payGrade + 1
    const rankOptions = ['E-6', 'E-7'];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable
                className="flex-1 bg-black/40"
                onPress={onClose}
            />
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl pb-8 border-t border-slate-200 dark:border-slate-700" style={{ paddingTop: insets.top }}>
                {/* Handle + Header */}
                <View className="items-center pt-3 pb-2">
                    <View className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                </View>
                <View className="flex-row items-start justify-between px-6 pb-4">
                    <View>
                        <Text
                            style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }}
                            className="text-slate-400 dark:text-gray-500 mb-0.5"
                        >
                            DISCOVERY
                        </Text>
                        <Text
                            style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}
                            className="text-slate-900 dark:text-white"
                        >
                            Filters
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onClose} className="p-2">
                        <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                </View>

                <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 20 }}>
                    {/* ─── Projected Billets ──────────────────────────────── */}
                    <View className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                        <View className="flex-1 mr-4">
                            <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                Show Projected Billets
                            </Text>
                            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Include billets opening in future cycles (9–12 months out).
                            </Text>
                        </View>
                        <Switch
                            value={showProjected}
                            onValueChange={onToggleProjected}
                            trackColor={{ false: '#cbd5e1', true: '#3B82F6' }}
                            thumbColor="#fff"
                        />
                    </View>

                    {/* ─── Rank ───────────────────────────────────────────── */}
                    <View className="pt-5 pb-3">
                        <Text className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                            Rank
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {rankOptions.map(rank => (
                                <FilterChip
                                    key={rank}
                                    label={rank}
                                    selected={selectedPayGrades.includes(rank)}
                                    onPress={() => toggleChip(rank, selectedPayGrades, 'payGrade')}
                                    isDark={isDark}
                                />
                            ))}
                        </View>
                    </View>

                    {/* ─── Duty Type ──────────────────────────────────────── */}
                    {availableDutyTypes.length > 0 && (
                        <View className="pt-4 pb-3">
                            <Text className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                Duty Type
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {availableDutyTypes.map(type => (
                                    <FilterChip
                                        key={type}
                                        label={type.charAt(0) + type.slice(1).toLowerCase()}
                                        selected={selectedDutyTypes.includes(type)}
                                        onPress={() => toggleChip(type, selectedDutyTypes, 'dutyType')}
                                        isDark={isDark}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ─── Duty Station ───────────────────────────────────── */}
                    {availableLocations.length > 0 && (
                        <View className="pt-4 pb-3">
                            <Text className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                Duty Station
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {availableLocations.sort().map(loc => (
                                    <FilterChip
                                        key={loc}
                                        label={loc}
                                        selected={selectedLocations.includes(loc)}
                                        onPress={() => toggleChip(loc, selectedLocations, 'location')}
                                        isDark={isDark}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

/* ─── Filter Chip ─────────────────────────────────────────────────────────── */

function FilterChip({
    label,
    selected,
    onPress,
    isDark,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
    isDark: boolean;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`px-4 py-2.5 rounded-full border ${selected
                ? 'bg-blue-500 border-blue-500'
                : isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-slate-100 border-slate-200'
                }`}
        >
            <Text
                className={`text-sm font-semibold ${selected
                    ? 'text-white'
                    : isDark
                        ? 'text-slate-300'
                        : 'text-slate-700'
                    }`}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}
