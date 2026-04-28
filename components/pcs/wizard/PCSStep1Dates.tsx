import { useColorScheme } from '@/components/useColorScheme';
import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { usePCSStore } from '@/store/usePCSStore';
import { Clock } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface PCSStep1DatesProps {
    embedded?: boolean;
}

export function PCSStep1Dates({ embedded = false }: PCSStep1DatesProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const currentDraft = usePCSStore((state) => state.currentDraft);
    const activeOrder = usePCSStore((state) => state.activeOrder);
    const updateDraft = usePCSStore((state) => state.updateDraft);

    const [selectedDate, setSelectedDate] = useState(() => {
        if (currentDraft?.dates?.projectedArrival) {
            const arrivalDate = new Date(currentDraft.dates.projectedArrival);
            if (!isNaN(arrivalDate.getTime())) {
                return new Date(arrivalDate.getTime() - 4 * ONE_DAY_MS).toISOString().split('T')[0];
            }
        }
        return new Date().toISOString().split('T')[0];
    });

    const { originName, destName, minDate } = useMemo(() => {
        if (!currentDraft || !activeOrder) return { originName: 'Origin', destName: 'Destination', minDate: undefined };
        const index = activeOrder.segments.findIndex(s => s.id === currentDraft.id);
        const prev = index > 0 ? activeOrder.segments[index - 1] : null;
        return {
            originName: prev?.location.name || 'Origin',
            destName: currentDraft.location.name || 'Destination',
            minDate: prev?.dates?.projectedArrival?.split('T')[0]
        };
    }, [currentDraft, activeOrder]);

    const estimatedArrival = useMemo(() => {
        if (!selectedDate) return null;
        const start = new Date(selectedDate);
        const arrival = new Date(start.getTime() + 4 * ONE_DAY_MS);
        return arrival;
    }, [selectedDate]);

    const handleDateSelect = (day: { dateString: string }) => {
        setSelectedDate(day.dateString);
        if (currentDraft) {
            const start = new Date(day.dateString);
            const arrival = new Date(start.getTime() + 4 * ONE_DAY_MS);
            updateDraft({
                dates: {
                    ...currentDraft.dates,
                    projectedDeparture: start.toISOString(),
                    projectedArrival: arrival.toISOString(),
                }
            });
        }
    };

    if (!currentDraft) return null;

    const content = (
        <View>
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Select Checkout Date
            </Text>

            <View className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                <Calendar
                    onDayPress={handleDateSelect}
                    markedDates={{
                        [selectedDate]: { selected: true, selectedColor: colors.tint }
                    }}
                    minDate={minDate}
                    theme={{
                        calendarBackground: 'transparent',
                        textSectionTitleColor: '#b6c1cd',
                        selectedDayBackgroundColor: colors.tint,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: colors.tint,
                        dayTextColor: colorScheme === 'dark' ? '#fff' : '#2d4150',
                        textDisabledColor: '#d9e1e8',
                        monthTextColor: colorScheme === 'dark' ? '#fff' : '#2d4150',
                        arrowColor: colors.tint,
                    }}
                />
            </View>

            {estimatedArrival && (
                <View className="mt-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex-row items-center gap-4">
                    <View className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center">
                        <Clock size={24} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Estimated Arrival
                        </Text>
                        <Text className="text-lg font-bold text-slate-900 dark:text-white">
                            {estimatedArrival.toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </Text>
                        <Text className="text-xs text-slate-400 mt-1">
                            Based on 4 days travel time
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    if (embedded) return content;

    return (
        <WizardCard title="Dates" scrollable={false}>
            {content}
        </WizardCard>
    );
}
