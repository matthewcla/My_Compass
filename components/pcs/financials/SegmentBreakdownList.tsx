import { usePCSStore } from '@/store/usePCSStore';
import { calculateSegmentEntitlement } from '@/utils/jtr';
import { MapPin } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export const SegmentBreakdownList = () => {
  const activeOrder = usePCSStore((state) => state.activeOrder);

  if (!activeOrder) return null;

  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-slate-800 dark:text-white mb-3">Travel Segments</Text>
      <View className="gap-4">
        {activeOrder.segments.map((segment) => {
          const { malt, perDiem, days } = calculateSegmentEntitlement(segment);
          const miles = days * 350; // Estimation based on JTR logic

          return (
            <View
              key={segment.id}
              className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-xl p-4 shadow-sm"
            >
              <View className="flex-row items-center mb-3">
                <MapPin size={16} color="#64748B" />
                <Text className="font-semibold text-slate-700 dark:text-zinc-200 ml-2 flex-1 text-base">
                  {segment.title}
                </Text>
                {segment.location.type === 'SCHOOL' && (
                  <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-2 py-1 rounded">
                    <Text className="text-blue-700 dark:text-blue-300 font-medium text-[10px]">
                      BAH: Rate Continues
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center mb-4 pb-4 border-b border-slate-100 dark:border-zinc-700/50">
                <Text className="text-slate-500 dark:text-zinc-400 text-sm font-medium">
                  {days} Travel Days
                </Text>
                <Text className="text-slate-300 dark:text-zinc-600 mx-3">|</Text>
                <Text className="text-slate-500 dark:text-zinc-400 text-sm font-medium">
                  {miles.toLocaleString()} Miles
                </Text>
              </View>

              <View className="flex-row justify-between">
                <View>
                  <Text className="text-slate-400 dark:text-zinc-500 text-xs uppercase font-medium mb-1">
                    MALT
                  </Text>
                  <Text className="text-slate-800 dark:text-zinc-200 font-semibold text-base">
                    ${malt.toFixed(0)}
                  </Text>
                </View>
                <View>
                  <Text className="text-slate-400 dark:text-zinc-500 text-xs uppercase font-medium mb-1">
                    Per Diem
                  </Text>
                  <Text className="text-slate-800 dark:text-zinc-200 font-semibold text-base">
                    ${perDiem.toFixed(0)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-slate-400 dark:text-zinc-500 text-xs uppercase font-medium mb-1">
                    Est. Total
                  </Text>
                  <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
                    ${(malt + perDiem).toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};
