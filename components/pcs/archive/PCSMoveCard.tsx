import { GlassView } from '@/components/ui/GlassView';
import { HistoricalPCSOrder } from '@/types/pcs';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { ArrowRightLeft, FileText } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

interface PCSMoveCardProps {
  order: HistoricalPCSOrder;
  onPress?: (orderId: string) => void;
}

const formatDateLabel = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return format(parsed, 'MMM yyyy');
};

function PCSMoveCardComponent({ order, onPress }: PCSMoveCardProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress?.(order.id);
  };

  return (
    <Pressable onPress={handlePress} accessibilityRole="button">
      <GlassView
        intensity={65}
        tint="light"
        className="rounded-2xl border border-slate-200/90 dark:border-slate-700/90 p-4"
        style={{ minHeight: 188 }}
      >
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 text-sm font-bold text-slate-900 dark:text-white" numberOfLines={2}>
            {order.originCommand} {'->'} {order.gainingCommand}
          </Text>
          <View className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30">
            <Text className="text-[10px] font-bold text-blue-700 dark:text-blue-300">FY {order.fiscalYear}</Text>
          </View>
        </View>

        <View className="mt-2 flex-row items-center gap-2">
          <ArrowRightLeft size={14} color="#64748b" />
          <Text className="flex-1 text-xs text-slate-600 dark:text-slate-300" numberOfLines={2}>
            {order.originLocation} {'->'} {order.gainingLocation}
          </Text>
        </View>

        <Text className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          {formatDateLabel(order.departureDate)} - {formatDateLabel(order.arrivalDate)}
        </Text>

        <View className="mt-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {order.isOconus ? (
              <View className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30">
                <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">OCONUS</Text>
              </View>
            ) : null}
            {order.isSeaDuty ? (
              <View className="px-2 py-1 rounded-md bg-teal-50 dark:bg-teal-900/30">
                <Text className="text-[10px] font-semibold text-teal-700 dark:text-teal-300">SEA DUTY</Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1">
            <FileText size={12} color="#64748b" />
            <Text className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              {order.documents.length} docs
            </Text>
          </View>
        </View>
      </GlassView>
    </Pressable>
  );
}

export const PCSMoveCard = React.memo(PCSMoveCardComponent);
