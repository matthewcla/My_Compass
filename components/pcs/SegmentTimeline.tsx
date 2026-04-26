import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePCSStore } from '@/store/usePCSStore';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, Edit2, Lock } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export const SegmentTimeline = () => {
    const router = useRouter();
    const activeOrder = usePCSStore((state) => state.activeOrder);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    if (!activeOrder) return null;

    return (
        <View className="px-4 mb-8 mt-2">
            <View className="relative">
                {activeOrder.segments.map((segment, index) => {
                    const isLast = index === activeOrder.segments.length - 1;
                    const status = segment.status;
                    const isComplete = status === 'COMPLETE';
                    const isPlanning = status === 'PLANNING';
                    const isLocked = status === 'LOCKED';

                    const handlePress = () => {
                        if (isPlanning || isComplete) {
                            router.push(`/pcs-wizard/${segment.id}/`);
                        }
                    };

                    return (
                        <View key={segment.id} className="flex-row mb-6 relative">
                            {/* Vertical Line */}
                            {!isLast && (
                                <View
                                    className="absolute left-[15px] top-8 bottom-[-24px] w-[2px] z-0 bg-slate-200 dark:bg-slate-700"
                                />
                            )}

                            {/* Icon Column */}
                            <View className="mr-4 items-center z-10">
                                <View className={`w-8 h-8 rounded-none items-center justify-center border-2 ${isComplete ? 'bg-primary dark:bg-blue-600 border-primary dark:border-blue-600' :
                                        isPlanning ? 'bg-white dark:bg-slate-900 border-primary dark:border-blue-600' :
                                            'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                                    }`}>
                                    {isComplete ? (
                                        <Check size={16} color="white" strokeWidth={3} />
                                    ) : isLocked ? (
                                        <Lock size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                                    ) : (
                                        <Edit2 size={14} color={isDark ? Colors.dark.tint : '#0A1628'} />
                                    )}
                                </View>
                            </View>

                            {/* Content Column */}
                            <Pressable
                                onPress={handlePress}
                                disabled={!isPlanning && !isComplete}
                                className={`flex-1 rounded-none p-3 ${isPlanning ? 'bg-slate-50 dark:bg-slate-800 border-2 border-primary dark:border-blue-500' : ''
                                    }`}
                            >
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className={`font-bold text-base ${isPlanning ? 'text-primary dark:text-blue-400' :
                                            isLocked ? 'text-slate-400 dark:text-slate-500' :
                                                'text-slate-900 dark:text-white'
                                        }`}>
                                        {segment.location.name}
                                    </Text>
                                    {isPlanning && (
                                        <Text className="text-xs font-bold text-secondary dark:text-blue-400 bg-primary dark:bg-blue-900/40 px-2 py-0.5 rounded-none border border-secondary dark:border-blue-400">
                                            CURRENT
                                        </Text>
                                    )}
                                </View>

                                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    {segment.type.replace('_', ' ')}
                                </Text>

                                <View className="flex-row items-center">
                                    <Text className="text-sm text-slate-600 dark:text-slate-300">
                                        {new Date(segment.dates.projectedArrival).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        {' - '}
                                        {new Date(segment.dates.projectedDeparture).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </Text>
                                </View>

                                {/* Entry Affordance */}
                                {(isPlanning || isComplete) && (
                                    <View className="flex-row items-center justify-end mt-3 pt-2 border-t-2 border-slate-200 dark:border-slate-700">
                                        <Text className={`text-xs font-bold mr-1 ${isPlanning
                                                ? 'text-primary dark:text-blue-400'
                                                : 'text-slate-500 dark:text-slate-400'
                                            }`}>
                                            {isPlanning ? 'PLAN TRAVEL' : 'VIEW PLAN'}
                                        </Text>
                                        <ChevronRight
                                            size={14}
                                            color={isPlanning
                                                ? (isDark ? '#60a5fa' : '#0A1628')
                                                : (isDark ? '#94a3b8' : '#64748b')
                                            }
                                            strokeWidth={2.5}
                                        />
                                    </View>
                                )}
                            </Pressable>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};
