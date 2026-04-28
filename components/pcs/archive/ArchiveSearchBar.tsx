import { FilterChip } from '@/components/ui/FilterChip';
import { Search, X } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

interface ArchiveSearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  filterYear: number | null;
  years: number[];
  onSelectYear: (year: number | null) => void;
  resultCount: number;
  totalCount: number;
}

export function ArchiveSearchBar({
  value,
  onChangeText,
  filterYear,
  years,
  onSelectYear,
  resultCount,
  totalCount,
}: ArchiveSearchBarProps) {
  return (
    <View className="px-4 pt-6 pb-4 bg-slate-50 dark:bg-slate-950">
      <View className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 flex-row items-center">
        <Search size={16} color="#64748b" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          className="flex-1 ml-2 text-sm text-slate-900 dark:text-white"
          placeholder="Search command, location, fiscal year..."
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          returnKeyType="search"
          accessibilityLabel="Search archived PCS moves"
        />
        {value.length > 0 ? (
          <Pressable
            onPress={() => onChangeText('')}
            className="w-6 h-6 rounded-full items-center justify-center bg-slate-200 dark:bg-slate-700"
            accessibilityRole="button"
            accessibilityLabel="Clear archive search"
          >
            <X size={14} color="#475569" />
          </Pressable>
        ) : null}
      </View>

      <View className="mt-3 min-h-[36px]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          <FilterChip label="All Years" selected={filterYear === null} onPress={() => onSelectYear(null)} />
          {years.map((year) => (
            <FilterChip
              key={year}
              label={`FY ${year}`}
              selected={filterYear === year}
              onPress={() => onSelectYear(year)}
            />
          ))}
        </ScrollView>
      </View>

      <Text className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {resultCount} of {totalCount} archived moves
      </Text>
    </View>
  );
}

