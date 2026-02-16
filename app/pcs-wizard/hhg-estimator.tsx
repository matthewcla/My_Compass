import { ScalePressable } from '@/components/ScalePressable';
import { useColorScheme } from '@/components/useColorScheme';
import { usePCSStore } from '@/store/usePCSStore';
import { HHGItem } from '@/types/pcs';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronLeft, Package, Plus, Trash2, Weight } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HHGTemplate extends Omit<HHGItem, 'id'> { }

const COMMON_ITEMS: HHGTemplate[] = [
  { category: 'FURNITURE', description: 'Couch/Sofa', estimatedWeight: 200 },
  { category: 'FURNITURE', description: 'King Bed Frame', estimatedWeight: 150 },
  { category: 'FURNITURE', description: 'Dining Table', estimatedWeight: 100 },
  { category: 'FURNITURE', description: 'Dresser', estimatedWeight: 120 },
  { category: 'FURNITURE', description: 'Bookshelf', estimatedWeight: 80 },
  { category: 'APPLIANCES', description: 'Refrigerator', estimatedWeight: 250 },
  { category: 'APPLIANCES', description: 'Washer + Dryer Set', estimatedWeight: 300 },
  { category: 'APPLIANCES', description: 'Microwave', estimatedWeight: 45 },
  { category: 'BOXES', description: 'Small Box (1.5 cu ft)', estimatedWeight: 30 },
  { category: 'BOXES', description: 'Medium Box (3 cu ft)', estimatedWeight: 50 },
  { category: 'BOXES', description: 'Large Box (4.5 cu ft)', estimatedWeight: 70 },
  { category: 'BOXES', description: 'Wardrobe Box', estimatedWeight: 90 },
  { category: 'VEHICLE', description: 'Motorcycle', estimatedWeight: 500 },
  { category: 'OTHER', description: 'Gym Equipment Set', estimatedWeight: 220 },
  { category: 'OTHER', description: 'Tool Chest', estimatedWeight: 180 },
  { category: 'OTHER', description: 'Outdoor Grill', estimatedWeight: 90 },
];

const TEMP_ITEM_PREFIX = 'tmp-hhg-';

