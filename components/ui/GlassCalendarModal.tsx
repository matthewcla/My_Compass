import { X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

interface GlassCalendarModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    selectedDate: Date;
    minDate?: Date;
    title?: string;
}

export function GlassCalendarModal({
    visible,
    onClose,
    onSelect,
    selectedDate,
    minDate,
    title = 'Select Date',
}: GlassCalendarModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    // Theme Colors
    const theme = useMemo(() => ({
        backgroundColor: 'transparent',
        calendarBackground: 'transparent',
        textSectionTitleColor: isDark ? '#94a3b8' : '#64748b',
        selectedDayBackgroundColor: isDark ? '#3b82f6' : '#2563eb',
        selectedDayTextColor: '#ffffff',
        todayTextColor: isDark ? '#60a5fa' : '#3b82f6',
        dayTextColor: isDark ? '#f8fafc' : '#1e293b',
        textDisabledColor: isDark ? '#334155' : '#cbd5e1',
        arrowColor: isDark ? '#60a5fa' : '#3b82f6',
        monthTextColor: isDark ? '#f8fafc' : '#1e293b',
        indicatorColor: isDark ? '#60a5fa' : '#3b82f6',
        textDayFontFamily: 'System',
        textMonthFontFamily: 'System',
        textDayHeaderFontFamily: 'System',
        textDayFontWeight: '500' as const,
        textMonthFontWeight: 'bold' as const,
        textDayHeaderFontWeight: 'bold' as const,
        textDayFontSize: 16,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 12
    }), [isDark]);

    const markedDates = useMemo(() => {
        const dateString = selectedDate.toISOString().split('T')[0];
        return {
            [dateString]: {
                selected: true,
                selectedColor: isDark ? '#3b82f6' : '#2563eb',
            }
        };
    }, [selectedDate, isDark]);

    const handleDayPress = (day: DateData) => {
        // Create date component-wise to avoid timezone shifts
        const newDate = new Date(day.timestamp);
        // Adjust for timezone offset to ensure the date matches what was tapped
        const offset = newDate.getTimezoneOffset() * 60000;
        const localDate = new Date(newDate.getTime() + offset);

        onSelect(localDate);
        onClose();
    };

    if (!visible) return null;

    // Replaced Native Modal with absolute View to fix Navigation Context Crash (Expo 54/RN 0.76+)
    return (
        <View
            testID="glass-calendar-modal"
            className="absolute inset-0 z-50 flex-1 items-center justify-center bg-black/60"
            // Ensure this sits on top of everything within its stacking context
            style={{ elevation: 100 }}
        >
            {/* Backdrop Tap to Close */}
            <Pressable className="absolute inset-0" onPress={onClose} />

            <View className="w-[90%] max-w-[360px]">
                <View
                    className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900"
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                        <Text className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">
                            {title}
                        </Text>
                        <Pressable
                            onPress={onClose}
                            className="p-1 rounded-full bg-slate-200/50 dark:bg-white/10 active:opacity-70"
                        >
                            <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                        </Pressable>
                    </View>

                    {/* Calendar */}
                    <View className="p-2">
                        <Calendar
                            current={selectedDate.toISOString().split('T')[0]}
                            minDate={minDate ? minDate.toISOString().split('T')[0] : undefined}
                            onDayPress={handleDayPress}
                            monthFormat={'MMMM yyyy'}
                            hideExtraDays={true}
                            firstDay={1}
                            markedDates={markedDates}
                            theme={theme}
                            enableSwipeMonths={true}
                        />
                    </View>

                    {/* Footer Hint */}
                    <View className="p-3 bg-slate-50/50 dark:bg-black/20 border-t border-slate-200/50 dark:border-white/5">
                        <Text className="text-center text-xs text-slate-500 font-medium">
                            Swipe to change months
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({});
