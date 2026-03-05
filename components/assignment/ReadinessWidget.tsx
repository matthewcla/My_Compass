import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useUserStore } from '@/store/useUserStore';
import { useRouter } from 'expo-router';
import {
    ChevronRight,
    Eye,
    Heart,
    MapPin,
    Ship,
    Target,
} from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

interface ReadinessItem {
    label: string;
    done: boolean;
    icon: React.ReactNode;
    route?: string;
}

export default function ReadinessWidget() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Pull user preferences
    const preferences = useUserStore(
        useShallow((s) => s.user?.preferences || { regions: [], dutyTypes: [] })
    );

    // Pull assignment store decisions
    const realDecisions = useAssignmentStore((s) => s.realDecisions);

    // Compute readiness
    const regionCount = preferences.regions?.length ?? 0;
    const dutyTypeCount = preferences.dutyTypes?.length ?? 0;
    const reviewedCount = Object.keys(realDecisions).length;
    const savedCount = Object.values(realDecisions).filter(
        (d) => d === 'super' || d === 'like'
    ).length;

    const items: ReadinessItem[] = [
        {
            label: 'Regions',
            done: regionCount > 0,
            icon: <MapPin size={16} color={regionCount > 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(tabs)/(profile)/preferences',
        },
        {
            label: 'Duty Types',
            done: dutyTypeCount > 0,
            icon: <Ship size={16} color={dutyTypeCount > 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(tabs)/(profile)/preferences',
        },
        {
            label: 'Reviewed',
            done: reviewedCount > 0,
            icon: <Eye size={16} color={reviewedCount > 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(career)/discovery',
        },
        {
            label: 'Saved',
            done: savedCount > 0,
            icon: <Heart size={16} color={savedCount > 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(career)/discovery',
        },
    ];

    const doneCount = items.filter((i) => i.done).length;
    const allDone = doneCount === items.length;

    return (
        <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-2xl p-5 shadow-sm border border-black/5 dark:border-white/10 mb-6 mt-2">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                    <View className={`w-10 h-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20`}>
                        <Target size={20} color={isDark ? '#fb923c' : '#ea580c'} strokeWidth={2.2} />
                    </View>
                    <View>
                        <Text className="text-base font-bold text-slate-900 dark:text-white">
                            Ready for Cycle?
                        </Text>
                        <Text className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-widest mt-0.5">
                            Checklist
                        </Text>
                    </View>
                </View>

                {/* Progress Bar Mini */}
                <View className="items-end justify-center w-20">
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {doneCount}/{items.length} Done
                    </Text>
                    <View className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <View
                            className="h-full bg-orange-500 dark:bg-orange-400 rounded-full"
                            style={{ width: `${(doneCount / items.length) * 100}%` }}
                        />
                    </View>
                </View>
            </View>

            {/* Horizontal Matrix */}
            <View className="flex-row gap-2">
                {items.map((item, index) => (
                    <TouchableOpacity
                        key={item.label}
                        onPress={() => {
                            if (!item.done && item.route) {
                                router.push(item.route as any);
                            }
                        }}
                        disabled={item.done}
                        activeOpacity={0.6}
                        className={`flex-1 items-center justify-center py-3 rounded-lg border flex-col gap-1.5 ${item.done
                                ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200/50 dark:border-green-800/30'
                                : 'bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-slate-700/50'
                            }`}
                    >
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${item.done
                                ? 'bg-green-100/50 dark:bg-green-800/30'
                                : 'bg-slate-100 dark:bg-slate-800'
                            }`}>
                            {item.icon}
                        </View>
                        <Text className={`text-[10px] font-bold text-center uppercase ${item.done
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* All-done celebration */}
            {allDone && (
                <View className="bg-green-500/10 p-3 rounded-xl border border-green-500/20 mt-4 flex-row items-center">
                    <Text className="text-xs text-green-700 dark:text-green-400 leading-relaxed font-bold flex-1">
                        You're fully prepared to build your slate.
                    </Text>
                    <ChevronRight size={16} color={isDark ? '#4ade80' : '#16a34a'} />
                </View>
            )}
        </GlassView>
    );
}
