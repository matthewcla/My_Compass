import { useColorScheme } from '@/components/useColorScheme';
import { ChecklistItem } from '@/types/pcs';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, Info } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { GestureResponderEvent, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface TrackChecklistItemProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
}

export function TrackChecklistItem({ item, onToggle }: TrackChecklistItemProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showHelp, setShowHelp] = useState(false);

  const isComplete = item.status === 'COMPLETE';
  const hasActionRoute = Boolean(item.actionRoute);
  const showActionIndicator = !isComplete && hasActionRoute;
  const hasHelpText = Boolean(item.helpText);

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

  const handleInfoPress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      triggerHaptic();
      setShowHelp((prev) => !prev);
    },
    [triggerHaptic]
  );

  return (
    <View className="border-b border-slate-100 dark:border-slate-700/50">
      <Pressable
        onPress={handleRowPress}
        className="flex-row items-center p-3"
      >
        {/* Status circle */}
        <View
          className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${isComplete
            ? 'bg-green-500 border-green-500'
            : showActionIndicator
              ? 'border-blue-500'
              : 'border-slate-300 dark:border-slate-600'
            }`}
        >
          {isComplete ? <Check size={12} color="#ffffff" /> : null}
          {showActionIndicator ? <View className="w-2.5 h-2.5 rounded-full bg-blue-500" /> : null}
        </View>

        {/* Label + metadata */}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text
              className={`text-base font-medium flex-1 ${isComplete ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'
                }`}
            >
              {item.label}
            </Text>

            {/* Info icon */}
            {hasHelpText && (
              <Pressable
                onPress={handleInfoPress}
                hitSlop={8}
                className="ml-1 p-0.5"
                accessibilityRole="button"
                accessibilityLabel="More information"
              >
                <Info
                  size={14}
                  color={showHelp
                    ? (isDark ? '#60A5FA' : '#2563EB')
                    : (isDark ? '#64748B' : '#94A3B8')
                  }
                />
              </Pressable>
            )}
          </View>

          {completedDateLabel ? (
            <Text className="mt-0.5 text-xs text-green-600 dark:text-green-400">{completedDateLabel}</Text>
          ) : null}



        </View>

        {/* Action chevron */}
        {item.actionRoute && !isComplete ? (
          <Pressable onPress={handleChevronPress} className="ml-3 p-1" accessibilityRole="button">
            <ChevronRight size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
          </Pressable>
        ) : null}
      </Pressable>

      {/* Collapsible help text */}
      {showHelp && item.helpText ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="px-3 pb-3 pl-11"
        >
          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 border border-blue-100 dark:border-blue-800/30">
            <Text className="text-xs text-blue-700 dark:text-blue-300 leading-4">
              {item.helpText}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
