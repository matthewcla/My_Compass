import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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
            <View className="flex flex-col gap-2 my-2">
                <GlassView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    className="border-l-4 border-blue-600 dark:border-blue-400 pl-4 pr-3 py-4 rounded-xl overflow-hidden flex-row items-center justify-between shadow-sm"
                >
                    <View className="flex-row items-center gap-4 flex-1">
                        <View className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                            <Calendar size={24} color={iconColor} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-blue-900 dark:text-blue-100 text-base font-bold leading-none mb-1">
                                {headline}
                            </Text>
                            <View className="flex-row items-baseline gap-1">
                                <Text className="text-blue-950 dark:text-white text-2xl font-black">
                                    {daysUntilOpen}
                                </Text>
                                <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                                    days until open
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/(profile)/preferences')}
                        className="bg-blue-100 dark:bg-blue-900 px-3 py-1.5 rounded-full ml-1"
                    >
                        <Text className="text-[10px] font-bold text-blue-700 dark:text-blue-300 text-center">
                            Update{'\n'}Prefs
                        </Text>
                    </TouchableOpacity>
                </GlassView>
            </View>
        );
    }

    return (
        <View className="flex flex-col gap-2 my-2">
            <GlassView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                className="border-l-4 border-blue-600 dark:border-blue-400 pl-4 pr-3 py-4 rounded-xl overflow-hidden flex-row items-center justify-between shadow-sm"
            >
                <View className="flex-row items-center gap-4 flex-1">
                    <View className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                        <Calendar size={24} color={iconColor} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-blue-900 dark:text-blue-100 text-base font-bold leading-none mb-1">
                            Cycle {nextCycle} Status
                        </Text>
                        <View className="flex-row items-baseline gap-1">
                            <Text className="text-blue-950 dark:text-white text-2xl font-black">
                                {daysUntilOpen}
                            </Text>
                            <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                                days until open
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="items-end">
                    <View className="bg-blue-100 dark:bg-blue-900 px-3 py-1.5 rounded-full mb-1">
                        <Text className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                            Prep Mode
                        </Text>
                    </View>
                </View>
            </GlassView>
        </View>
    );
}
