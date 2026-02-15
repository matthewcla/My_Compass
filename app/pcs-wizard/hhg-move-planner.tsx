import { ScalePressable } from '@/components/ScalePressable';
import { HHGCostProjection } from '@/components/pcs/financials/HHGCostProjection';
import { MoveDatePlanner } from '@/components/pcs/widgets/MoveDatePlanner';
import { HHGWizardStatusBar } from '@/components/pcs/wizard/HHGWizardStatusBar';
import { useHeaderStore } from '@/store/useHeaderStore';
import { usePCSStore } from '@/store/usePCSStore';
import { HHGItem } from '@/types/pcs';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    CheckCircle,
    ChevronLeft,
    ExternalLink,
    Package,
    Plus,
    Trash2,
    Weight
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    LayoutChangeEvent,
    Linking,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
    useColorScheme,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── HHG Templates ─────────────────────────────────────────────

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
const TOTAL_STEPS = 4;

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

const formatCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ─── Screen ────────────────────────────────────────────────────

export default function HHGMovePlannerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const setHeaderVisible = useHeaderStore((state) => state.setVisible);

    const hhg = usePCSStore((s) => s.financials.hhg);
    const addHHGItem = usePCSStore((s) => s.addHHGItem);
    const removeHHGItem = usePCSStore((s) => s.removeHHGItem);
    const setChecklistItemStatus = usePCSStore((s) => s.setChecklistItemStatus);
    const checklist = usePCSStore((s) => s.checklist);

    // ── Hide Global Header ────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            setHeaderVisible(false);
            return () => setHeaderVisible(true);
        }, [setHeaderVisible])
    );

    // ── Local State ───────────────────────────────────────────
    const [items, setItems] = useState<HHGItem[]>([]);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<HHGItem | null>(null);
    const [weightInput, setWeightInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const initialItemsRef = useRef<HHGItem[]>([]);

    // ── Scroll Tracking State ─────────────────────────────────
    const [activeStep, setActiveStep] = useState(0);
    const scrollViewRef = useRef<any>(null);
    const sectionCoords = useRef<number[]>([]);

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

    // ── Auto-Save via Debounced Persistence ───────────────────
    useEffect(() => {
        if (items.length === 0 && initialItemsRef.current.length === 0) return;

        const timer = setTimeout(() => {
            persistItemsToStore();
        }, 800);

        return () => clearTimeout(timer);
    }, [items]);

    const maxWeightAllowance = hhg.maxWeightAllowance || 0;
    const runningTotal = useMemo(
        () => items.reduce((sum, item) => sum + item.estimatedWeight, 0),
        [items],
    );
    const usagePercent = maxWeightAllowance > 0 ? (runningTotal / maxWeightAllowance) * 100 : 0;
    const totalToneClass = getTotalToneClass(usagePercent);

    // ── Scroll Handlers ───────────────────────────────────────

    const handleSectionLayout = (index: number, event: LayoutChangeEvent) => {
        const layout = event.nativeEvent.layout;
        sectionCoords.current[index] = layout.y;
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        const triggerPoint = scrollY + (layoutHeight * 0.3);

        let newActive = 0;
        for (let i = 0; i < TOTAL_STEPS; i++) {
            const sectionTop = sectionCoords.current[i] || 0;
            if (triggerPoint >= sectionTop) {
                newActive = i;
            }
        }
        if (newActive !== activeStep) {
            setActiveStep(newActive);
        }
    };

    const scrollToSection = (index: number) => {
        const y = sectionCoords.current[index];
        if (y !== undefined) {
            scrollViewRef.current?.scrollTo({ y, animated: true });
        }
    };

    // ── Haptics ───────────────────────────────────────────────

    const triggerHaptic = useCallback((style: Haptics.ImpactFeedbackStyle) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(style).catch(() => undefined);
        }
    }, []);

    // ── Item CRUD ─────────────────────────────────────────────

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

    // ── Persistence Logic ─────────────────────────────────────

    const persistItemsToStore = () => {
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

        // Update ref to new baseline
        initialItemsRef.current = items.map((i) => ({ ...i }));
    };

    // ── Exit / Save / Complete ────────────────────────────────

    const handleExit = () => {
        setShowExitModal(true);
    };

    const confirmExit = (action: 'save' | 'discard') => {
        setShowExitModal(false);
        if (action === 'save') {
            persistItemsToStore();
        }
        // For discard, we skip persistence (auto-save may have already fired,
        // but items ref was updated — so nothing stale persists)
        router.back();
    };

    const handleSaveAndFinish = () => {
        if (saving) return;
        setSaving(true);

        persistItemsToStore();

        // Mark complete
        const hhgTask = checklist.find((c) => c.label === 'Plan & Schedule HHG Move');
        if (hhgTask) setChecklistItemStatus(hhgTask.id, 'COMPLETE');

        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

        // Success Celebration
        setShowSuccess(true);
        setTimeout(() => {
            router.replace('/(tabs)/(pcs)/pcs' as any);
        }, 2500);
    };

    // ── Swipe-to-Delete Action ────────────────────────────────

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
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            {isDark && (
                <LinearGradient
                    colors={['#0f172a', '#020617']}
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                />
            )}
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View className="flex-1">
                    {/* ── Sticky Header ─────────────────────────────── */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        className="bg-white/95 dark:bg-slate-900/95 sticky top-0 z-10 px-4 py-2"
                    >
                        <View className="flex-row items-start justify-between mb-1">
                            <View className="flex-1">
                                <Text
                                    style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }}
                                    className="text-slate-400 dark:text-gray-500 ml-8 mb-0"
                                >
                                    PHASE 2
                                </Text>
                                <Text
                                    style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}
                                    className="text-slate-900 dark:text-white ml-8 mb-1"
                                >
                                    HHG Move Planner
                                </Text>
                            </View>
                            <Pressable
                                onPress={handleExit}
                                className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
                            >
                                <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
                            </Pressable>
                        </View>
                        <HHGWizardStatusBar
                            currentStep={activeStep}
                            onStepPress={scrollToSection}
                        />
                    </Animated.View>

                    {/* ── Main Scroll Feed ──────────────────────────── */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
                    >
                        <Animated.ScrollView
                            entering={FadeInDown.delay(200).springify()}
                            ref={scrollViewRef}
                            className="flex-1"
                            contentContainerClassName="px-4 pt-4 pb-56"
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                        >
                            {/* ── Section 1: Weight Estimate ─────────── */}
                            <View onLayout={(e) => handleSectionLayout(0, e)} className="mb-6">
                                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">Weight Estimate</Text>

                                {/* Running Total Card */}
                                <View className="rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 px-4 py-3 mb-3">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Running Total</Text>
                                        <View className={`rounded-full px-2 py-0.5 ${usagePercent > 100 ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/40' : usagePercent > 80 ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40' : 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/40'}`}>
                                            <Text className={`text-[11px] font-semibold ${totalToneClass}`}>
                                                {Math.round(usagePercent)}%
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className={`mt-1 text-xl font-black ${totalToneClass}`}>{formatLbs(runningTotal)}</Text>
                                    <Text className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">/ {formatLbs(maxWeightAllowance)} limit</Text>

                                    <ScalePressable
                                        onPress={() => setSheetOpen(true)}
                                        className="mt-3 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5 flex-row items-center justify-center"
                                        accessibilityRole="button"
                                        accessibilityLabel="Add HHG item"
                                    >
                                        <Plus size={16} color={isDark ? '#93c5fd' : '#1d4ed8'} />
                                        <Text className="ml-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">Add Item</Text>
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
                                                        className="mb-2 rounded-xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 px-3.5 py-3"
                                                    >
                                                        <View className="flex-row items-center justify-between">
                                                            <View className="flex-1 pr-3">
                                                                <Text className="text-base font-bold text-slate-900 dark:text-white">{item.description}</Text>
                                                                <Text className="mt-0.5 text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">{item.category}</Text>
                                                            </View>
                                                            <View className="items-end">
                                                                <View className="flex-row items-center">
                                                                    <Weight size={13} color={isDark ? '#94a3b8' : '#64748b'} />
                                                                    <Text className="ml-1 text-sm font-bold text-slate-900 dark:text-white">{formatLbs(item.estimatedWeight)}</Text>
                                                                </View>
                                                                <Text className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">Tap to edit</Text>
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
                                    <View className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 p-5 items-center">
                                        <Package size={22} color={isDark ? '#94a3b8' : '#64748b'} />
                                        <Text className="mt-2 text-sm font-semibold text-slate-700 dark:text-zinc-200">No items added yet</Text>
                                        <Text className="mt-1 text-xs text-center text-slate-500 dark:text-zinc-400">Tap Add Item to build your room-by-room estimate.</Text>
                                    </View>
                                )}
                            </View>

                            {/* ── Section 2: Cost Projection ─────────── */}
                            <View onLayout={(e) => handleSectionLayout(1, e)} className="mb-6">
                                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">Cost Projection</Text>
                                <HHGCostProjection />
                            </View>

                            {/* ── Section 3: Move Dates ───────────────── */}
                            <View onLayout={(e) => handleSectionLayout(2, e)} className="mb-6">
                                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">Move Dates</Text>
                                <MoveDatePlanner />
                            </View>

                            {/* ── Section 4: Review ───────────────────── */}
                            <View onLayout={(e) => handleSectionLayout(3, e)} className="mb-6">
                                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">Review</Text>
                                <View className="rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 p-4 gap-3">
                                    <View className="flex-row justify-between">
                                        <Text className="text-slate-500 dark:text-zinc-400 text-sm">Estimated Weight</Text>
                                        <Text className="text-slate-900 dark:text-white text-sm font-semibold">{formatLbs(runningTotal)}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-slate-500 dark:text-zinc-400 text-sm">Shipment Type</Text>
                                        <Text className="text-slate-900 dark:text-white text-sm font-semibold">{hhg.shipmentType === 'PPM' ? 'PPM (DITY)' : 'GBL (Gov. Shipment)'}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-slate-500 dark:text-zinc-400 text-sm">Est. Excess Cost</Text>
                                        <Text className={`text-sm font-semibold ${hhg.estimatedExcessCost > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                            {hhg.estimatedExcessCost > 0 ? `$${hhg.estimatedExcessCost.toLocaleString()}` : '$0'}
                                        </Text>
                                    </View>

                                    {/* External DPS Link */}
                                    <Pressable
                                        onPress={() => Linking.openURL('https://www.move.mil')}
                                        className="mt-2 flex-row items-center justify-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/30 px-4 py-3"
                                    >
                                        <ExternalLink size={16} color={isDark ? '#93c5fd' : '#1d4ed8'} />
                                        <Text className="text-blue-700 dark:text-blue-300 text-sm font-semibold">Schedule on move.mil →</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </Animated.ScrollView>
                    </KeyboardAvoidingView>

                    {/* ── Floating HUD Footer ──────────────────────── */}
                    <View
                        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
                        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    >
                        <View className="pt-4 px-4">
                            {/* HUD Summary Row */}
                            <View className="flex-row justify-between mb-3">
                                <View className="items-center flex-1">
                                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Weight</Text>
                                    <Text className={`text-sm font-bold ${totalToneClass}`}>
                                        {formatLbs(runningTotal)}
                                    </Text>
                                </View>
                                <View className="items-center flex-1">
                                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Type</Text>
                                    <Text className="text-sm font-bold text-slate-900 dark:text-white">
                                        {hhg.shipmentType === 'PPM' ? 'PPM' : 'GBL'}
                                    </Text>
                                </View>
                                <View className="items-center flex-1">
                                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Excess Cost</Text>
                                    <Text className={`text-sm font-bold ${hhg.estimatedExcessCost > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                        {hhg.estimatedExcessCost > 0 ? formatCurrency(hhg.estimatedExcessCost) : '$0'}
                                    </Text>
                                </View>
                            </View>

                            {/* Save & Complete Button */}
                            <Pressable
                                onPress={handleSaveAndFinish}
                                disabled={saving}
                                className={`flex-1 h-14 rounded-xl flex-row items-center justify-center ${!saving
                                    ? 'bg-emerald-600 active:bg-emerald-700'
                                    : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                            >
                                <CheckCircle size={20} color="white" />
                                <Text className="text-white font-bold text-lg ml-2">
                                    Save & Complete
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            {/* ── Exit Confirmation Modal ──────────────────────── */}
            {showExitModal && (
                <View className="absolute inset-0 z-50 items-center justify-center p-4">
                    {/* Backdrop */}
                    <Animated.View entering={FadeIn} className="absolute inset-0 bg-black/60">
                        <Pressable className="flex-1" onPress={() => setShowExitModal(false)} />
                    </Animated.View>

                    {/* Content */}
                    <Animated.View entering={ZoomIn.duration(200)} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
                        <View className="p-6 items-center">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                                Save Progress?
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-center mb-6">
                                Would you like to save your HHG estimate before exiting?
                            </Text>

                            <View className="w-full gap-3">
                                {/* Save & Exit */}
                                <Pressable
                                    onPress={() => confirmExit('save')}
                                    className="w-full py-3 bg-blue-600 rounded-xl items-center active:bg-blue-700"
                                >
                                    <Text className="text-white font-semibold">Save & Exit</Text>
                                </Pressable>

                                {/* Discard */}
                                <Pressable
                                    onPress={() => confirmExit('discard')}
                                    className="w-full py-3 bg-red-50 dark:bg-red-900/20 rounded-xl items-center active:bg-red-100 dark:active:bg-red-900/30"
                                >
                                    <Text className="text-red-600 dark:text-red-400 font-semibold">Discard</Text>
                                </Pressable>

                                {/* Cancel */}
                                <Pressable
                                    onPress={() => setShowExitModal(false)}
                                    className="w-full py-3 mt-2 items-center"
                                >
                                    <Text className="text-slate-500 dark:text-slate-400 font-medium">Cancel</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            )}

            {/* ── Success Celebration Overlay ──────────────────── */}
            {showSuccess && (
                <Animated.View
                    entering={FadeIn}
                    className="absolute inset-0 z-50 items-center justify-center"
                >
                    <BlurView
                        intensity={40}
                        tint="dark"
                        className="absolute inset-0 items-center justify-center bg-black/40"
                    >
                        <Animated.View entering={ZoomIn.delay(200).springify()}>
                            <CheckCircle size={100} color="white" strokeWidth={2.5} />
                        </Animated.View>
                        <Animated.Text entering={FadeInUp.delay(500)} className="text-white text-3xl font-bold mt-8 tracking-tight">
                            HHG Plan Saved!
                        </Animated.Text>
                        <Animated.Text entering={FadeInUp.delay(600)} className="text-blue-100 text-lg mt-3 text-center">
                            Your household goods estimate{'\n'}has been saved to your PCS plan.
                        </Animated.Text>
                    </BlurView>
                </Animated.View>
            )}

            {/* ── Add Item Sheet Modal ─────────────────────────── */}
            <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
                <View className="flex-1 justify-end bg-black/45">
                    <Pressable className="flex-1" onPress={() => setSheetOpen(false)} />
                    <Animated.View
                        entering={FadeInUp.duration(220)}
                        className="rounded-t-3xl bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-700 px-4 pt-4"
                        style={{ paddingBottom: Math.max(insets.bottom, 16), maxHeight: '72%' }}
                    >
                        <View className="items-center mb-3">
                            <View className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-zinc-700" />
                        </View>
                        <Text className="text-lg font-bold text-slate-900 dark:text-white">Common HHG Items</Text>
                        <Text className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Select a template to add it to your estimate.</Text>
                        <View className="mt-3 flex-1">
                            <FlashList<HHGTemplate>
                                data={COMMON_ITEMS}
                                keyExtractor={(item, index) => `${item.category}-${item.description}-${index}`}
                                renderItem={({ item }) => (
                                    <ScalePressable
                                        onPress={() => handleAddTemplate(item)}
                                        className="mb-2 rounded-xl border border-slate-200 dark:border-zinc-700/50 px-3.5 py-3 flex-row items-center justify-between bg-slate-50 dark:bg-zinc-800/40"
                                        accessibilityRole="button"
                                        accessibilityLabel={`Add ${item.description}`}
                                    >
                                        <View className="flex-1 pr-3">
                                            <Text className="text-sm font-semibold text-slate-900 dark:text-white">{item.description}</Text>
                                            <Text className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-0.5">{item.category}</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-sm font-bold text-slate-800 dark:text-zinc-200">{formatLbs(item.estimatedWeight)}</Text>
                                            <Text className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">Add</Text>
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
                    <View className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
                        <Text className="text-base font-bold text-slate-900 dark:text-white">Edit Item Weight</Text>
                        <Text className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{editingItem?.description || 'Selected Item'}</Text>
                        <View className="mt-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 px-3 py-2.5 flex-row items-center">
                            <Text className="text-slate-500 dark:text-zinc-400 text-base mr-2">lbs</Text>
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
                            <ScalePressable onPress={closeEditModal} className="flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 px-3 py-2.5 items-center">
                                <Text className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Cancel</Text>
                            </ScalePressable>
                            <ScalePressable onPress={saveEditedWeight} className="flex-1 rounded-lg bg-blue-600 dark:bg-blue-700 px-3 py-2.5 items-center">
                                <Text className="text-sm font-semibold text-white">Save</Text>
                            </ScalePressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
