import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { usePCSStore } from '@/store/usePCSStore';
import { Check, Lock, Edit2 } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

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
                        <View className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                            isComplete ? 'bg-blue-600 border-blue-600' :
                            isPlanning ? 'bg-white dark:bg-slate-900 border-blue-600' :
                            'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                        }`}>
                            {isComplete ? (
                                <Check size={16} color="white" />
                            ) : isLocked ? (
                                <Lock size={14} color={isDark ? '#94a3b8' : '#cbd5e1'} />
                            ) : (
                                <Edit2 size={14} color={Colors[colorScheme ?? 'light'].tint} />
                            )}
                        </View>
                    </View>

                    {/* Content Column */}
                    <Pressable
                        onPress={handlePress}
                        disabled={!isPlanning && !isComplete}
                        className={`flex-1 rounded-xl p-3 ${
                            isPlanning ? 'bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-blue-900' : ''
                        }`}
                    >
                        <View className="flex-row justify-between items-start mb-1">
                            <Text className={`font-bold text-base ${
                                isPlanning ? 'text-blue-700 dark:text-blue-400' :
                                isLocked ? 'text-slate-400 dark:text-slate-500' :
                                'text-slate-900 dark:text-white'
                            }`}>
                                {segment.location.name}
                            </Text>
                            {isPlanning && (
                                <Text className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                                    Current
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
                    </Pressable>
                </View>
            );
        })}
      </View>
    </View>
  );
};
