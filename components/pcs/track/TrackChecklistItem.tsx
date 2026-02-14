import { useColorScheme } from '@/components/useColorScheme';
import { ChecklistItem } from '@/types/pcs';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { GestureResponderEvent, Platform, Pressable, Text, View } from 'react-native';

interface TrackChecklistItemProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
}

export function TrackChecklistItem({ item, onToggle }: TrackChecklistItemProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isComplete = item.status === 'COMPLETE';
  const hasActionRoute = Boolean(item.actionRoute);
  const showActionIndicator = !isComplete && hasActionRoute;

  const completedDateLabel = useMemo(() => {
    if (!isComplete || !item.completedAt) return null;

    const date = new Date(item.completedAt);
    if (Number.isNaN(date.getTime())) return null;

    const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `Completed ${formattedDate}`;
  }, [isComplete, item.completedAt]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  }, []);

  const navigateToAction = useCallback(() => {
    if (!item.actionRoute) return;
    router.push(item.actionRoute as any);
  }, [item.actionRoute, router]);

  const handleRowPress = useCallback(() => {
    triggerHaptic();

    if (isComplete) return;

    if (item.actionRoute) {
      navigateToAction();
      return;
    }

    onToggle(item.id);
  }, [isComplete, item.actionRoute, item.id, navigateToAction, onToggle, triggerHaptic]);

  const handleChevronPress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      triggerHaptic();
      navigateToAction();
    },
    [navigateToAction, triggerHaptic]
  );

  return (
    <Pressable
      onPress={handleRowPress}
      className="flex-row items-center p-3 border-b border-slate-100 dark:border-slate-700/50"
    >
      <View
        className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${
          isComplete
            ? 'bg-green-500 border-green-500'
            : showActionIndicator
              ? 'border-blue-500'
              : 'border-slate-300 dark:border-slate-600'
        }`}
      >
        {isComplete ? <Check size={12} color="#ffffff" /> : null}
        {showActionIndicator ? <View className="w-2.5 h-2.5 rounded-full bg-blue-500" /> : null}
      </View>

      <View className="flex-1">
        <Text
          className={`text-base font-medium ${
            isComplete ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'
          }`}
        >
          {item.label}
        </Text>

        {completedDateLabel ? (
          <Text className="mt-0.5 text-xs text-green-600 dark:text-green-400">{completedDateLabel}</Text>
        ) : null}

        <Text className="text-xs text-slate-400 uppercase mt-0.5">
          {item.category.replace(/_/g, ' ')}
        </Text>
      </View>

      {item.actionRoute && !isComplete ? (
        <Pressable onPress={handleChevronPress} className="ml-3 p-1" accessibilityRole="button">
          <ChevronRight size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
