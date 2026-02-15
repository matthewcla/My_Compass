import { ScalePressable } from '@/components/ScalePressable';
import { HHGCostProjection } from '@/components/pcs/financials/HHGCostProjection';
import { MoveDatePlanner } from '@/components/pcs/widgets/MoveDatePlanner';
import { useColorScheme } from '@/components/useColorScheme';
import { usePCSStore } from '@/store/usePCSStore';
import { HHGItem } from '@/types/pcs';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
    Calendar,
    ChevronLeft,
    DollarSign,
    ExternalLink,
    Package,
    Plus,
    Scale,
    Trash2,
    Weight,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── HHG Templates (same as original estimator) ────────────────

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
    if (percentage > 100) return 'text-red-400';
    if (percentage > 80) return 'text-amber-400';
    return 'text-emerald-400';
};

// ─── Sections ──────────────────────────────────────────────────

type SectionKey = 'weight' | 'cost' | 'dates' | 'review';

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
    { key: 'weight', label: '1. Weight Estimate', icon: <Scale size={16} color="#3b82f6" /> },
    { key: 'cost', label: '2. Cost Projection', icon: <DollarSign size={16} color="#a855f7" /> },
    { key: 'dates', label: '3. Move Dates', icon: <Calendar size={16} color="#f59e0b" /> },
    { key: 'review', label: '4. Review', icon: <Package size={16} color="#10b981" /> },
];

// ─── Screen ────────────────────────────────────────────────────