const createTempItem = (template: HHGTemplate): HHGItem => ({
  id: `${TEMP_ITEM_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  category: template.category,
  description: template.description,
  estimatedWeight: template.estimatedWeight,
});

const formatLbs = (value: number): string => `${Math.round(value).toLocaleString()} lbs`;

const parseWeightInput = (raw: string): number => {
  const sanitized = raw.replace(/[^0-9]/g, '');
  const parsed = Number(sanitized || 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const isPersistedId = (id: string): boolean => !id.startsWith(TEMP_ITEM_PREFIX);

const areItemsEqual = (a: HHGItem, b: HHGItem): boolean =>
  a.category === b.category &&
  a.description === b.description &&
  a.estimatedWeight === b.estimatedWeight;

const getTotalToneClass = (percentage: number): string => {
  if (percentage > 100) return 'text-red-600 dark:text-red-400';
  if (percentage > 80) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
};

const getBadgeToneClass = (percentage: number): string => {
  if (percentage > 100) {
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300';
  }
  if (percentage > 80) {
    return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300';
  }
  return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300';
};

export default function HHGEstimatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const hhg = usePCSStore((state) => state.financials.hhg);
  const addHHGItem = usePCSStore((state) => state.addHHGItem);
  const removeHHGItem = usePCSStore((state) => state.removeHHGItem);

  const [items, setItems] = useState<HHGItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HHGItem | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [saving, setSaving] = useState(false);
  const initialItemsRef = useRef<HHGItem[]>([]);

  useEffect(() => {
    const allItems = (hhg.shipments || []).flatMap(s => s.items);
    const cloned = allItems.map((item) => ({ ...item }));
    setItems(cloned);
    initialItemsRef.current = cloned;
  }, [hhg.shipments]);

  const maxWeightAllowance = hhg.maxWeightAllowance || 0;

  const runningTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.estimatedWeight, 0),
    [items],
  );
  const usagePercent = maxWeightAllowance > 0 ? (runningTotal / maxWeightAllowance) * 100 : 0;
  const totalToneClass = getTotalToneClass(usagePercent);
  const badgeToneClass = getBadgeToneClass(usagePercent);

  const handleBack = () => {
    router.replace('/(tabs)/(pcs)/pcs' as any);
  };

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style).catch(() => undefined);
    }
  };

  const handleAddTemplate = (template: HHGTemplate) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => [...prev, createTempItem(template)]);
    setSheetOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const openEditModal = (item: HHGItem) => {
    setEditingItem(item);
    setWeightInput(`${Math.round(item.estimatedWeight)}`);
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setWeightInput('');
  };

  const saveEditedWeight = () => {
    if (!editingItem) return;
    const nextWeight = parseWeightInput(weightInput);
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? {
            ...item,
            estimatedWeight: nextWeight,
          }
          : item,
      ),
    );
    closeEditModal();
  };

  const handleSaveEstimate = () => {
    if (saving) return;
    setSaving(true);

    const initialItems = initialItemsRef.current;
    const initialMap = new Map(initialItems.map((item) => [item.id, item]));
    const localPersistedIds = new Set(items.filter((item) => isPersistedId(item.id)).map((item) => item.id));

    initialItems.forEach((item) => {
      if (!localPersistedIds.has(item.id)) {
        removeHHGItem(item.id);
      }
    });

    items.forEach((item) => {
      const initialItem = initialMap.get(item.id);

      if (!initialItem) {
        addHHGItem({
          category: item.category,
          description: item.description,
          estimatedWeight: item.estimatedWeight,
        });
        return;
      }

      if (!areItemsEqual(initialItem, item)) {
        removeHHGItem(initialItem.id);
        addHHGItem({
          category: item.category,
          description: item.description,
          estimatedWeight: item.estimatedWeight,
        });
      }
    });

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)/(pcs)/pcs' as any);
  };

  const renderDeleteAction = (id: string) => (
    <Pressable
      onPress={() => handleDeleteItem(id)}
      className="w-20 h-full rounded-xl ml-2 bg-red-500 dark:bg-red-700 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel="Delete HHG item"
    >
      <Trash2 size={18} color="#ffffff" />
      <Text className="text-[11px] font-semibold text-white mt-1">Delete</Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View style={{ paddingTop: insets.top }} className="bg-slate-50 dark:bg-slate-950 px-4 pb-2 pt-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }} className="text-slate-400 dark:text-gray-500">
              PHASE 2
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }} className="text-slate-900 dark:text-white">
              HHG Estimator
            </Text>
          </View>
          <Pressable onPress={handleBack} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
            <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
          </Pressable>
        </View>
      </View>

      <View className="px-4 pb-3 pt-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 z-10">
        <View className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Running Total
            </Text>
            <View className={`rounded-full border px-2.5 py-1 ${badgeToneClass}`}>
              <Text className="text-[11px] font-semibold">
                {Math.round(usagePercent)}%
              </Text>
            </View>
          </View>

          <Text className={`mt-1.5 text-xl font-black ${totalToneClass}`}>
            {formatLbs(runningTotal)}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            / {formatLbs(maxWeightAllowance)} limit
          </Text>

          <ScalePressable
            onPress={() => setSheetOpen(true)}
            className="mt-3 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5 flex-row items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Add HHG item"
          >
            <Plus size={16} color={isDark ? '#93c5fd' : '#1d4ed8'} />
            <Text className="ml-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
              Add Item
            </Text>
          </ScalePressable>
        </View>
      </View>

      <View className="flex-1 px-4 pt-3">
        <FlashList<HHGItem>
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Swipeable
              overshootRight={false}
              renderRightActions={() => renderDeleteAction(item.id)}
            >
              <Pressable
                onPress={() => openEditModal(item)}
                className="mb-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-bold text-slate-900 dark:text-white">
                      {item.description}
                    </Text>
                    <Text className="mt-0.5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {item.category}
                    </Text>
                  </View>

                  <View className="items-end">
                    <View className="flex-row items-center">
                      <Weight size={13} color={isDark ? '#94a3b8' : '#64748b'} />
                      <Text className="ml-1 text-sm font-bold text-slate-900 dark:text-white">
                        {formatLbs(item.estimatedWeight)}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Tap to edit
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Swipeable>
          )}
          ListEmptyComponent={
            <View className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 items-center mt-2">
              <Package size={22} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                No items added yet
              </Text>
              <Text className="mt-1 text-xs text-center text-slate-500 dark:text-slate-400">
                Tap Add Item to build your room-by-room estimate.
              </Text>
            </View>
          }
          // @ts-expect-error: FlashList type definitions are missing estimatedItemSize in this project setup.
          estimatedItemSize={94}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 20) + 110,
          }}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        className="absolute bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
      >
        <ScalePressable
          onPress={handleSaveEstimate}
          disabled={saving}
          className={`rounded-xl px-4 py-3.5 items-center ${saving
            ? 'bg-slate-300 dark:bg-slate-700'
            : 'bg-blue-600 dark:bg-blue-700'
            }`}
          accessibilityRole="button"
          accessibilityLabel="Save HHG estimate"
        >
          <Text className={`text-base font-bold ${saving ? 'text-slate-600 dark:text-slate-300' : 'text-white'}`}>
            Save Estimate
          </Text>
        </ScalePressable>
      </View>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/45">
          <Pressable className="flex-1" onPress={() => setSheetOpen(false)} />

          <Animated.View
            entering={FadeInUp.duration(220)}
            className="rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16), maxHeight: '72%' }}
          >
            <View className="items-center mb-3">
              <View className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
            </View>

            <Text className="text-lg font-bold text-slate-900 dark:text-white">Common HHG Items</Text>
            <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select a template to add it to your estimate.
            </Text>

            <View className="mt-3 flex-1">
              <FlashList<HHGTemplate>
                data={COMMON_ITEMS}
                keyExtractor={(item, index) => `${item.category}-${item.description}-${index}`}
                renderItem={({ item }) => (
                  <ScalePressable
                    onPress={() => handleAddTemplate(item)}
                    className="mb-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-3 flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/40"
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.description}`}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.description}
                      </Text>
                      <Text className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.category}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatLbs(item.estimatedWeight)}
                      </Text>
                      <Text className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                        Add
                      </Text>
                    </View>
                  </ScalePressable>
                )}
                // @ts-expect-error: FlashList type definitions are missing estimatedItemSize in this project setup.
                estimatedItemSize={76}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={!!editingItem}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <View className="flex-1 items-center justify-center bg-black/45 px-6">
          <View className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              Edit Item Weight
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {editingItem?.description || 'Selected Item'}
            </Text>

            <View className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 flex-row items-center">
              <Text className="text-slate-500 dark:text-slate-400 text-base mr-2">lbs</Text>
              <TextInput
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="number-pad"
                className="flex-1 text-lg font-bold text-slate-900 dark:text-white"
                placeholder="0"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                autoFocus
              />
            </View>

            <View className="mt-4 flex-row gap-2">
              <ScalePressable
                onPress={closeEditModal}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 items-center"
              >
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">Cancel</Text>
              </ScalePressable>
              <ScalePressable
                onPress={saveEditedWeight}
                className="flex-1 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-600 dark:bg-blue-700 px-3 py-2.5 items-center"
              >
                <Text className="text-sm font-semibold text-white">Save</Text>
              </ScalePressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
