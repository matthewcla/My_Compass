import { useColorScheme } from '@/components/useColorScheme';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useUserStore } from '@/store/useUserStore';
import { useRouter } from 'expo-router';
import {
    CheckCircle2,
    ChevronRight,
    Circle,
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
    detail: string;
    done: boolean;
    icon: React.ReactNode;
    route?: string;
}

/**
 * Readiness Checklist — shows sailor's preparation progress
 * before the MNA cycle opens.
 * Only rendered during the ON_RAMP phase.
 */
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
            label: 'Regions selected',
            detail: regionCount > 0 ? `${regionCount} region${regionCount !== 1 ? 's' : ''}` : 'None yet',
            done: regionCount > 0,
            icon: <MapPin size={14} color={regionCount > 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(tabs)/(profile)/preferences',
        },
        {
            label: 'Duty types set',
            detail: dutyTypeCount > 0 ? `${dutyTypeCount} type${dutyTypeCount !== 1 ? 's' : ''}` : 'None yet',
            done: dutyTypeCount > 0,
            icon: <Ship size={14} color={dutyTypeCount > 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(tabs)/(profile)/preferences',
        },
        {
            label: 'Billets reviewed',
            detail: reviewedCount > 0 ? `${reviewedCount} reviewed` : 'None yet',
            done: reviewedCount > 0,
            icon: <Eye size={14} color={reviewedCount > 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(career)/discovery',
        },
        {
            label: 'Favorites saved',
            detail: savedCount > 0 ? `${savedCount} saved` : 'None yet',
            done: savedCount > 0,
            icon: <Heart size={14} color={savedCount > 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
            route: '/(career)/discovery',
        },
    ];

    const doneCount = items.filter((i) => i.done).length;
    const allDone = doneCount === items.length;

    return (
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                    <View className={`p-2.5 rounded-full ${allDone ? 'bg-green-50 dark:bg-green-900/30' : 'bg-amber-50 dark:bg-amber-900/30'}`}>
                        <Target size={20} color={allDone ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#fbbf24' : '#d97706')} />
                    </View>
                    <View>
                        <Text className="text-base font-bold text-slate-900 dark:text-white">
                            Ready for Cycle?
                        </Text>
                        <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Preparation Checklist
                        </Text>
                    </View>
                </View>
                <View className={`px-2.5 py-1 rounded-full ${allDone
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                    <Text className={`text-xs font-bold ${allDone
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}>
                        {doneCount} of {items.length}
                    </Text>
                </View>
            </View>

            {/* Checklist */}
            <View className="gap-1">
                {items.map((item) => (
                    <TouchableOpacity
                        key={item.label}
                        onPress={() => {
                            if (!item.done && item.route) {
                                router.push(item.route as any);
                            }
                        }}
                        disabled={item.done}
                        activeOpacity={0.6}
                        className={`flex-row items-center py-2.5 px-3 rounded-xl ${!item.done ? 'bg-slate-50 dark:bg-slate-800/50' : ''
                            }`}
                    >
                        {/* Check icon */}
                        {item.done ? (
                            <CheckCircle2 size={18} color={isDark ? '#4ade80' : '#16a34a'} />
                        ) : (
                            <Circle size={18} color={isDark ? '#475569' : '#cbd5e1'} />
                        )}

                        {/* Item icon */}
                        <View className="ml-2.5 mr-2">
                            {item.icon}
                        </View>

                        {/* Label + detail */}
                        <View className="flex-1">
                            <Text className={`text-sm font-semibold ${item.done
                                    ? 'text-slate-500 dark:text-slate-400'
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                {item.label}
                            </Text>
                        </View>

                        {/* Right side: detail text or chevron */}
                        <Text className={`text-xs font-medium mr-1 ${item.done
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}>
                            {item.detail}
                        </Text>
                        {!item.done && item.route && (
                            <ChevronRight size={14} color={isDark ? '#64748b' : '#94a3b8'} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* All-done celebration */}
            {allDone && (
                <View className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-800/30 mt-3">
                    <Text className="text-xs text-green-700 dark:text-green-400 leading-relaxed text-center font-semibold">
                        ✅  You're all set! When the cycle opens, you'll be ready to build your slate.
                    </Text>
                </View>
            )}
        </View>
    );
}
