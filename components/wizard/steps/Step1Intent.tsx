
import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { differenceInDays, isValid, parseISO } from 'date-fns';
import { Calendar, Globe2, MapPin } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, Switch, Text, TextInput, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

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
    leaveInConus: boolean;
    destinationCountry: string;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
}

export function Step1Intent({
    leaveType,
    startDate,
    endDate,
    leaveInConus,
    destinationCountry,
    onUpdate
}: Step1IntentProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    // Access store for balance
    const leaveBalance = useLeaveStore((state) => state.leaveBalance);
    const availableDays = leaveBalance?.currentBalance ?? 0;

    // Live calculation of charge days
    const chargeDays = useMemo(() => {
        if (!startDate || !endDate) return 0;
        const start = parseISO(startDate);
        const end = parseISO(endDate);

        if (!isValid(start) || !isValid(end)) return 0;

        const diff = differenceInDays(end, start);
        return diff >= 0 ? diff + 1 : 0;
    }, [startDate, endDate]);

    const hasDateError = useMemo(() => {
        if (!startDate || !endDate) return false;
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        return isValid(start) && isValid(end) && end < start;
    }, [startDate, endDate]);

    const projectedBalance = availableDays - chargeDays;
    const isOverdraft = projectedBalance < 0;

    return (

        <WizardCard title="Request Details" scrollable={false}>
            <View className="space-y-6">
                {/* Heads Up Display (HUD) */}
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                        Leave Balance Calculator
                    </Text>
                    <View className="flex-row justify-between items-end">
                        {/* Available */}
                        <View>
                            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                                {availableDays.toFixed(1)}
                            </Text>
                            <Text className="text-xs text-slate-500 font-medium">Available</Text>
                        </View>

                        {/* Operator */}
                        <View className="mb-2">
                            <Text className="text-xl font-bold text-slate-300 dark:text-slate-600">-</Text>
                        </View>

                        {/* Cost */}
                        <View className="items-center">
                            <Text className={`text-2xl font-bold ${isOverdraft ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                {chargeDays.toFixed(1)}
                            </Text>
                            <Text className={`text-xs font-medium ${isOverdraft ? 'text-red-500/60' : 'text-blue-600/60 dark:text-blue-400/60'}`}>Cost</Text>
                        </View>

                        {/* Operator */}
                        <View className="mb-2">
                            <Text className="text-xl font-bold text-slate-300 dark:text-slate-600">=</Text>
                        </View>

                        {/* Remaining */}
                        <View className="items-end">
                            <Text className={`text-2xl font-bold ${isOverdraft ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                {projectedBalance.toFixed(1)}
                            </Text>
                            <Text className={`text-xs font-medium ${isOverdraft ? 'text-red-500/60' : 'text-green-600/60 dark:text-green-400/60'}`}>
                                Remaining
                            </Text>
                        </View>
                    </View>

                    {isOverdraft && (
                        <Animated.View entering={FadeIn} className="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30">
                            <Text className="text-xs font-bold text-red-500">
                                Warning: Sufficient balance not available.
                            </Text>
                        </Animated.View>
                    )}
                </View>

                {/* Leave Type Selection */}
                <View>
                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        Leave Type
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {LEAVE_TYPES.map((type) => {
                            const isSelected = leaveType === type.id;
                            return (
                                <Pressable
                                    key={type.id}
                                    onPress={() => onUpdate('leaveType', type.id)}
                                    className={`px-4 py-2 rounded-full border ${isSelected
                                        ? 'bg-blue-600 border-blue-600 dark:bg-blue-600 dark:border-blue-500'
                                        : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                        }`}
                                >
                                    <Text
                                        className={`${isSelected ? 'text-white font-bold' : 'text-slate-600 dark:text-slate-300 font-medium'
                                            }`}
                                    >
                                        {type.label}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </View>
                </View>

                {/* Date Selection */}
                <View>
                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        Dates
                    </Text>
                    <View className="flex-row gap-4">
                        {/* Start Date */}
                        <View className="flex-1">
                            <Text className="text-xs font-medium text-slate-500 mb-1.5 ml-1">Start Date</Text>
                            <View className={`flex-row items-center bg-white dark:bg-slate-800 rounded-xl px-4 py-3 border ${hasDateError ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}>
                                <Calendar size={18} color={themeColors.labelSecondary} className="mr-3" />
                                <TextInput
                                    className="flex-1 text-base font-medium text-slate-900 dark:text-white"
                                    placeholder="YYYY-MM-DD"
                                    value={startDate}
                                    onChangeText={(text) => onUpdate('startDate', text)}
                                    keyboardType="numbers-and-punctuation"
                                    placeholderTextColor={themeColors.labelSecondary} // Using approximated color from basic theme
                                />
                            </View>
                        </View>

                        {/* End Date */}
                        <View className="flex-1">
                            <Text className="text-xs font-medium text-slate-500 mb-1.5 ml-1">End Date</Text>
                            <View className={`flex-row items-center bg-white dark:bg-slate-800 rounded-xl px-4 py-3 border ${hasDateError ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}>
                                <Calendar size={18} color={themeColors.labelSecondary} className="mr-3" />
                                <TextInput
                                    className="flex-1 text-base font-medium text-slate-900 dark:text-white"
                                    placeholder="YYYY-MM-DD"
                                    value={endDate}
                                    onChangeText={(text) => onUpdate('endDate', text)}
                                    keyboardType="numbers-and-punctuation"
                                    placeholderTextColor={themeColors.labelSecondary}
                                />
                            </View>
                        </View>
                    </View>

                    {hasDateError && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <Text className="text-red-500 text-sm font-medium mt-2 ml-1">
                                End date cannot be before start date.
                            </Text>
                        </Animated.View>
                    )}
                </View>

                {/* Legal / Location Toggles */}
                <View>
                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        Location & Legal
                    </Text>

                    <View className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* CONUS Toggle */}
                        <View className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50">
                            <View className="flex-row items-center flex-1 mr-4">
                                <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
                                    <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                                </View>
                                <View>
                                    <Text className="text-base font-bold text-slate-900 dark:text-white">Leave inside CONUS?</Text>
                                    <Text className="text-xs text-slate-500 mt-0.5">Continental United States</Text>
                                </View>
                            </View>
                            <Switch
                                value={leaveInConus}
                                onValueChange={(val) => onUpdate('leaveInConus', val)}
                                trackColor={{ false: '#767577', true: '#2563EB' }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>

                        {/* Destination Country (Conditional) */}
                        {!leaveInConus && (
                            <Animated.View entering={FadeIn} exiting={FadeOut}>
                                <View className="flex-row items-center p-4 bg-slate-50 dark:bg-slate-900/30">
                                    <View className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 items-center justify-center mr-3">
                                        <Globe2 size={16} className="text-orange-600 dark:text-orange-400" />
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">Destination Country</Text>
                                            <Text className="text-xs text-orange-600 dark:text-orange-400 font-medium">OCONUS Required</Text>
                                        </View>
                                        <TextInput
                                            className="h-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 text-slate-900 dark:text-white"
                                            placeholder="e.g. Japan, Germany, Italy"
                                            value={destinationCountry}
                                            onChangeText={(text) => onUpdate('destinationCountry', text)}
                                            placeholderTextColor={themeColors.labelSecondary}
                                        />
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                    </View>
                </View>
            </View>
        </WizardCard>
    );
}
