import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { calculateLeave } from '@/utils/leaveLogic';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { addDays, eachDayOfInterval, format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { AlertCircle, Clock, Lock } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
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
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: unknown) => void;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let marks: Record<string, any> = {};

        const rangeColor = isDark ? '#00204E' : '#AEC6FE';
        const rangeTextColor = isDark ? '#7189BC' : '#001A42';

        if (startDate && endDate) {
            // Force Noon to avoid timezone boundary issues with midnight dates
            const start = new Date(startDate + 'T12:00:00');
            const end = new Date(endDate + 'T12:00:00');

            if (start <= end) {
                const range = eachDayOfInterval({ start, end });

                range.forEach((date: Date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    // Intermediate days use the premium range color
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let mark: Record<string, any> = { color: rangeColor, textColor: rangeTextColor };

                    if (dateStr === startDate) {
                        mark = { ...mark, startingDay: true, color: themeColors.primary, textColor: isDark ? '#003258' : '#FFFFFF' };
                    }
                    if (dateStr === endDate) {
                        mark = { ...mark, endingDay: true, color: themeColors.primary, textColor: isDark ? '#003258' : '#FFFFFF' };
                    }
                    marks[dateStr] = mark;
                });
            }
        } else {
            if (startDate) {
                marks[startDate] = { startingDay: true, color: themeColors.primary, textColor: isDark ? '#003258' : '#FFFFFF', endingDay: true };
            }
        }

        return marks;
    }, [startDate, endDate, themeColors.primary, themeColors.onPrimary, isDark]);

    // Handle Day Press (Range Selection)
    const handleDayPress = (day: DateData) => {
        Haptics.selectionAsync();

        // Scenario 1: New Selection Flow (Reset if both set)
        if (startDate && endDate) {
            // User is starting a fresh selection
            onUpdate('startDate', day.dateString);
            onUpdate('endDate', ''); // Clear end date
            return;
        }

        // Scenario 2: No Start Date (Initial) -> Set Start
        if (!startDate) {
            onUpdate('startDate', day.dateString);
            return;
        }

        // Scenario 3: Start Date exists (Waiting for End Date)
        if (day.dateString < startDate) {
            // User tapped before current start -> Update Start
            onUpdate('startDate', day.dateString);
        } else if (day.dateString === startDate) {
            // User tapped same day -> Single Day Leave (Start = End)
            onUpdate('endDate', day.dateString);
        } else {
            // User tapped after Start -> Set End
            onUpdate('endDate', day.dateString);
        }
    };

    // Smart Correction Effect: Ensure End Date is never before Start Date
    // This catches manual updates or weird state flows.
    React.useEffect(() => {
        if (startDate && endDate) {
            if (endDate < startDate) {
                // Invalid state detected.
                // Auto-push End Date to Start + 0 (same day) or Start + 1?
                // Defaulting to "Same Day" (1 day leave) is safest minimum.
                // Or clear it? The requirement said "auto-update End = newStart + 1".
                const newEnd = addDays(new Date(startDate), 1);
                onUpdate('endDate', format(newEnd, 'yyyy-MM-dd'));
            }
        }
    }, [startDate, endDate]);

    // --- Time Handling ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // SEQUENTIAL REVEAL LOGIC
    // We only show the Calendar if a Leave Type is selected (or if dates already exist).
    const showCalendar = !!leaveType || !!startDate;
    // We only show the Time/Schedule section if we have a valid Date Range.
    const showTimeSection = !!startDate && !!endDate;

    return (
        <WizardCard title="Request Details" scrollable={!embedded} noPadding={true}>
            <View className="gap-6 pt-6 pb-6 px-4 md:px-6">
                {/* 1. Leave Type */}
                <View>
                    <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Leave Category</Text>
                    <Pressable
                        onPress={() => {
                            setShowLeaveTypePicker(!showLeaveTypePicker);
                            Haptics.selectionAsync();
                        }}
                        className="bg-surface-container p-4 rounded-none border border-outline-variant active:scale-[0.98] transition-transform"
                    >
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-base font-bold text-on-surface capitalize">
                                    {LEAVE_TYPE_OPTIONS.find(o => o.value === leaveType)?.label || 'Select Category...'}
                                </Text>
                                <Text className="text-xs text-on-surface-variant mt-0.5">
                                    {leaveType ? 'Category selected' : 'Tap to choose leave type'}
                                </Text>
                            </View>
                            <Text className="text-primary font-medium">{showLeaveTypePicker ? 'Close' : 'Change'}</Text>
                        </View>
                    </Pressable>

                    {/* Inline Leave Type Picker */}
                    {showLeaveTypePicker && (
                        <Animated.View entering={FadeIn.duration(200)} className="mt-2 border border-outline-variant bg-surface rounded-none overflow-hidden">
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
                                        className={`flex-row items-center justify-between p-4 border-b border-outline-variant ${isSelected ? 'bg-primary-container' : 'bg-surface'}`}
                                    >
                                        <Text className={`font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                                            {option.label}
                                        </Text>
                                        {isSelected && (
                                            <View className="w-5 h-5 rounded-none bg-primary items-center justify-center">
                                                <View className="w-2 h-2 rounded-none bg-on-primary" />
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </Animated.View>
                    )}
                </View>

                {/* 2. Premium Calendar (Progressive Reveal) */}
                {showCalendar && (
                    <Animated.View entering={FadeIn.delay(100).springify()}>
                        <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Select Dates</Text>
                        <View className="bg-surface rounded-none overflow-hidden border border-outline-variant">
                            <Calendar
                                key={colorScheme}
                                current={startDate || undefined}
                                onDayPress={handleDayPress}
                                markingType={'period'}
                                markedDates={markedDates}
                                theme={{
                                    calendarBackground: themeColors.surface,
                                    textSectionTitleColor: isDark ? '#C4C6D0' : '#44474F',
                                    selectedDayBackgroundColor: themeColors.primary,
                                    selectedDayTextColor: isDark ? '#003258' : '#FFFFFF',
                                    todayTextColor: themeColors.primary,
                                    dayTextColor: isDark ? '#E5E2E1' : '#1A1B1F',
                                    textDisabledColor: isDark ? '#44474F' : '#C4C6D0',
                                    arrowColor: themeColors.primary,
                                    monthTextColor: isDark ? '#E5E2E1' : '#1A1B1F',
                                    textDayFontWeight: '600',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: '500',
                                }}
                            />
                        </View>
                        {/* Range Display */}
                        <View className="flex-row justify-between mt-3 px-1">
                            <Pressable onPress={() => {
                                onUpdate('startDate', '');
                                onUpdate('endDate', '');
                                Haptics.selectionAsync();
                            }}>
                                <Text className="text-xs text-on-surface-variant dark:text-slate-400 mb-1">Start Date</Text>
                                <Text className={`font-bold ${startDate ? 'text-on-surface dark:text-white' : 'text-outline-variant dark:text-slate-500'}`}>
                                    {startDate || 'Select'}
                                </Text>
                            </Pressable>
                            <View className="items-end">
                                <Text className="text-xs text-on-surface-variant dark:text-slate-400 mb-1">End Date</Text>
                                <Text className={`font-bold ${endDate ? 'text-on-surface dark:text-white' : 'text-outline-variant dark:text-slate-500'}`}>
                                    {endDate || 'Select'}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* 3. Time & Working Hours Logic (Progressive Reveal) */}
                {showTimeSection && (
                    <Animated.View entering={FadeIn.delay(200).springify()} className="gap-4">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Time & Schedule</Text>
                        </View>

                        {/* Start Block */}
                        <View className="bg-surface-container p-3 rounded-none border border-outline-variant">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center">
                                    <View className="bg-primary-container p-1.5 rounded-none mr-2">
                                        <Clock size={16} color={isDark ? '#338EF7' : '#000A23'} className="text-primary" />
                                    </View>
                                    <View>
                                        <Text className="font-bold text-on-surface">Departure</Text>
                                        <Text className="text-[10px] text-on-surface-variant font-medium">
                                            {WORKING_HOURS_OPTIONS.find(o => o.value === departureWorkingHours)?.label || 'Custom'}
                                        </Text>
                                    </View>
                                </View>
                                <Pressable
                                    onPress={() => setHoursField(hoursField === 'departure' ? null : 'departure')}
                                    className="bg-surface px-3 py-1.5 rounded-none border border-outline-variant"
                                >
                                    <Text className="text-xs font-bold text-on-surface-variant">Edit Hours</Text>
                                </Pressable>
                            </View>

                            {/* Inline Departure Hours Picker */}
                            {hoursField === 'departure' && (
                                <Animated.View entering={FadeIn.duration(200)} className="mb-3 border border-outline-variant bg-surface rounded-none overflow-hidden">
                                    {WORKING_HOURS_OPTIONS.map((option) => {
                                        const isSelected = departureWorkingHours === option.value;
                                        return (
                                            <Pressable
                                                key={option.value}
                                                onPress={() => {
                                                    onUpdate('departureWorkingHours', option.value);
                                                    setHoursField(null);
                                                    Haptics.selectionAsync();
                                                }}
                                                className={`flex-row items-center justify-between p-3 border-b border-outline-variant ${isSelected ? 'bg-primary-container' : 'bg-surface'}`}
                                            >
                                                <Text className={`font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                                                    {option.label}
                                                </Text>
                                                {isSelected && (
                                                    <View className="w-4 h-4 rounded-none bg-primary items-center justify-center">
                                                        <View className="w-1.5 h-1.5 rounded-none bg-on-primary" />
                                                    </View>
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </Animated.View>
                            )}

                            <View className="bg-surface-variant p-3 rounded-none border border-outline-variant flex-row justify-between items-center opacity-80">
                                <Text className="text-xs text-on-surface-variant font-medium">Locked to End of Working Day</Text>
                                <View className="flex-row items-center gap-1.5">
                                    <Text className="font-bold text-on-surface-variant">{startTime}</Text>
                                    <Lock size={12} color={isDark ? '#C4C6D0' : '#44474F'} className="text-on-surface-variant" />
                                </View>
                            </View>
                        </View>

                        {/* End Block */}
                        <View className="bg-surface-container p-3 rounded-none border border-outline-variant">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center">
                                    <View className="bg-secondary-container p-1.5 rounded-none mr-2">
                                        <Clock size={16} color={isDark ? '#6C5200' : '#6D5200'} className="text-on-secondary-container" />
                                    </View>
                                    <View>
                                        <Text className="font-bold text-on-surface">Return</Text>
                                        <Text className="text-[10px] text-on-surface-variant font-medium">
                                            {WORKING_HOURS_OPTIONS.find(o => o.value === returnWorkingHours)?.label || 'Custom'}
                                        </Text>
                                    </View>
                                </View>
                                <Pressable
                                    onPress={() => setHoursField(hoursField === 'return' ? null : 'return')}
                                    className="bg-surface px-3 py-1.5 rounded-none border border-outline-variant"
                                >
                                    <Text className="text-xs font-bold text-on-surface-variant">Edit Hours</Text>
                                </Pressable>
                            </View>

                            {/* Inline Return Hours Picker */}
                            {hoursField === 'return' && (
                                <Animated.View entering={FadeIn.duration(200)} className="mb-3 border border-outline-variant bg-surface rounded-none overflow-hidden">
                                    {WORKING_HOURS_OPTIONS.map((option) => {
                                        const isSelected = returnWorkingHours === option.value;
                                        return (
                                            <Pressable
                                                key={option.value}
                                                onPress={() => {
                                                    onUpdate('returnWorkingHours', option.value);
                                                    setHoursField(null);
                                                    Haptics.selectionAsync();
                                                }}
                                                className={`flex-row items-center justify-between p-3 border-b border-outline-variant ${isSelected ? 'bg-primary-container' : 'bg-surface'}`}
                                            >
                                                <Text className={`font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                                                    {option.label}
                                                </Text>
                                                {isSelected && (
                                                    <View className="w-4 h-4 rounded-none bg-primary items-center justify-center">
                                                        <View className="w-1.5 h-1.5 rounded-none bg-on-primary" />
                                                    </View>
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </Animated.View>
                            )}

                            <View className="bg-surface-variant p-3 rounded-none border border-outline-variant flex-row justify-between items-center opacity-80">
                                <Text className="text-xs text-on-surface-variant font-medium">Locked to Start of Working Day</Text>
                                <View className="flex-row items-center gap-1.5">
                                    <Text className="font-bold text-on-surface-variant">{endTime}</Text>
                                    <Lock size={12} color={isDark ? '#C4C6D0' : '#44474F'} className="text-on-surface-variant" />
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Errors / Warnings */}
                {errors.length > 0 && (
                    <Animated.View entering={FadeIn} className="bg-error-container p-3 rounded-none flex-row items-start">
                        <AlertCircle size={16} color={isDark ? '#FFDAD6' : '#93000A'} className="text-on-error-container mt-0.5 mr-2" />
                        <View>
                            {errors.map((err, i) => (
                                <Text key={i} className="text-on-error-container text-xs font-medium mb-1">
                                    • {err}
                                </Text>
                            ))}
                        </View>
                    </Animated.View>
                )}
            </View>

            {/* iOS Time Picker Overlay (Inline) */}
            {Platform.OS === 'ios' && showTimePicker && (
                <Animated.View entering={FadeIn.duration(200)} className="mx-4 mb-4 bg-surface rounded-none border border-outline-variant p-4">
                    <View className="flex-row justify-between mb-4 border-b border-outline-variant pb-2">
                        <Text className="text-lg font-bold text-on-surface">Select Time</Text>
                        <Pressable onPress={() => setShowTimePicker(false)}>
                            <Text className="text-primary font-bold text-lg">Done</Text>
                        </Pressable>
                    </View>
                    <DateTimePicker
                        value={new Date()}
                        mode="time"
                        display="spinner"
                        onChange={handleTimeChange}
                        themeVariant={colorScheme}
                    />
                </Animated.View>
            )}

        </WizardCard>
    );
}
