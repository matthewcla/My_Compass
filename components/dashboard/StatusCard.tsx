import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { Calendar } from 'lucide-react-native';
import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { useDemoStore } from '@/store/useDemoStore';
import { useRouter } from 'expo-router';

interface StatusCardProps {
    nextCycle: string;
    daysUntilOpen: number;
}

export function StatusCard({ nextCycle, daysUntilOpen }: StatusCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const iconColor = isDark ? '#60A5FA' : '#2563EB'; // blue-400 : blue-600

    const isDemoMode = useDemoStore((state) => state.isDemoMode);
    const selectedUser = useDemoStore((state) => state.selectedUser);
    const router = useRouter();

    if (isDemoMode) {
        const lastName = selectedUser.displayName.split(' ').pop();
        const headline = `Cycle Prep: ${selectedUser.title} ${lastName}`;

        return (
            <View className="flex flex-col gap-2">
                <GlassView
                    intensity={60}
                    tint={isDark ? 'dark' : 'light'}
                    className="border-l-4 border-blue-600 dark:border-blue-400 pl-3 pr-2 py-2.5 rounded-r-lg overflow-hidden flex-row items-center justify-between"
                >
                    <View className="flex-row items-center gap-2.5 flex-1">
                        <Calendar size={16} color={iconColor} />
                        <View className="flex-1">
                            <Text className="text-blue-900 dark:text-blue-100 text-sm font-bold leading-none mb-1">
                                {headline}
                            </Text>
                            <Text className="text-blue-700 dark:text-blue-300 text-xs leading-tight">
                                Cycle {nextCycle} opens in <Text className="font-bold">{daysUntilOpen} days</Text>.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/(assignment)/preferences')}
                        className="bg-blue-100 dark:bg-blue-900 px-3 py-1.5 rounded-full ml-2"
                    >
                         <Text className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                            Update Preferences
                        </Text>
                    </TouchableOpacity>
                </GlassView>
            </View>
        );
    }

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
                        <Text className="text-blue-900 dark:text-blue-100 text-sm font-bold leading-none mb-1">Cycle Closed</Text>
                        <Text className="text-blue-700 dark:text-blue-300 text-xs leading-tight">
                            {nextCycle} opens in <Text className="font-bold">{daysUntilOpen} days</Text>.
                        </Text>
                    </View>
                </View>
                <Text className="text-[10px] font-bold text-blue-600 dark:text-blue-900 bg-blue-100 dark:bg-blue-400 px-2 py-1 rounded-full overflow-hidden">
                    Prep Mode
                </Text>
            </GlassView>
        </View>
    );
}
