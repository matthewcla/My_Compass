
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import { differenceInDays, isValid, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, Text, TextInput, View, useColorScheme } from 'react-native';

const LEAVE_TYPES = [
    { id: 'annual', label: 'Annual' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'convalescent', label: 'Convalescent' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'parental', label: 'Parental' },
    { id: 'bereavement', label: 'Bereavement' },
    { id: 'adoption', label: 'Adoption' },
    { id: 'ptdy', label: 'PTDY' },
    { id: 'other', label: 'Other' },
] as const;

interface Step1IntentProps {
    leaveType?: string;
    startDate: string;
    endDate: string;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
}

export function Step1Intent({ leaveType, startDate, endDate, onUpdate }: Step1IntentProps) {
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
            {/* Leave Type */}
            <View>
                <Text className="text-lg font-bold text-labelPrimary mb-4">Request Details</Text>
                <Text className="text-sm font-medium text-labelSecondary mb-2">Leave Type</Text>
                <View className="flex-row flex-wrap gap-2">
                    {LEAVE_TYPES.map((type) => (
                        <Pressable
                            key={type.id}
                            onPress={() => onUpdate('leaveType', type.id)}
                            className={`px-4 py-2 rounded-full border ${leaveType === type.id
                                ? 'bg-systemBlue border-systemBlue'
                                : 'bg-systemBackground border-systemGray6'
                                }`}
                        >
                            <Text
                                className={`${leaveType === type.id ? 'text-white' : 'text-labelSecondary'
                                    } font-medium`}
                            >
                                {type.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

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
