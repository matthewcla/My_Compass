import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useUserStore } from '@/store/useUserStore';
import { LinearGradient } from 'expo-linear-gradient';
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
            icon: <MapPin size={16} color={regionCount > 0 ? (isDark ? '#4ade80' : '#334155') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(tabs)/(profile)/preferences',
        },
        {
            label: 'Duty Types',
            done: dutyTypeCount > 0,
            icon: <Ship size={16} color={dutyTypeCount > 0 ? (isDark ? '#4ade80' : '#334155') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(tabs)/(profile)/preferences',
        },
        {
            label: 'Reviewed',
            done: reviewedCount > 0,
            icon: <Eye size={16} color={reviewedCount > 0 ? (isDark ? '#4ade80' : '#334155') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(career)/discovery',
        },
        {
            label: 'Saved',
            done: savedCount > 0,
            icon: <Heart size={16} color={savedCount > 0 ? (isDark ? '#4ade80' : '#334155') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(career)/discovery',
        },
    ];

    const doneCount = items.filter((i) => i.done).length;
    const allDone = doneCount === items.length;

    return (
        <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/10 mb-6 mx-4">
            <LinearGradient
                colors={isDark ? ['rgba(20,184,166,0.15)', 'transparent'] : ['rgba(20,184,166,0.10)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View className="p-5">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center gap-4 flex-1">
                        <View className={`w-[52px] h-[52px] items-center justify-center rounded-full bg-teal-500/10 dark:bg-teal-900/40 border-[1.5px] border-teal-500/20 dark:border-teal-800/60 shadow-sm`}>
                            <Target size={26} color={isDark ? '#2DD4BF' : '#0D9488'} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={2}>
                                Ready for Cycle?
                            </Text>
                            <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={2}>
                                Checklist
                            </Text>
                        </View>
                    </View>

                    {/* Progress Bar Mini */}
                    <View className="items-end justify-center w-20">
                        <View className="bg-teal-500/10 px-3 py-1.5 rounded-[12px] border pb-2 border-teal-500/20 shadow-sm mb-2">
                            <Text className="text-[14px] font-black tracking-wide text-teal-600 dark:text-teal-400">
                                {doneCount}/{items.length}
                            </Text>
                        </View>
                        <View className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                            <View
                                className="h-full bg-teal-500 dark:bg-teal-400 rounded-full"
                                style={{ width: `${(doneCount / items.length) * 100}%` }}
                            />
                        </View>
                    </View>
                </View>

                <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
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
                                className={`flex-1 flex-col items-center justify-center py-4 rounded-xl border gap-2 shadow-sm ${item.done
                                    ? 'bg-slate-100/80 dark:bg-green-500/20 border-slate-200 dark:border-green-500/30'
                                    : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60'
                                    }`}
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center shadow-sm ${item.done
                                    ? 'bg-slate-200/80 dark:bg-green-500/30 border border-slate-300/60 dark:border-green-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60'
                                    }`}>
                                    {item.icon}
                                </View>
                                <Text className={`text-[10px] uppercase font-bold text-center tracking-wider ${item.done
                                    ? 'text-slate-700 dark:text-green-400'
                                    : 'text-slate-500 dark:text-slate-400'
                                    }`}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* All-done celebration */}
                    {allDone && (
                        <View className="bg-slate-100 dark:bg-green-500/10 p-4 rounded-[16px] border border-slate-200 dark:border-green-500/20 mt-5 flex-row items-center justify-between shadow-sm">
                            <Text className="text-[14px] text-slate-700 dark:text-green-400 font-bold flex-1" numberOfLines={1}>
                                You're fully prepared to build your slate.
                            </Text>
                            <View className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-green-500/20 items-center justify-center ml-2 border border-slate-300/60 dark:border-green-500/30">
                                <ChevronRight size={18} color={isDark ? '#4ade80' : '#334155'} strokeWidth={2.5} />
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </GlassView>
    );
}
