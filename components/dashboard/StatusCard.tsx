import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { DemoPhase } from '@/constants/DemoData';
import { useDemoStore } from '@/store/useDemoStore';
import { usePCSPhase, usePCSStore } from '@/store/usePCSStore';
import { useRouter } from 'expo-router';
import { Anchor, Calendar, Map as MapIcon, Timer } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface StatusCardProps {
    nextCycle: string;
    daysUntilOpen: number;
}

export function StatusCard({ nextCycle, daysUntilOpen }: StatusCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const isDemoMode = useDemoStore((state) => state.isDemoMode);
    const selectedUser = useDemoStore((state) => state.selectedUser);
    const selectedPhase = useDemoStore((state) => state.selectedPhase);
    const activeOrder = usePCSStore((state) => state.activeOrder);
    const pcsPhase = usePCSPhase();
    const router = useRouter();

    // Days on station (Phase 4 only)
    const daysOnStation = useMemo(() => {
        if (!activeOrder?.reportNLT) return 0;
        const report = new Date(activeOrder.reportNLT);
        const today = new Date();
        report.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - report.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff + 1); // Day 1 = report date
    }, [activeOrder?.reportNLT]);

    if (isDemoMode) {
        if (selectedPhase === DemoPhase.MY_PCS) {
            // ── Phase 4: "Welcome Aboard" variant ──────────────────
            if (pcsPhase === 'CHECK_IN') {
                const gainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';
                const uniformOfDay = activeOrder?.gainingCommand.uniformOfDay?.trim() || null;

                return (
                    <View className="flex flex-col gap-2 my-2">
                        <GlassView
                            intensity={80}
                            tint={isDark ? 'dark' : 'light'}
                            className="border-l-4 border-green-500 dark:border-green-400 pl-4 pr-3 py-4 rounded-xl overflow-hidden flex-row items-center justify-between shadow-sm bg-slate-50 dark:bg-slate-900/50"
                        >
                            <View className="flex-row items-center gap-4 flex-1">
                                <View className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                                    <Anchor size={24} color={isDark ? '#4ade80' : '#15803d'} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-900 dark:text-slate-100 text-base font-bold leading-none mb-1">
                                        Welcome Aboard
                                    </Text>
                                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium leading-tight" numberOfLines={1}>
                                        {gainingCommand}
                                    </Text>
                                    {uniformOfDay && (
                                        <Text className="text-green-700 dark:text-green-300 text-[11px] font-semibold mt-1">
                                            👔 {uniformOfDay}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View className="items-end gap-2.5">
                                <View className="bg-green-100 dark:bg-green-900/40 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-700/50">
                                    <Text className="text-[10px] font-black text-green-800 dark:text-green-200 uppercase tracking-wider">
                                        Day {daysOnStation}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push('/pcs/check-in' as any)}
                                    className="bg-green-600 dark:bg-green-700 px-3 py-2 rounded-lg border border-green-500 dark:border-green-600"
                                >
                                    <Text className="text-[10px] font-bold text-white text-center uppercase tracking-wide">
                                        Check In
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </GlassView>
                    </View>
                );
            }

            // ── Phases 1-3: "Orders Received" variant ──────────────
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
                // Changed Blue-600 to Slate-900 (Navy)
                className="border-l-4 border-slate-900 dark:border-slate-700 pl-4 pr-3 py-4 rounded-xl overflow-hidden flex-row items-center justify-between shadow-sm"
            >
                <View className="flex-row items-center gap-4 flex-1">
                    {/* Changed Blue-100 to Slate-100/Slate-800 */}
                    <View className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                        <Calendar size={24} color={isDark ? '#fbbf24' : '#0f172a'} />
                    </View>
                    <View className="flex-1">
                        {/* Changed Blue-900 to Slate-900 */}
                        <Text className="text-slate-900 dark:text-slate-100 text-base font-bold leading-none mb-1">
                            Cycle {nextCycle} Status
                        </Text>
                        <View className="flex-row items-baseline gap-1">
                            <Text className="text-slate-950 dark:text-white text-2xl font-black">
                                {daysUntilOpen}
                            </Text>
                            <Text className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                                days until open
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="items-end">
                    {/* Changed Blue-100/Blue-700 to Slate-900/Amber-400 (Gold Pill) */}
                    <View className="bg-slate-900 dark:bg-slate-800 px-3 py-1.5 rounded-full mb-1 border border-slate-800 dark:border-slate-700">
                        <Text className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                            Prep Mode
                        </Text>
                    </View>
                </View>
            </GlassView>
        </View>
    );
}
