import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { PerDiemDay } from '@/types/travelClaim';
import { Coffee, Moon, Sun, Utensils } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export interface TravelStep4Props {
  perDiemDays: PerDiemDay[];
  onUpdate: (field: 'perDiemDays', value: PerDiemDay[]) => void;
  embedded?: boolean;
}

const formatMoney = (value: number): string => `$${value.toFixed(2)}`;
const toDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });

export function TravelStep4Meals({
  perDiemDays,
  onUpdate,
  embedded = false,
}: TravelStep4Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [days, setDays] = useState<PerDiemDay[]>(perDiemDays || []);

  useEffect(() => {
    setDays(perDiemDays || []);
  }, [perDiemDays]);

  const toggleMeal = (dateIso: string, meal: 'breakfastProvided' | 'lunchProvided' | 'dinnerProvided') => {
     const next = days.map(day => {
        if (day.date === dateIso) {
            return { ...day, [meal]: !day[meal] };
        }
        return day;
     });
     setDays(next);
     onUpdate('perDiemDays', next);
  };

  const toggleAll = (meal: 'breakfastProvided' | 'lunchProvided' | 'dinnerProvided') => {
      // Check if all are currently checked
      const allChecked = days.every(d => d[meal]);
      const next = days.map(d => ({ ...d, [meal]: !allChecked }));
      setDays(next);
      onUpdate('perDiemDays', next);
  };

  return (
    <WizardCard title="Meals & Incidentals" scrollable={!embedded} noPadding={true}>
      <View className="p-4 gap-4">
        <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
            <View className="flex-row items-center gap-2 mb-2">
                <Utensils size={18} className="text-blue-600 dark:text-blue-400" />
                <Text className="font-bold text-blue-800 dark:text-blue-200">Gov. Meals Deductible</Text>
            </View>
            <Text className="text-xs text-blue-700 dark:text-blue-300 leading-5">
                Select meals that were provided to you at no cost (e.g. conference meals, galley). These will be deducted from your per diem.
            </Text>
        </View>

        {days.length === 0 ? (
            <View className="p-8 items-center justify-center">
                <Text className="text-slate-400 text-center">No travel dates set. Please complete Step 1.</Text>
            </View>
        ) : (
            <View>
                {/* Header Actions */}
                <View className="flex-row justify-end gap-4 mb-3 px-2">
                    <Pressable onPress={() => toggleAll('breakfastProvided')}>
                         <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Bkfst</Text>
                    </Pressable>
                     <Pressable onPress={() => toggleAll('lunchProvided')}>
                         <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Lunch</Text>
                    </Pressable>
                     <Pressable onPress={() => toggleAll('dinnerProvided')}>
                         <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Dinner</Text>
                    </Pressable>
                </View>

                <Animated.View className="gap-2">
                    {days.map((day, idx) => (
                        <Animated.View
                            key={day.date}
                            entering={FadeInDown.delay(idx * 30)}
                            className="flex-row items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                        >
                            <View className="w-24">
                                <Text className="font-semibold text-slate-700 dark:text-slate-200">{toDate(day.date)}</Text>
                                <Text className="text-[10px] text-slate-400">{day.locality}</Text>
                            </View>

                            <View className="flex-1 flex-row justify-end gap-2">
                                <MealToggle
                                    icon={<Sun size={14} />}
                                    label="B"
                                    active={day.breakfastProvided}
                                    onPress={() => toggleMeal(day.date, 'breakfastProvided')}
                                />
                                <MealToggle
                                    icon={<Sun size={14} />}
                                    label="L"
                                    active={day.lunchProvided}
                                    onPress={() => toggleMeal(day.date, 'lunchProvided')}
                                />
                                <MealToggle
                                    icon={<Moon size={14} />}
                                    label="D"
                                    active={day.dinnerProvided}
                                    onPress={() => toggleMeal(day.date, 'dinnerProvided')}
                                />
                            </View>
                        </Animated.View>
                    ))}
                </Animated.View>
            </View>
        )}
      </View>
    </WizardCard>
  );
}

function MealToggle({ icon, label, active, onPress }: any) {
    return (
        <Pressable
            onPress={onPress}
            className={`w-10 h-10 rounded-full items-center justify-center border ${
                active
                ? 'bg-blue-600 border-blue-600'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
            }`}
        >
            {React.cloneElement(icon, { color: active ? 'white' : '#94a3b8' })}
        </Pressable>
    )
}