export default function HHGMovePlannerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const hhg = usePCSStore((s) => s.financials.hhg);
    const addHHGItem = usePCSStore((s) => s.addHHGItem);
    const removeHHGItem = usePCSStore((s) => s.removeHHGItem);
    const setChecklistItemStatus = usePCSStore((s) => s.setChecklistItemStatus);
    const checklist = usePCSStore((s) => s.checklist);

    // Local items state (same pattern as original estimator)
    const [items, setItems] = useState<HHGItem[]>([]);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<HHGItem | null>(null);
    const [weightInput, setWeightInput] = useState('');
    const [saving, setSaving] = useState(false);
    const initialItemsRef = useRef<HHGItem[]>([]);

    useEffect(() => {
        const cloned = (hhg.items || []).map((item) => ({ ...item }));
        setItems(cloned);
        initialItemsRef.current = cloned;

        // Auto-mark in-progress when flow is opened
        const hhgTask = checklist.find((c) => c.label === 'Plan & Schedule HHG Move');
        if (hhgTask && hhgTask.status === 'NOT_STARTED') {
            setChecklistItemStatus(hhgTask.id, 'IN_PROGRESS');
        }
    }, []);

    const maxWeightAllowance = hhg.maxWeightAllowance || 0;
    const runningTotal = useMemo(
        () => items.reduce((sum, item) => sum + item.estimatedWeight, 0),
        [items],
    );
    const usagePercent = maxWeightAllowance > 0 ? (runningTotal / maxWeightAllowance) * 100 : 0;
    const totalToneClass = getTotalToneClass(usagePercent);

    const handleBack = () => router.replace('/(tabs)/(pcs)/pcs' as any);

    const triggerHaptic = useCallback((style: Haptics.ImpactFeedbackStyle) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(style).catch(() => undefined);
        }
    }, []);

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
                item.id === editingItem.id ? { ...item, estimatedWeight: nextWeight } : item
            )
        );
        closeEditModal();
    };

    const handleSaveAndFinish = () => {
        if (saving) return;
        setSaving(true);

        // Persist items to store (same diff logic as original estimator)
        const initialItems = initialItemsRef.current;
        const initialMap = new Map(initialItems.map((item) => [item.id, item]));
        const localPersistedIds = new Set(items.filter((i) => isPersistedId(i.id)).map((i) => i.id));

        initialItems.forEach((item) => {
            if (!localPersistedIds.has(item.id)) removeHHGItem(item.id);
        });

        items.forEach((item) => {
            const initialItem = initialMap.get(item.id);
            if (!initialItem) {
                addHHGItem({ category: item.category, description: item.description, estimatedWeight: item.estimatedWeight });
                return;
            }
            if (!areItemsEqual(initialItem, item)) {
                removeHHGItem(initialItem.id);
                addHHGItem({ category: item.category, description: item.description, estimatedWeight: item.estimatedWeight });
            }
        });

        // Mark complete
        const hhgTask = checklist.find((c) => c.label === 'Plan & Schedule HHG Move');
        if (hhgTask) setChecklistItemStatus(hhgTask.id, 'COMPLETE');

        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        router.replace('/(tabs)/(pcs)/pcs' as any);
    };

    const renderDeleteAction = (id: string) => (
        <Pressable
            onPress={() => handleDeleteItem(id)}
            className="w-20 h-full rounded-xl ml-2 bg-red-700 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Delete HHG item"
        >
            <Trash2 size={18} color="#ffffff" />
            <Text className="text-[11px] font-semibold text-white mt-1">Delete</Text>
        </Pressable>
    );

    return (
        <View className="flex-1 bg-slate-950">
            {/* ── Header ───────────────────────────────────────── */}
            <View style={{ paddingTop: insets.top }} className="bg-slate-950 px-4 pb-2 pt-2">
                <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }} className="text-gray-500">
                            PHASE 2
                        </Text>
                        <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }} className="text-white">
                            HHG Move Planner
                        </Text>
                    </View>
                    <Pressable onPress={handleBack} className="p-2 rounded-full active:bg-slate-800">
                        <ChevronLeft size={24} color="#e2e8f0" />
                    </Pressable>
                </View>
            </View>

            {/* ── Section Progress Dots ────────────────────────── */}
            <View className="flex-row px-4 pb-3 gap-2">
                {SECTIONS.map((s) => (
                    <View key={s.key} className="flex-row items-center gap-1.5 flex-1">
                        {s.icon}
                        <Text className="text-[10px] text-zinc-400 font-medium">{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* ── Content ──────────────────────────────────────── */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Section 1: Weight Estimate ─────────────────── */}
                <View className="px-4 mb-6">
                    <Text className="text-lg font-bold text-white mb-3">Weight Estimate</Text>

                    {/* Running Total Card */}
                    <View className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 mb-3">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Running Total</Text>
                            <View className={`rounded-full px-2 py-0.5 ${usagePercent > 100 ? 'bg-red-900/30 border border-red-700/40' : usagePercent > 80 ? 'bg-amber-900/30 border border-amber-700/40' : 'bg-emerald-900/30 border border-emerald-700/40'}`}>
                                <Text className={`text-[11px] font-semibold ${totalToneClass}`}>
                                    {Math.round(usagePercent)}%
                                </Text>
                            </View>
                        </View>
                        <Text className={`mt-1 text-xl font-black ${totalToneClass}`}>{formatLbs(runningTotal)}</Text>
                        <Text className="text-xs text-zinc-400 mt-0.5">/ {formatLbs(maxWeightAllowance)} limit</Text>

                        <ScalePressable
                            onPress={() => setSheetOpen(true)}
                            className="mt-3 rounded-lg border border-blue-800/40 bg-blue-900/20 px-3 py-2.5 flex-row items-center justify-center"
                            accessibilityRole="button"
                            accessibilityLabel="Add HHG item"
                        >
                            <Plus size={16} color="#93c5fd" />
                            <Text className="ml-1.5 text-xs font-semibold text-blue-300">Add Item</Text>
                        </ScalePressable>
                    </View>

                    {/* Items List */}
                    {items.length > 0 ? (
                        <View style={{ minHeight: items.length * 76 }}>
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
                                            className="mb-2 rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-3"
                                        >
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-1 pr-3">
                                                    <Text className="text-base font-bold text-white">{item.description}</Text>
                                                    <Text className="mt-0.5 text-xs uppercase tracking-wider text-zinc-400">{item.category}</Text>
                                                </View>
                                                <View className="items-end">
                                                    <View className="flex-row items-center">
                                                        <Weight size={13} color="#94a3b8" />
                                                        <Text className="ml-1 text-sm font-bold text-white">{formatLbs(item.estimatedWeight)}</Text>
                                                    </View>
                                                    <Text className="text-[11px] text-zinc-500 mt-1">Tap to edit</Text>
                                                </View>
                                            </View>
                                        </Pressable>
                                    </Swipeable>
                                )}
                                // @ts-expect-error: FlashList type definitions
                                estimatedItemSize={76}
                                scrollEnabled={false}
                            />
                        </View>
                    ) : (
                        <View className="rounded-xl border border-dashed border-zinc-700 bg-zinc-800/30 p-5 items-center">
                            <Package size={22} color="#94a3b8" />
                            <Text className="mt-2 text-sm font-semibold text-zinc-200">No items added yet</Text>
                            <Text className="mt-1 text-xs text-center text-zinc-400">Tap Add Item to build your room-by-room estimate.</Text>
                        </View>
                    )}
                </View>

                {/* ── Section 2: Cost Projection ─────────────────── */}
                <View className="px-4 mb-6">
                    <Text className="text-lg font-bold text-white mb-3">Cost Projection</Text>
                    <HHGCostProjection />
                </View>

                {/* ── Section 3: Move Dates ──────────────────────── */}
                <View className="px-4 mb-6">
                    <Text className="text-lg font-bold text-white mb-3">Move Dates</Text>
                    <MoveDatePlanner />
                </View>

                {/* ── Section 4: Review ──────────────────────────── */}
                <View className="px-4 mb-6">
                    <Text className="text-lg font-bold text-white mb-3">Review</Text>
                    <View className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4 gap-3">
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-400 text-sm">Estimated Weight</Text>
                            <Text className="text-white text-sm font-semibold">{formatLbs(runningTotal)}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-400 text-sm">Shipment Type</Text>
                            <Text className="text-white text-sm font-semibold">{hhg.shipmentType === 'PPM' ? 'PPM (DITY)' : 'GBL (Gov. Shipment)'}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-400 text-sm">Est. Excess Cost</Text>
                            <Text className={`text-sm font-semibold ${hhg.estimatedExcessCost > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {hhg.estimatedExcessCost > 0 ? `$${hhg.estimatedExcessCost.toLocaleString()}` : '$0'}
                            </Text>
                        </View>

                        {/* External DPS Link */}
                        <Pressable
                            onPress={() => Linking.openURL('https://www.move.mil')}
                            className="mt-2 flex-row items-center justify-center gap-2 rounded-xl border border-blue-800/40 bg-blue-950/30 px-4 py-3"
                        >
                            <ExternalLink size={16} color="#93c5fd" />
                            <Text className="text-blue-300 text-sm font-semibold">Schedule on move.mil →</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>

            {/* ── Bottom CTA ───────────────────────────────────── */}
            <View
                style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-slate-950 p-4"
            >
                <ScalePressable
                    onPress={handleSaveAndFinish}
                    disabled={saving}
                    className={`rounded-xl px-4 py-3.5 items-center ${saving ? 'bg-zinc-700' : 'bg-blue-600'}`}
                    accessibilityRole="button"
                    accessibilityLabel="Save HHG plan"
                >
                    <Text className={`text-base font-bold ${saving ? 'text-zinc-300' : 'text-white'}`}>
                        Save & Complete
                    </Text>
                </ScalePressable>
            </View>

            {/* ── Add Item Sheet Modal ─────────────────────────── */}
            <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
                <View className="flex-1 justify-end bg-black/45">
                    <Pressable className="flex-1" onPress={() => setSheetOpen(false)} />
                    <Animated.View
                        entering={FadeInUp.duration(220)}
                        className="rounded-t-3xl bg-zinc-900 border-t border-zinc-700 px-4 pt-4"
                        style={{ paddingBottom: Math.max(insets.bottom, 16), maxHeight: '72%' }}
                    >
                        <View className="items-center mb-3">
                            <View className="h-1.5 w-12 rounded-full bg-zinc-700" />
                        </View>
                        <Text className="text-lg font-bold text-white">Common HHG Items</Text>
                        <Text className="mt-1 text-xs text-zinc-400">Select a template to add it to your estimate.</Text>
                        <View className="mt-3 flex-1">
                            <FlashList<HHGTemplate>
                                data={COMMON_ITEMS}
                                keyExtractor={(item, index) => `${item.category}-${item.description}-${index}`}
                                renderItem={({ item }) => (
                                    <ScalePressable
                                        onPress={() => handleAddTemplate(item)}
                                        className="mb-2 rounded-xl border border-zinc-700/50 px-3.5 py-3 flex-row items-center justify-between bg-zinc-800/40"
                                        accessibilityRole="button"
                                        accessibilityLabel={`Add ${item.description}`}
                                    >
                                        <View className="flex-1 pr-3">
                                            <Text className="text-sm font-semibold text-white">{item.description}</Text>
                                            <Text className="text-[11px] uppercase tracking-wider text-zinc-400 mt-0.5">{item.category}</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-sm font-bold text-zinc-200">{formatLbs(item.estimatedWeight)}</Text>
                                            <Text className="text-[11px] text-blue-400 mt-0.5">Add</Text>
                                        </View>
                                    </ScalePressable>
                                )}
                                // @ts-expect-error: FlashList type definitions
                                estimatedItemSize={76}
                                keyboardShouldPersistTaps="handled"
                            />
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* ── Edit Weight Modal ────────────────────────────── */}
            <Modal visible={!!editingItem} transparent animationType="fade" onRequestClose={closeEditModal}>
                <View className="flex-1 items-center justify-center bg-black/45 px-6">
                    <View className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
                        <Text className="text-base font-bold text-white">Edit Item Weight</Text>
                        <Text className="text-xs text-zinc-400 mt-1">{editingItem?.description || 'Selected Item'}</Text>
                        <View className="mt-4 rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 flex-row items-center">
                            <Text className="text-zinc-400 text-base mr-2">lbs</Text>
                            <TextInput
                                value={weightInput}
                                onChangeText={setWeightInput}
                                keyboardType="number-pad"
                                className="flex-1 text-lg font-bold text-white"
                                placeholder="0"
                                placeholderTextColor="#64748b"
                                autoFocus
                            />
                        </View>
                        <View className="mt-4 flex-row gap-2">
                            <ScalePressable onPress={closeEditModal} className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 items-center">
                                <Text className="text-sm font-semibold text-zinc-200">Cancel</Text>
                            </ScalePressable>
                            <ScalePressable onPress={saveEditedWeight} className="flex-1 rounded-lg bg-blue-600 px-3 py-2.5 items-center">
                                <Text className="text-sm font-semibold text-white">Save</Text>
                            </ScalePressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
