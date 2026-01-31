import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { calculateLeave } from '@/utils/leaveLogic';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { eachDayOfInterval, format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { AlertCircle, Clock } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import Animated, { FadeIn, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';

// --- Types & Constants ---
const WORKING_HOURS_OPTIONS = [
    { label: 'Standard (07:30 - 16:00)', value: '0730-1600' },
    { label: 'Early (07:00 - 15:30)', value: '0700-1530' },
    { label: 'Late (08:00 - 16:30)', value: '0800-1630' },
    { label: 'Watch (07:00 - 07:00)', value: '0700-0700' },
    { label: 'None (Non-Workday)', value: 'NONE' },
] as const;

const LEAVE_TYPE_OPTIONS = [
    { label: 'Annual Leave', value: 'annual' },
    { label: 'Emergency Leave', value: 'emergency' },
    { label: 'Convalescent Leave', value: 'convalescent' },
    { label: 'Terminal Leave', value: 'terminal' },
    { label: 'Parental Leave', value: 'parental' },
    { label: 'Bereavement Leave', value: 'bereavement' },
    { label: 'Adoption Leave', value: 'adoption' },
    { label: 'Permissive TDY (PTDY)', value: 'ptdy' },
    { label: 'Other', value: 'other' },
] as const;

interface Step1IntentProps {
    leaveType?: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    departureWorkingHours?: string;
    returnWorkingHours?: string;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
    embedded?: boolean;
}

export function Step1Intent({
    leaveType,
    startDate,
    endDate,
    startTime = '08:00',
    endTime = '16:00',
    departureWorkingHours = '0730-1600',
    returnWorkingHours = '0730-1600',
    onUpdate,
    embedded = false
}: Step1IntentProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[colorScheme];

    // Access store for balance
    const leaveBalance = useLeaveStore((state) => state.leaveBalance);
    const availableDays = leaveBalance?.currentBalance ?? 0;

    // --- Time Picker State ---
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timeField, setTimeField] = useState<'startTime' | 'endTime' | null>(null);
    const [hoursField, setHoursField] = useState<'departure' | 'return' | null>(null);
    const [showLeaveTypePicker, setShowLeaveTypePicker] = useState(false);

    // --- Validation Logic ---
    const calculation = useMemo(() => {
        return calculateLeave({
            startDate,
            endDate,
            startTime,
            endTime,
            departureWorkingHours,
            returnWorkingHours
        }, availableDays);
    }, [startDate, endDate, startTime, endTime, departureWorkingHours, returnWorkingHours, availableDays]);

    const { chargeableDays, projectedBalance, isOverdraft, errors } = calculation;

    // --- Calendar Marking ---
    const markedDates = useMemo(() => {
        let marks: any = {};

        // Premium Range Colors
        // Light Mode: Use a solid light blue (Tailwind blue-100 equivalent) for a distinct "connected" strip
        // Dark Mode: Use the app's Navy Light (#1E3A5F) for consistency and premium feel
        const rangeColor = isDark ? Colors.dark.navyLight : '#DBEAFE';
        const rangeTextColor = isDark ? '#FFFFFF' : themeColors.tint;

        if (startDate && endDate) {
            // Force Noon to avoid timezone boundary issues with midnight dates
            const start = new Date(startDate + 'T12:00:00');
            const end = new Date(endDate + 'T12:00:00');

            if (start <= end) {
                const range = eachDayOfInterval({ start, end });

                range.forEach((date: Date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    // Intermediate days use the premium range color
                    let mark: any = { color: rangeColor, textColor: rangeTextColor };

                    if (dateStr === startDate) {
                        mark = { ...mark, startingDay: true, color: themeColors.tint, textColor: 'white' };
                    }
                    if (dateStr === endDate) {
                        mark = { ...mark, endingDay: true, color: themeColors.tint, textColor: 'white' };
                    }
                    marks[dateStr] = mark;
                });
            }
        } else {
            if (startDate) {
                marks[startDate] = { startingDay: true, color: themeColors.tint, textColor: 'white', endingDay: true };
            }
        }

        return marks;
    }, [startDate, endDate, themeColors.tint, isDark]);

    // Handle Day Press (Range Selection)
    const handleDayPress = (day: DateData) => {
        Haptics.selectionAsync();
        if (!startDate || (startDate && endDate)) {
            // New range start
            onUpdate('startDate', day.dateString);
            onUpdate('endDate', '');
        } else {
            // Range end
            if (day.dateString < startDate) {
                // If selected before start, reset start
                onUpdate('startDate', day.dateString);
            } else {
                onUpdate('endDate', day.dateString);
            }
        }
    };

    // --- Time Handling ---
    const handleTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            if (event.type === 'dismissed') {
                setShowTimePicker(false);
                return;
            }
            setShowTimePicker(false);
        }

        if (selectedDate && timeField) {
            const timeStr = format(selectedDate, 'HH:mm');
            onUpdate(timeField, timeStr);
            Haptics.selectionAsync();
        }
    };

    const openTimePicker = (field: 'startTime' | 'endTime') => {
        setTimeField(field);

        if (Platform.OS === 'android') {
            const currentVal = field === 'startTime' ? startTime : endTime;
            const [h, m] = currentVal.split(':').map(Number);
            const d = new Date();
            d.setHours(h || 0);
            d.setMinutes(m || 0);

            DateTimePickerAndroid.open({
                value: d,
                mode: 'time',
                is24Hour: true,
                onChange: handleTimeChange,
            });
        } else {
            setShowTimePicker(true);
        }
    };

    // --- Animations ---
    const shakeStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateX: isOverdraft ? withSequence(withTiming(-5), withTiming(5), withTiming(0)) : 0
            }]
        };
    }, [isOverdraft]);

    return (
        <WizardCard title="Request Details" scrollable={!embedded}>
            <View className="gap-6 pb-24">
                {/* 1. Leave Type */}
                <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Leave Category</Text>
                    <Pressable
                        onPress={() => {
                            setShowLeaveTypePicker(true);
                            Haptics.selectionAsync();
                        }}
                        className="bg-inputBackground p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-base font-bold text-slate-900 dark:text-white capitalize">
                                    {LEAVE_TYPE_OPTIONS.find(o => o.value === leaveType)?.label || 'Annual Leave'}
                                </Text>
                                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {leaveType ? 'Category selected' : 'Standard chargeable leave'}
                                </Text>
                            </View>
                            <Text className="text-blue-500 font-medium">Change</Text>
                        </View>
                    </Pressable>
                </View>

                {/* 2. Premium Calendar */}
                <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Dates</Text>
                    <View className="bg-cardBackground dark:bg-black rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Calendar
                            key={colorScheme}
                            current={startDate || undefined}
                            onDayPress={handleDayPress}
                            markingType={'period'}
                            markedDates={markedDates}
                            theme={{
                                calendarBackground: isDark ? themeColors.background : '#ffffff',
                                textSectionTitleColor: isDark ? '#94a3b8' : '#b6c1cd',
                                selectedDayBackgroundColor: themeColors.tint,
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: themeColors.tint,
                                dayTextColor: isDark ? '#e2e8f0' : '#2d4150',
                                textDisabledColor: isDark ? '#334155' : '#d9e1e8',
                                arrowColor: themeColors.tint,
                                monthTextColor: isDark ? '#f8fafc' : '#1e293b',
                                textDayFontWeight: '600',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '500',
                            }}
                        />
                    </View>
                    {/* Range Display */}
                    <View className="flex-row justify-between mt-3 px-1">
                        <View>
                            <Text className="text-xs text-slate-500 mb-1">Start Date</Text>
                            <Text className={`font-bold ${startDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                {startDate || 'Select'}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs text-slate-500 mb-1">End Date</Text>
                            <Text className={`font-bold ${endDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                {endDate || 'Select'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 3. Time & Working Hours Logic */}
                <View className="gap-4">
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time & Schedule</Text>

                    {/* Start Block */}
                    {/* Start Block */}
                    <View className="bg-inputBackground p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md mr-2">
                                <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                            </View>
                            <Text className="font-bold text-slate-700 dark:text-slate-300">Departure</Text>
                        </View>

                        <View className="flex-row gap-4">
                            {/* Time Picker */}
                            <Pressable
                                onPress={() => openTimePicker('startTime')}
                                className="flex-1 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-600"
                            >
                                <Text className="text-xs text-slate-500 mb-0.5">Time</Text>
                                <Text className="font-bold text-slate-900 dark:text-white">{startTime}</Text>
                            </Pressable>

                            {/* Working Hours Dropdown Stub */}
                            <Pressable
                                onPress={() => setHoursField('departure')}
                                className="flex-1 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-600"
                            // In real app, open modal to select options
                            >
                                <Text className="text-xs text-slate-500 mb-0.5">Working Hours</Text>
                                <Text className="font-bold text-slate-900 dark:text-white text-xs truncate" numberOfLines={1}>
                                    {WORKING_HOURS_OPTIONS.find(o => o.value === departureWorkingHours)?.label || departureWorkingHours}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* End Block */}
                    {/* End Block */}
                    <View className="bg-inputBackground p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-md mr-2">
                                <Clock size={16} className="text-orange-600 dark:text-orange-400" />
                            </View>
                            <Text className="font-bold text-slate-700 dark:text-slate-300">Return</Text>
                        </View>

                        <View className="flex-row gap-4">
                            {/* Time Picker */}
                            <Pressable
                                onPress={() => openTimePicker('endTime')}
                                className="flex-1 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-600"
                            >
                                <Text className="text-xs text-slate-500 mb-0.5">Time</Text>
                                <Text className="font-bold text-slate-900 dark:text-white">{endTime}</Text>
                            </Pressable>

                            {/* Working Hours Dropdown Stub */}
                            <Pressable
                                onPress={() => setHoursField('return')}
                                className="flex-1 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-600"
                            >
                                <Text className="text-xs text-slate-500 mb-0.5">Working Hours</Text>
                                <Text className="font-bold text-slate-900 dark:text-white text-xs truncate" numberOfLines={1}>
                                    {WORKING_HOURS_OPTIONS.find(o => o.value === returnWorkingHours)?.label || returnWorkingHours}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Errors / Warnings */}
                {errors.length > 0 && (
                    <Animated.View entering={FadeIn} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex-row items-start">
                        <AlertCircle size={16} className="text-red-500 mt-0.5 mr-2" />
                        <View>
                            {errors.map((err, i) => (
                                <Text key={i} className="text-red-600 dark:text-red-400 text-xs font-medium mb-1">
                                    • {err}
                                </Text>
                            ))}
                        </View>
                    </Animated.View>
                )}




            </View>

            {/* iOS Time Picker Modal */}
            {Platform.OS === 'ios' && (
                <Modal
                    visible={showTimePicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowTimePicker(false)}
                >
                    <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }} onPress={() => setShowTimePicker(false)}>
                        <View className="bg-white dark:bg-slate-800 pb-8 pt-4 rounded-t-3xl">
                            <View className="flex-row justify-between px-4 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                                <Text className="text-lg font-bold text-slate-900 dark:text-white">
                                    Select Time
                                </Text>
                                <Pressable onPress={() => setShowTimePicker(false)}>
                                    <Text className="text-blue-600 font-bold text-lg">Done</Text>
                                </Pressable>
                            </View>
                            {/* Note: In a real implementation we need to pass a valid Date object derived from existing string */}
                            <DateTimePicker
                                value={new Date()}
                                mode="time"
                                display="spinner"
                                onChange={handleTimeChange}
                                themeVariant={colorScheme}
                            />
                        </View>
                    </Pressable>
                </Modal>
            )}

            {/* Working Hours Picker Modal (Universal) */}
            <Modal
                visible={!!hoursField}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setHoursField(null)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}
                    onPress={() => setHoursField(null)}
                >
                    <View className="bg-white dark:bg-slate-800 rounded-t-3xl overflow-hidden max-h-[70%]">
                        <View className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-slate-900 dark:text-white">
                                Select Schedule
                            </Text>
                            <Pressable onPress={() => setHoursField(null)}>
                                <View className="bg-slate-200 dark:bg-slate-700 rounded-full p-1">
                                    <Text className="text-slate-500 dark:text-slate-400 font-bold px-2">Close</Text>
                                </View>
                            </Pressable>
                        </View>

                        <View className="p-4 pb-10 gap-2">
                            {WORKING_HOURS_OPTIONS.map((option) => {
                                const currentVal = hoursField === 'departure' ? departureWorkingHours : returnWorkingHours;
                                const isSelected = currentVal === option.value;

                                return (
                                    <Pressable
                                        key={option.value}
                                        onPress={() => {
                                            if (hoursField) {
                                                onUpdate(hoursField === 'departure' ? 'departureWorkingHours' : 'returnWorkingHours', option.value);
                                                setHoursField(null);
                                                Haptics.selectionAsync();
                                            }
                                        }}
                                        className={`flex-row items-center justify-between p-4 rounded-xl border ${isSelected
                                            ? 'bg-blue-50 dark:bg-slate-800 border-blue-500 dark:border-blue-500'
                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                                            }`}
                                    >
                                        <Text className={`font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {option.label}
                                        </Text>
                                        {isSelected && (
                                            <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center">
                                                <View className="w-2 h-2 rounded-full bg-white" />
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </Pressable>
            </Modal>

            {/* Leave Type Picker Modal */}
            <Modal
                visible={showLeaveTypePicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLeaveTypePicker(false)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}
                    onPress={() => setShowLeaveTypePicker(false)}
                >
                    <View className="bg-white dark:bg-slate-800 rounded-t-3xl overflow-hidden max-h-[70%]">
                        <View className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-slate-900 dark:text-white">
                                Select Leave Category
                            </Text>
                            <Pressable onPress={() => setShowLeaveTypePicker(false)}>
                                <View className="bg-slate-200 dark:bg-slate-700 rounded-full p-1">
                                    <Text className="text-slate-500 dark:text-slate-400 font-bold px-2">Close</Text>
                                </View>
                            </Pressable>
                        </View>

                        <View className="p-4 pb-10 gap-2">
                            {LEAVE_TYPE_OPTIONS.map((option) => {
                                const isSelected = (leaveType || 'annual') === option.value;

                                return (
                                    <Pressable
                                        key={option.value}
                                        onPress={() => {
                                            onUpdate('leaveType', option.value);
                                            setShowLeaveTypePicker(false);
                                            Haptics.selectionAsync();
                                        }}
                                        className={`flex-row items-center justify-between p-4 rounded-xl border ${isSelected
                                            ? 'bg-blue-50 dark:bg-slate-800 border-blue-500 dark:border-blue-500'
                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                                            }`}
                                    >
                                        <Text className={`font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {option.label}
                                        </Text>
                                        {isSelected && (
                                            <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center">
                                                <View className="w-2 h-2 rounded-full bg-white" />
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </WizardCard>
    );
}
