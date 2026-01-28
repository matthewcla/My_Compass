
import Colors from '@/constants/Colors';
import { differenceInDays, isValid, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TextInput, View, useColorScheme } from 'react-native';

interface Step1IntentProps {
    startDate: string;
    endDate: string;
    onUpdate: (field: 'startDate' | 'endDate', value: string) => void;
}

export function Step1Intent({ startDate, endDate, onUpdate }: Step1IntentProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    // Live calculation of charge days
    const chargeDays = useMemo(() => {
        if (!startDate || !endDate) return null;
        const start = parseISO(startDate);
        const end = parseISO(endDate);

        if (!isValid(start) || !isValid(end)) return null;

        // Default logic: inclusive difference + 1
        // e.g. Feb 1 to Feb 1 is 1 day.
        const diff = differenceInDays(end, start);
        return diff >= 0 ? diff + 1 : null;
    }, [startDate, endDate]);

    const hasDateError = useMemo(() => {
        if (!startDate || !endDate) return false;
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        return isValid(start) && isValid(end) && end < start;
    }, [startDate, endDate]);

    return (
        <View className="space-y-6">
            {/* Start Date */}
            <View>
                <Text className="text-sm font-medium text-labelSecondary mb-1">Start Date (YYYY-MM-DD)</Text>
                <View className={`flex-row items-center bg-systemGray6 rounded-xl px-4 py-3 border ${hasDateError ? 'border-red-500' : 'border-systemGray6'}`}>
                    <Calendar size={20} color={hasDateError ? '#EF4444' : themeColors.labelSecondary} className="mr-3" strokeWidth={1.5} />
                    <TextInput
                        className="flex-1 text-base text-labelPrimary"
                        placeholder="2026-02-01"
                        value={startDate}
                        onChangeText={(text) => onUpdate('startDate', text)}
                        keyboardType="numbers-and-punctuation"
                        placeholderTextColor={themeColors.labelSecondary}
                    />
                </View>
            </View>

            {/* End Date */}
            <View>
                <Text className="text-sm font-medium text-labelSecondary mb-1">End Date (YYYY-MM-DD)</Text>
                <View className={`flex-row items-center bg-systemGray6 rounded-xl px-4 py-3 border ${hasDateError ? 'border-red-500' : 'border-systemGray6'}`}>
                    <Calendar size={20} color={hasDateError ? '#EF4444' : themeColors.labelSecondary} className="mr-3" strokeWidth={1.5} />
                    <TextInput
                        className="flex-1 text-base text-labelPrimary"
                        placeholder="2026-02-05"
                        value={endDate}
                        onChangeText={(text) => onUpdate('endDate', text)}
                        keyboardType="numbers-and-punctuation"
                        placeholderTextColor={themeColors.labelSecondary}
                    />
                </View>
            </View>

            {/* Validation / Info */}
            {hasDateError && (
                <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex-row items-center">
                    <Text className="text-red-500 font-medium text-sm">
                        Return Date cannot be before Departure Date.
                    </Text>
                </View>
            )}

            {chargeDays !== null && !hasDateError && (
                <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex-row justify-between items-center">
                    <Text className="text-blue-800 dark:text-blue-200 font-medium">Estimated Chargeable Days</Text>
                    <Text className="text-blue-700 dark:text-blue-300 font-bold text-lg">{chargeDays} Days</Text>
                </View>
            )}
        </View>
    );
}
