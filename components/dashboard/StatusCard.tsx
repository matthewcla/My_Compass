import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { Calendar } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface StatusCardProps {
    nextCycle: string;
    daysUntilOpen: number;
}

export function StatusCard({ nextCycle, daysUntilOpen }: StatusCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const iconColor = isDark ? '#60A5FA' : '#2563EB'; // blue-400 : blue-600

    return (
        <View className="flex flex-col gap-2">
            <GlassView
                intensity={60}
                tint={isDark ? 'dark' : 'light'}
                className="border-l-4 border-blue-600 dark:border-blue-400 pl-3 pr-2 py-2.5 rounded-r-lg overflow-hidden flex-row items-start justify-between"
            >
                <View className="flex-row items-center gap-2.5">
                    <Calendar size={16} color={iconColor} />
                    <View>
                        <Text className="text-blue-900 dark:text-blue-100 text-xs font-bold leading-none mb-0.5">Cycle Closed</Text>
                        <Text className="text-blue-700 dark:text-blue-300 text-[10px] leading-tight">
                            {nextCycle} opens in <Text className="font-bold">{daysUntilOpen} days</Text>.
                        </Text>
                    </View>
                </View>
                <Text className="text-[9px] font-bold text-blue-600 dark:text-blue-900 bg-blue-100 dark:bg-blue-400 px-2 py-1 rounded-full overflow-hidden">
                    Prep Mode
                </Text>
            </GlassView>
        </View>
    );
}
