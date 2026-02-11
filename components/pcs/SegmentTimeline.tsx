import React from 'react';
import { View, Text } from 'react-native';
import { usePCSStore } from '@/store/usePCSStore';
import { Check, Lock } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

export const SegmentTimeline = () => {
  const activeOrder = usePCSStore((state) => state.activeOrder);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!activeOrder) return null;

  return (
    <View className="px-4 mb-8 mt-2">
      <View className="flex-row justify-between items-start">
        {activeOrder.segments.map((segment, index) => {
          const isLast = index === activeOrder.segments.length - 1;
          const status = segment.status;

          const isComplete = status === 'COMPLETE';
          const isCurrent = status === 'PLANNING';
          const isLocked = status === 'LOCKED';

          return (
            <View key={segment.id} className="flex-1 items-center relative">
                {/* Line connector */}
                {!isLast && (
                    <View
                        className={`absolute top-4 left-1/2 w-full h-1 z-0 ${isComplete ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    />
                )}

                {/* Node */}
                <View className={`w-8 h-8 rounded-full items-center justify-center z-10 border-2 mb-2 ${
                    isComplete ? 'bg-blue-600 border-blue-600' :
                    isCurrent ? 'bg-white dark:bg-slate-900 border-blue-600' :
                    'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                }`}>
                    {isComplete ? (
                        <Check size={16} color="white" />
                    ) : isLocked ? (
                        <Lock size={14} color={isDark ? '#94a3b8' : '#cbd5e1'} />
                    ) : (
                        <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    )}
                </View>

                {/* Text */}
                <View className="items-center px-1">
                    <Text
                        numberOfLines={2}
                        className={`text-xs font-bold text-center mb-1 ${
                        isCurrent ? 'text-blue-600 dark:text-blue-400' :
                        isComplete ? 'text-slate-500 dark:text-slate-400' :
                        'text-slate-400 dark:text-slate-500'
                    }`}>
                        {segment.location.name}
                    </Text>
                    <Text className="text-[10px] text-slate-400 text-center">
                        {new Date(segment.dates.projectedArrival).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                    </Text>
                </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};
