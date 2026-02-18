import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View, useColorScheme } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export interface BaseExpense {
  id: string;
  amount?: number;
  description?: string;
}

interface ExpenseCardProps<T extends BaseExpense> {
  expense: T;
  onUpdate: (patch: Partial<T>) => void;
  onDelete: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

/**
 * Reusable collapsible card wrapper for expense entries.
 *
 * Features:
 * - Collapsible with animated height transition
 * - Delete confirmation modal
 * - Custom header with icon and title
 * - Optional header right content
 * - Responsive to dark mode
 *
 * Usage:
 * ```tsx
 * <ExpenseCard
 *   expense={fuelExpense}
 *   onUpdate={(patch) => updateExpense({ ...fuelExpense, ...patch })}
 *   onDelete={() => deleteExpense(fuelExpense.id)}
 *   title={fuelExpense.location || 'New Fuel Entry'}
 *   icon={<Fuel size={18} color="#2563eb" />}
 * >
 *   <TextInput placeholder="Location" ... />
 *   <TextInput placeholder="Amount" ... />
 * </ExpenseCard>
 * ```
 */
export function ExpenseCard<T extends BaseExpense>({
  expense,
  onUpdate,
  onDelete,
  title,
  icon,
  children,
  headerRight,
  isCollapsible = true,
  defaultExpanded = false,
}: ExpenseCardProps<T>) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentHeight = useSharedValue(defaultExpanded ? 1 : 0);

  const toggleExpanded = () => {
    if (!isCollapsible) return;

    setExpanded((prev) => !prev);
    contentHeight.value = withTiming(expanded ? 0 : 1, { duration: 300 });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ],
      { cancelable: true }
    );
  };

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentHeight.value,
    overflow: 'hidden' as const,
  }));

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20).stiffness(180)}
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <Pressable
        onPress={isCollapsible ? toggleExpanded : undefined}
        className={`px-4 py-3 ${isCollapsible ? 'active:bg-slate-50 dark:active:bg-slate-800' : ''}`}
        accessibilityRole={isCollapsible ? 'button' : undefined}
        accessibilityLabel={isCollapsible ? `${expanded ? 'Collapse' : 'Expand'} ${title}` : title}
      >
        <View className="flex-row items-center justify-between">
          {/* Left: Icon + Title */}
          <View className="flex-row items-center flex-1">
            <View className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mr-3">
              {icon}
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white font-bold text-base">
                {title}
              </Text>
              {expense.amount !== undefined && (
                <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  ${expense.amount.toFixed(2)}
                </Text>
              )}
            </View>
          </View>

          {/* Right: Header Right Content + Collapse/Delete */}
          <View className="flex-row items-center gap-2">
            {headerRight}

            {/* Delete Button */}
            <Pressable
              onPress={handleDelete}
              className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center active:bg-red-100 dark:active:bg-red-900/50"
              accessibilityRole="button"
              accessibilityLabel="Delete expense"
            >
              <Trash2 size={16} color={isDark ? '#fca5a5' : '#dc2626'} />
            </Pressable>

            {/* Collapse Indicator */}
            {isCollapsible && (
              <View className="w-8 h-8 items-center justify-center">
                {expanded ? (
                  <ChevronUp size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                ) : (
                  <ChevronDown size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                )}
              </View>
            )}
          </View>
        </View>
      </Pressable>

      {/* Collapsible Content */}
      {(expanded || !isCollapsible) && (
        <View className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Animated.View style={isCollapsible ? contentStyle : undefined}>
            {children}
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Simplified variant for non-collapsible expense cards.
 * Always shows content, no expand/collapse animation.
 */
export function SimpleExpenseCard<T extends BaseExpense>(
  props: Omit<ExpenseCardProps<T>, 'isCollapsible' | 'defaultExpanded'>
) {
  return <ExpenseCard {...props} isCollapsible={false} />;
}
