import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { usePCSStore } from '@/store/usePCSStore';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ChevronRight, Clock, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function DateSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const currentDraft = usePCSStore((state) => state.currentDraft);
  const activeOrder = usePCSStore((state) => state.activeOrder);
  const updateDraft = usePCSStore((state) => state.updateDraft);

  // Default to today if no date set, or back-calculate from arrival if set
  const [selectedDate, setSelectedDate] = useState(() => {
    if (currentDraft?.dates?.projectedArrival) {
       const arrivalDate = new Date(currentDraft.dates.projectedArrival);
       // Check if valid date
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

  const handleDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  const estimatedArrival = useMemo(() => {
    if (!selectedDate) return null;
    const start = new Date(selectedDate);
    // Mock 4 days travel
    const arrival = new Date(start.getTime() + 4 * ONE_DAY_MS);
    return arrival;
  }, [selectedDate]);

  const handleNext = () => {
    if (estimatedArrival && currentDraft && selectedDate) {
       // Update draft with checkout (departure) and arrival dates
       updateDraft({
           dates: {
               ...currentDraft.dates,
               projectedDeparture: new Date(selectedDate).toISOString(),
               projectedArrival: estimatedArrival.toISOString(),
           }
       });
       router.push('./mode');
    }
  };

  if (!currentDraft) return null;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScreenHeader
        title={`${originName} → ${destName}`}
        subtitle="Step 1 of 3: Dates"
        leftAction={{ icon: X, onPress: () => router.back() }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="p-4">
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
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <TouchableOpacity
            onPress={handleNext}
            className="bg-blue-600 p-4 rounded-full flex-row justify-center items-center shadow-lg active:opacity-90"
        >
            <Text className="text-white font-bold text-lg mr-2">
                Next: Travel Mode
            </Text>
            <ChevronRight size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
