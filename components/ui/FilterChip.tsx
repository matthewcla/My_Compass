import React from 'react';
import { Pressable, Text } from 'react-native';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

function FilterChipComponent({
  label,
  selected = false,
  onPress,
  disabled = false,
}: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-9 px-3 rounded-full border items-center justify-center ${
        selected
          ? 'bg-blue-600 border-blue-600'
          : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
      } ${disabled ? 'opacity-50' : 'opacity-100'}`}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <Text
        className={`text-xs font-semibold ${
          selected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export const FilterChip = React.memo(FilterChipComponent);

