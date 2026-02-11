import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { usePCSStore } from '@/store/usePCSStore';
import { DemoPhase } from '@/constants/DemoData';
import { useRouter } from 'expo-router';
import { Calendar, Timer, Map as MapIcon } from 'lucide-react-native';
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
    const selectedPhase = useDemoStore((state) => state.selectedPhase);
    const activeOrder = usePCSStore((state) => state.activeOrder);
    const router = useRouter();

    if (isDemoMode) {
        if (selectedPhase === DemoPhase.MY_PCS) {
            const destination = activeOrder?.segments.find(s => s.type === 'DESTINATION');
            const nltDate = destination?.dates.nlt ? new Date(destination.dates.nlt).toLocaleDateString() : 'TBD';
            const gainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';

            return (
                <View className="flex flex-col gap-2 my-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border-l-4 border-amber-400 dark:border-amber-400 pl-4 pr-3 py-4 rounded-xl overflow-hidden flex-row items-center justify-between shadow-sm bg-slate-50 dark:bg-slate-900/50"
                    >
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                                <MapIcon size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-100 text-base font-bold leading-none mb-1">
                                    Orders Received
                                </Text>
                                <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium leading-tight">
                                    Report to {gainingCommand} by {nltDate}.
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/(pcs)/pcs')}
                            className="bg-amber-100 dark:bg-amber-900/40 px-3 py-2 rounded-lg ml-1 border border-amber-200 dark:border-amber-700/50"
                        >
                            <Text className="text-[10px] font-bold text-amber-800 dark:text-amber-200 text-center uppercase tracking-wide">
                                View{'\n'}Roadmap
                            </Text>
                        </TouchableOpacity>
                    </GlassView>
                </View>
            );
        }

        const lastName = selectedUser.displayName.split(' ').pop();
        // const headline = `Cycle Prep: ${selectedUser.title} ${lastName}`; // OLD
        const headline = "MNA Negotiation Window";

        return (
            <View className="flex flex-col gap-2 my-2">
                <GlassView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    className="border-l-4 border-amber-500 dark:border-amber-400 pl-4 pr-3 py-4 rounded-xl overflow-hidden flex-row items-center justify-between shadow-sm"
                >
                    <View className="flex-row items-center gap-4 flex-1">
                        <View className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-full">
                            {/* Changed to Timer for urgency/excitement */}
                            <Timer size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-amber-900 dark:text-amber-100 text-base font-bold leading-none mb-1">
                                {headline}
                            </Text>
                            <View className="flex-row items-baseline gap-1.5">
                                <Text className="text-amber-950 dark:text-white text-3xl font-black font-mono tracking-tighter">
                                    {daysUntilOpen}
                                </Text>
                                <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wide">
                                    Days Until Open
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/(profile)/preferences')}
                        className="bg-amber-100 dark:bg-amber-900/60 px-3 py-2 rounded-lg ml-1 border border-amber-200 dark:border-amber-700/50"
                    >
                        <Text className="text-[10px] font-bold text-amber-800 dark:text-amber-200 text-center uppercase tracking-wide">
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
