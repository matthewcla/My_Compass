import { ScalePressable } from '@/components/ScalePressable';
import { HHGCostProjection } from '@/components/pcs/financials/HHGCostProjection';
import { HHGWeightRing } from '@/components/pcs/widgets/HHGWeightRing';
import { MoveDatePlanner } from '@/components/pcs/widgets/MoveDatePlanner';
import { ShipmentCreationModal } from '@/components/pcs/widgets/ShipmentCreationModal';
import { HHGWizardStatusBar } from '@/components/pcs/wizard/HHGWizardStatusBar';
import { services } from '@/services/api/serviceRegistry';
import { useHeaderStore } from '@/store/useHeaderStore';
import { usePCSStore } from '@/store/usePCSStore';
import { isApiSuccess } from '@/types/api';
import { HHGItem } from '@/types/pcs';
import { HHGTemplate, HHG_CATALOGUE, HHG_ROOMS, QUICK_ESTIMATE_PRESETS, getQuickEstimateWeight } from '@/utils/hhg';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    ArrowRight,
    CheckCircle,
    ChevronLeft,
    Home,
    Loader2,
    MapPin,
    Package,
    PenLine,
    Plus,
    Send,
    Trash2,
    Truck,
    Warehouse,
    Weight,
    Zap
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    LayoutChangeEvent,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    useColorScheme
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Use the catalogue from utils/hhg.ts — no inline templates needed

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
    const addItemToShipment = usePCSStore((s) => s.addItemToShipment);
    const removeItemFromShipment = usePCSStore((s) => s.removeItemFromShipment);
    const setChecklistItemStatus = usePCSStore((s) => s.setChecklistItemStatus);
    const checklist = usePCSStore((s) => s.checklist);
    const activeOrder = usePCSStore((s) => s.activeOrder);
    const addShipmentAction = usePCSStore((s) => s.addShipment);
    const updateShipment = usePCSStore((s) => s.updateShipment);

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

    // Multi-shipment
    const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
    const [showCreateShipment, setShowCreateShipment] = useState(false);

    // Catalogue UI
    const [selectedRoom, setSelectedRoom] = useState<string>('Living Room');
    const [showCustomEntry, setShowCustomEntry] = useState(false);
    const [customDesc, setCustomDesc] = useState('');
    const [customWeight, setCustomWeight] = useState('');
    const [showQuickEstimate, setShowQuickEstimate] = useState(false);

    // DPS Submission
    const [dpsSubmitting, setDpsSubmitting] = useState(false);
    const [dpsConfirmation, setDpsConfirmation] = useState<string | null>(null);

    // ── Scroll Tracking State ─────────────────────────────────
    const [activeStep, setActiveStep] = useState(0);
    const scrollViewRef = useRef<any>(null);
    const sectionCoords = useRef<number[]>([]);

    // ── Derived Shipment State ────────────────────────────────
    const shipments = useMemo(() => hhg.shipments || [], [hhg.shipments]);
    const activeShipment = useMemo(
        () => shipments.find(s => s.id === activeShipmentId) ?? shipments[0] ?? null,
        [shipments, activeShipmentId],
    );

    // Ensure we always track a real shipment; create a default if none exist
    useEffect(() => {
        if (shipments.length === 0) {
            addShipmentAction('GBL', 'Main Shipment', '');
        }
    }, [shipments.length]);

    // Sync activeShipmentId to first shipment if unset
    useEffect(() => {
        if (!activeShipmentId && shipments.length > 0) {
            setActiveShipmentId(shipments[0].id);
        }
    }, [activeShipmentId, shipments]);

    // Load items for active shipment
    useEffect(() => {
        if (!activeShipment) return;
        const cloned = activeShipment.items.map((item) => ({ ...item }));
        setItems(cloned);
        initialItemsRef.current = cloned;

        // Auto-mark in-progress when flow is opened
        const hhgTask = checklist.find((c) => c.label === 'Plan & Schedule HHG Move');
        if (hhgTask && hhgTask.status === 'NOT_STARTED') {
            setChecklistItemStatus(hhgTask.id, 'IN_PROGRESS');
        }
    }, [activeShipment?.id]);

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
    const aggregateWeight = useMemo(
        () => shipments.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.estimatedWeight, 0), 0),
        [shipments],
    );
    const usagePercent = maxWeightAllowance > 0 ? (aggregateWeight / maxWeightAllowance) * 100 : 0;
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

    // ── Custom Item Entry ─────────────────────────────────────

    const handleAddCustomItem = () => {
        const w = parseWeightInput(customWeight);
        if (!customDesc.trim() || w <= 0) return;
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        setItems((prev) => [...prev, createTempItem({
            category: 'OTHER',
            description: customDesc.trim(),
            estimatedWeight: w,
            room: 'Other',
        })]);
        setCustomDesc('');
        setCustomWeight('');
        setShowCustomEntry(false);
    };

    // ── Quick Estimate ────────────────────────────────────────

    const handleQuickEstimate = (presetKey: string) => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        const weight = getQuickEstimateWeight(presetKey);
        setItems([createTempItem({
            category: 'OTHER',
            description: `Quick Estimate — ${presetKey}`,
            estimatedWeight: weight,
            room: 'Other',
        })]);
        setShowQuickEstimate(false);
        setSheetOpen(false);
    };

    // ── In-App DPS Submission ─────────────────────────────────

    const handleDPSSubmit = async () => {
        if (dpsSubmitting || runningTotal === 0) return;
        setDpsSubmitting(true);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

        const shipment = hhg.shipments?.[0];
        const result = await services.dps.createMoveRequest({
            originZip: shipment?.originZip || '23604',
            destinationZip: shipment?.destinationZip || activeOrder?.gainingCommand?.zip || '92134',
            estimatedWeight: runningTotal,
            shipmentType: (shipment?.type as any) || 'GBL',
            requestedPickupWindowId: shipment?.selectedPickupWindowId || '',
            memberName: 'Service Member',
            ordersNumber: activeOrder?.orderNumber || '',
        });

        if (isApiSuccess(result)) {
            setDpsConfirmation(result.data.confirmationNumber);
            triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        }
        setDpsSubmitting(false);
    };

    // ── Persistence Logic ─────────────────────────────────────

    const persistItemsToStore = () => {
        if (!activeShipment) return;
        const shipmentId = activeShipment.id;
        const initialItems = initialItemsRef.current;
        const initialMap = new Map(initialItems.map((item) => [item.id, item]));
        const localPersistedIds = new Set(items.filter((i) => isPersistedId(i.id)).map((i) => i.id));

        initialItems.forEach((item) => {
            if (!localPersistedIds.has(item.id)) removeItemFromShipment(shipmentId, item.id);
        });

        items.forEach((item) => {
            const initialItem = initialMap.get(item.id);
            if (!initialItem) {
                addItemToShipment(shipmentId, { category: item.category, description: item.description, estimatedWeight: item.estimatedWeight });
                return;
            }
            if (!areItemsEqual(initialItem, item)) {
                removeItemFromShipment(shipmentId, initialItem.id);
                addItemToShipment(shipmentId, { category: item.category, description: item.description, estimatedWeight: item.estimatedWeight });
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
                            {/* ── Shipment Tabs ──────────────────────── */}
                            <View className="mb-4">
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
                                    <View className="flex-row gap-2">
                                        {shipments.map((s) => {
                                            const isActive = s.id === activeShipment?.id;
                                            const TypeIcon = s.type === 'NTS' ? Warehouse : s.type === 'PPM' ? Package : Truck;
                                            return (
                                                <ScalePressable
                                                    key={s.id}
                                                    onPress={() => {
                                                        persistItemsToStore();
                                                        setActiveShipmentId(s.id);
                                                    }}
                                                    className={`rounded-xl border px-3 py-2 flex-row items-center ${isActive
                                                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                                                        : 'border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50'
                                                        }`}
                                                >
                                                    <TypeIcon size={14} color={isActive ? (isDark ? '#93c5fd' : '#1d4ed8') : (isDark ? '#94a3b8' : '#64748b')} />
                                                    <Text className={`ml-1.5 text-xs font-semibold ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-zinc-300'
                                                        }`}>{s.label}</Text>
                                                    <View className={`ml-2 rounded-full px-1.5 py-0.5 ${isActive ? 'bg-blue-200/50 dark:bg-blue-800/40' : 'bg-slate-100 dark:bg-zinc-700/50'
                                                        }`}>
                                                        <Text className={`text-[9px] font-bold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-400'
                                                            }`}>{s.type}</Text>
                                                    </View>
                                                </ScalePressable>
                                            );
                                        })}
                                        {/* Add Shipment Button */}
                                        <ScalePressable
                                            onPress={() => setShowCreateShipment(true)}
                                            className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-600 px-3 py-2 flex-row items-center"
                                        >
                                            <Plus size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                                            <Text className="ml-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">Add Lot</Text>
                                        </ScalePressable>
                                    </View>
                                </ScrollView>

                                {/* Origin → Destination card */}
                                {activeShipment && (
                                    <View className="mt-3 rounded-xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 px-3 py-3">
                                        <View className="flex-row items-center gap-2">
                                            {/* Origin */}
                                            <View className="flex-1">
                                                <View className="flex-row items-center mb-1">
                                                    <MapPin size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                                                    <Text className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                                        {activeShipment.type === 'NTS' ? 'Storage ZIP' : 'Origin'}
                                                    </Text>
                                                </View>
                                                <TextInput
                                                    value={activeShipment.originZip}
                                                    onChangeText={(text) => updateShipment(activeShipment.id, { originZip: text })}
                                                    placeholder="ZIP"
                                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                                    keyboardType="number-pad"
                                                    maxLength={5}
                                                    className="text-base font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-800/60 rounded-lg px-2.5 py-2 border border-slate-200 dark:border-zinc-700"
                                                />
                                            </View>

                                            {/* Arrow */}
                                            <View className="pt-4">
                                                <ArrowRight size={18} color={isDark ? '#64748b' : '#94a3b8'} />
                                            </View>

                                            {/* Destination */}
                                            <View className="flex-1">
                                                <View className="flex-row items-center mb-1">
                                                    <MapPin size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                                                    <Text className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                                        Destination
                                                    </Text>
                                                </View>
                                                <TextInput
                                                    value={activeShipment.type === 'NTS' ? '' : (activeShipment.destinationZip ?? '')}
                                                    onChangeText={(text) => updateShipment(activeShipment.id, { destinationZip: text })}
                                                    placeholder={activeShipment.type === 'NTS' ? 'N/A' : 'ZIP'}
                                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                                    keyboardType="number-pad"
                                                    maxLength={5}
                                                    editable={activeShipment.type !== 'NTS'}
                                                    className={`text-base font-bold rounded-lg px-2.5 py-2 border ${activeShipment.type === 'NTS'
                                                        ? 'text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-800/30 border-slate-100 dark:border-zinc-800'
                                                        : 'text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700'
                                                        }`}
                                                />
                                            </View>
                                        </View>

                                        {/* SIT Toggle — only for GBL/PPM */}
                                        {activeShipment.type !== 'NTS' && (
                                            <View className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-700/50">
                                                <Pressable
                                                    onPress={() => {
                                                        if (activeShipment.storage) {
                                                            // Remove SIT
                                                            updateShipment(activeShipment.id, { storage: undefined });
                                                        } else {
                                                            // Add SIT with defaults
                                                            updateShipment(activeShipment.id, {
                                                                storage: {
                                                                    facility: 'SIT_DESTINATION',
                                                                    maxDaysSIT: 90,
                                                                    estimatedStartDate: new Date().toISOString().split('T')[0],
                                                                },
                                                            });
                                                        }
                                                    }}
                                                    className="flex-row items-center justify-between"
                                                >
                                                    <View className="flex-row items-center">
                                                        <Warehouse size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                                                        <Text className="ml-2 text-sm font-semibold text-slate-700 dark:text-zinc-200">
                                                            Temporary Storage (SIT)
                                                        </Text>
                                                    </View>
                                                    <View className={`w-11 h-6 rounded-full flex-row items-center px-0.5 ${activeShipment.storage
                                                            ? 'bg-blue-600 dark:bg-blue-700 justify-end'
                                                            : 'bg-slate-300 dark:bg-zinc-700 justify-start'
                                                        }`}>
                                                        <View className="w-5 h-5 rounded-full bg-white shadow" />
                                                    </View>
                                                </Pressable>

                                                {activeShipment.storage && (
                                                    <View className="mt-3 flex-row gap-2">
                                                        {/* SIT Location */}
                                                        <View className="flex-1">
                                                            <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                                                                SIT Location
                                                            </Text>
                                                            <View className="flex-row gap-1.5">
                                                                {(['SIT_ORIGIN', 'SIT_DESTINATION'] as const).map((loc) => {
                                                                    const isActive = activeShipment.storage?.facility === loc;
                                                                    return (
                                                                        <ScalePressable
                                                                            key={loc}
                                                                            onPress={() => updateShipment(activeShipment.id, {
                                                                                storage: { ...activeShipment.storage!, facility: loc },
                                                                            })}
                                                                            className={`flex-1 rounded-lg border px-2 py-2 items-center ${isActive
                                                                                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                                                                                    : 'border-slate-200 dark:border-zinc-700'
                                                                                }`}
                                                                        >
                                                                            <Text className={`text-xs font-semibold ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-zinc-300'
                                                                                }`}>{loc === 'SIT_ORIGIN' ? 'Origin' : 'Destination'}</Text>
                                                                        </ScalePressable>
                                                                    );
                                                                })}
                                                            </View>
                                                        </View>

                                                        {/* Max Days */}
                                                        <View className="w-20">
                                                            <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                                                                Max Days
                                                            </Text>
                                                            <TextInput
                                                                value={`${activeShipment.storage?.maxDaysSIT ?? 90}`}
                                                                onChangeText={(text) => updateShipment(activeShipment.id, {
                                                                    storage: { ...activeShipment.storage!, maxDaysSIT: parseInt(text, 10) || 90 },
                                                                })}
                                                                keyboardType="number-pad"
                                                                maxLength={3}
                                                                className="text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-800/60 rounded-lg px-2.5 py-2 border border-slate-200 dark:border-zinc-700 text-center"
                                                            />
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* ── Section 1: Weight Estimate ─────────── */}
                            <View onLayout={(e) => handleSectionLayout(0, e)} className="mb-6">
                                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">Weight Estimate</Text>

                                {/* Animated Weight Ring */}
                                <View className="rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 px-4 py-5 mb-3">
                                    <HHGWeightRing
                                        estimatedWeight={runningTotal}
                                        maxWeight={maxWeightAllowance}
                                        isDark={isDark}
                                    />

                                    <ScalePressable
                                        onPress={() => setSheetOpen(true)}
                                        className="mt-4 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5 flex-row items-center justify-center"
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
                                        <Text className="text-slate-900 dark:text-white text-sm font-semibold">{(hhg.shipments?.[0]?.type ?? 'GBL') === 'PPM' ? 'PPM (DITY)' : 'GBL (Gov. Shipment)'}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-slate-500 dark:text-zinc-400 text-sm">Est. Excess Cost</Text>
                                        <Text className={`text-sm font-semibold ${hhg.estimatedExcessCost > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                            {hhg.estimatedExcessCost > 0 ? `$${hhg.estimatedExcessCost.toLocaleString()}` : '$0'}
                                        </Text>
                                    </View>

                                    {/* In-App DPS Submission */}
                                    {dpsConfirmation ? (
                                        <View className="mt-2 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3">
                                            <View className="flex-row items-center gap-2">
                                                <CheckCircle size={16} color={isDark ? '#34d399' : '#059669'} />
                                                <Text className="text-emerald-700 dark:text-emerald-300 text-sm font-semibold">Move Scheduled</Text>
                                            </View>
                                            <Text className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">Confirmation: {dpsConfirmation}</Text>
                                        </View>
                                    ) : (
                                        <Pressable
                                            onPress={handleDPSSubmit}
                                            disabled={dpsSubmitting || runningTotal === 0}
                                            className={`mt-2 flex-row items-center justify-center gap-2 rounded-xl px-4 py-3 ${dpsSubmitting || runningTotal === 0
                                                ? 'bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/40'
                                                : 'bg-blue-600 dark:bg-blue-700 active:bg-blue-700 dark:active:bg-blue-800'
                                                }`}
                                        >
                                            {dpsSubmitting ? (
                                                <Loader2 size={16} color={isDark ? '#93c5fd' : '#1d4ed8'} />
                                            ) : (
                                                <Send size={16} color={runningTotal === 0 ? (isDark ? '#64748b' : '#94a3b8') : '#ffffff'} />
                                            )}
                                            <Text className={`text-sm font-semibold ${runningTotal === 0 ? 'text-slate-400 dark:text-zinc-500' : 'text-white'}`}>
                                                {dpsSubmitting ? 'Submitting to DPS...' : 'Submit Move Request'}
                                            </Text>
                                        </Pressable>
                                    )}
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
                                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Weight</Text>
                                    <Text className={`text-sm font-bold ${totalToneClass}`}>
                                        {formatLbs(aggregateWeight)}
                                    </Text>
                                </View>
                                <View className="items-center flex-1">
                                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Shipments</Text>
                                    <Text className="text-sm font-bold text-slate-900 dark:text-white">
                                        {shipments.length}
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

            {/* ── Add Item Sheet Modal (Room-Based Catalogue) ──── */}
            <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
                <View className="flex-1 justify-end bg-black/45">
                    <Pressable className="flex-1" onPress={() => setSheetOpen(false)} />
                    <Animated.View
                        entering={FadeInUp.duration(220)}
                        className="rounded-t-3xl bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-700 px-4 pt-4"
                        style={{ paddingBottom: Math.max(insets.bottom, 16), maxHeight: '80%' }}
                    >
                        <View className="items-center mb-3">
                            <View className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-zinc-700" />
                        </View>

                        {/* Header with Quick Estimate + Custom Entry toggles */}
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-lg font-bold text-slate-900 dark:text-white">Add Items</Text>
                            <View className="flex-row gap-2">
                                <ScalePressable
                                    onPress={() => { setShowQuickEstimate(!showQuickEstimate); setShowCustomEntry(false); }}
                                    className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border ${showQuickEstimate
                                        ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700'
                                        : 'border-slate-200 dark:border-zinc-700'
                                        }`}
                                >
                                    <Zap size={12} color={isDark ? '#fbbf24' : '#d97706'} />
                                    <Text className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Quick</Text>
                                </ScalePressable>
                                <ScalePressable
                                    onPress={() => { setShowCustomEntry(!showCustomEntry); setShowQuickEstimate(false); }}
                                    className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border ${showCustomEntry
                                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                                        : 'border-slate-200 dark:border-zinc-700'
                                        }`}
                                >
                                    <PenLine size={12} color={isDark ? '#93c5fd' : '#1d4ed8'} />
                                    <Text className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">Custom</Text>
                                </ScalePressable>
                            </View>
                        </View>

                        {/* Quick Estimate Panel */}
                        {showQuickEstimate && (
                            <View className="mb-3 gap-2">
                                <Text className="text-xs text-slate-500 dark:text-zinc-400">Estimate by home size:</Text>
                                <View className="flex-row gap-2">
                                    {Object.keys(QUICK_ESTIMATE_PRESETS).map((key) => (
                                        <ScalePressable
                                            key={key}
                                            onPress={() => handleQuickEstimate(key)}
                                            className="flex-1 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 py-3 items-center"
                                        >
                                            <Home size={16} color={isDark ? '#fbbf24' : '#d97706'} />
                                            <Text className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-1">{key}</Text>
                                            <Text className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                                                ~{formatLbs(getQuickEstimateWeight(key))}
                                            </Text>
                                        </ScalePressable>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Custom Item Entry */}
                        {showCustomEntry && (
                            <View className="mb-3 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                                <TextInput
                                    value={customDesc}
                                    onChangeText={setCustomDesc}
                                    placeholder="Item description"
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    className="text-sm text-slate-900 dark:text-white mb-2 border-b border-slate-200 dark:border-zinc-700 pb-2"
                                />
                                <View className="flex-row items-center gap-2">
                                    <TextInput
                                        value={customWeight}
                                        onChangeText={setCustomWeight}
                                        keyboardType="number-pad"
                                        placeholder="Weight (lbs)"
                                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                        className="flex-1 text-sm text-slate-900 dark:text-white"
                                    />
                                    <ScalePressable
                                        onPress={handleAddCustomItem}
                                        className="bg-blue-600 rounded-lg px-4 py-2"
                                    >
                                        <Text className="text-white text-xs font-bold">Add</Text>
                                    </ScalePressable>
                                </View>
                            </View>
                        )}

                        {/* Room Tab Bar */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-3"
                            contentContainerStyle={{ gap: 6 }}
                        >
                            {HHG_ROOMS.map((room) => (
                                <Pressable
                                    key={room}
                                    onPress={() => setSelectedRoom(room)}
                                    className={`px-3 py-1.5 rounded-full border ${selectedRoom === room
                                        ? 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700'
                                        : 'border-slate-200 dark:border-zinc-700'
                                        }`}
                                >
                                    <Text className={`text-xs font-semibold ${selectedRoom === room
                                        ? 'text-white'
                                        : 'text-slate-600 dark:text-zinc-300'
                                        }`}>{room}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        {/* Items for Selected Room */}
                        <View className="flex-1">
                            <FlashList<HHGTemplate>
                                data={HHG_CATALOGUE.filter(t => t.room === selectedRoom)}
                                keyExtractor={(item, index) => `${item.room}-${item.description}-${index}`}
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

            {/* ── Shipment Creation Modal ────────────────────── */}
            <ShipmentCreationModal
                visible={showCreateShipment}
                onClose={() => setShowCreateShipment(false)}
                onCreated={(id) => setActiveShipmentId(id)}
            />
        </View>
    );
}
