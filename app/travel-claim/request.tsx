import { TravelClaimHUD } from '@/components/travel-claim/TravelClaimHUD';
import { TravelStep1TripDetails } from '@/components/travel-claim/steps/TravelStep1TripDetails';
import { TravelStep5Review } from '@/components/travel-claim/steps/TravelStep5Review';
import { SignatureButton } from '@/components/ui/SignatureButton';
import { useHeaderStore } from '@/store/useHeaderStore';
import { usePCSStore } from '@/store/usePCSStore';
import type { PCSSegment, ReceiptCategory } from '@/types/pcs';
import type { Expense, TravelClaim } from '@/types/travelClaim';
import { bridgeReceiptsToExpenses } from '@/utils/receiptBridge';
import { scanReceipt } from '@/utils/receiptOCR';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    Calendar,
    Camera,
    CheckCircle,
    CheckCircle2,
    ChevronLeft,
    Pencil,
    Receipt,
    Trash2
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
    useColorScheme,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Settlement Steps (replaces 5-step wizard) ────────────────────────

const STEPS = [
    { id: 0, icon: Calendar, label: 'Trip' },
    { id: 1, icon: Receipt, label: 'Expenses' },
    { id: 2, icon: CheckCircle2, label: 'Certify' },
];

// ─── Inline Receipt Scanner for Step 2 ────────────────────────────────

function InlineReceiptScanner({ claimId, onExpenseAdded }: {
    claimId: string;
    onExpenseAdded: (expense: Expense) => void;
}) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const [isCapturing, setIsCapturing] = useState(false);
    const addReceipt = usePCSStore((state) => state.addReceipt);

    const handleCapture = useCallback(async () => {
        if (isCapturing) return;
        setIsCapturing(true);

        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Camera Permission', 'Camera access is required to capture receipts.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                quality: 0.8,
                allowsEditing: true,
            });

            if (result.canceled || !result.assets?.[0]) return;

            const asset = result.assets[0];

            // Process OCR
            const ocrResult = await scanReceipt(asset.uri);

            // Add to PCS receipt vault
            const receiptData = {
                imageUri: asset.uri,
                amount: ocrResult.extractedAmount,
                category: (ocrResult.detectedCategory || 'OTHER') as ReceiptCategory,
                note: '',
                ocrConfidence: ocrResult.confidence,
            };
            addReceipt(receiptData);

            // Bridge to expense for the claim
            const bridged = bridgeReceiptsToExpenses(
                [{
                    id: `new-${Date.now()}`,
                    capturedAt: new Date().toISOString(),
                    ...receiptData,
                }],
                claimId,
            );
            if (bridged[0]) onExpenseAdded(bridged[0]);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            console.error('[ReceiptScanner] Error:', e);
            Alert.alert('Error', 'Failed to capture receipt.');
        } finally {
            setIsCapturing(false);
        }
    }, [isCapturing, addReceipt, claimId, onExpenseAdded]);

    return (
        <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            className="flex-row items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-dashed border-amber-400 dark:border-amber-600 rounded-xl py-4 mt-3 active:opacity-70"
        >
            <Camera size={20} color={isDark ? '#fbbf24' : '#d97706'} strokeWidth={2.2} />
            <Text className="font-bold text-amber-700 dark:text-amber-300">
                {isCapturing ? 'Capturing...' : 'Scan Missing Receipt'}
            </Text>
        </Pressable>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN SETTLEMENT SCREEN
// ═════════════════════════════════════════════════════════════════════════

export default function TravelClaimRequestScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Store Hooks — unified PCS store
    const setHeaderVisible = useHeaderStore((state) => state.setVisible);
    const draft = usePCSStore((state) => state.travelClaim.draft);
    const settlementStatus = usePCSStore((state) => state.travelClaim.status);
    const initSettlement = usePCSStore((state) => state.initSettlement);
    const updateSettlement = usePCSStore((state) => state.updateSettlement);
    const submitSettlement = usePCSStore((state) => state.submitSettlement);
    const activeOrder = usePCSStore((state) => state.activeOrder);

    // Local State
    const [activeStep, setActiveStep] = useState(0);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

    const scrollViewRef = useRef<any>(null);
    const sectionCoords = useRef<number[]>([]);

    // Hide Global Header
    useFocusEffect(
        React.useCallback(() => {
            setHeaderVisible(false);
            return () => setHeaderVisible(true);
        }, [setHeaderVisible])
    );

    // Initialize settlement from Phase 2 + Phase 3 data
    React.useEffect(() => {
        if (!draft && settlementStatus === 'idle') {
            initSettlement();
        }
    }, [draft, settlementStatus, initSettlement]);

    // --- Scroll Handling ---
    const handleSectionLayout = (index: number, event: LayoutChangeEvent) => {
        sectionCoords.current[index] = event.nativeEvent.layout.y;
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        const triggerPoint = scrollY + (layoutHeight * 0.3);

        let newActive = 0;
        for (let i = 0; i < STEPS.length; i++) {
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

    // --- Segment Override Handler ---
    const handleSegmentOverride = useCallback((segmentId: string, overrides: Partial<PCSSegment>) => {
        if (!draft) return;

        // Translate segment overrides into TravelClaim patch
        const patch: Partial<TravelClaim> = {};
        if (overrides.dates) {
            if (overrides.dates.projectedDeparture) patch.departureDate = overrides.dates.projectedDeparture;
            if (overrides.dates.projectedArrival) patch.returnDate = overrides.dates.projectedArrival;
        }
        if (overrides.userPlan?.mode) {
            patch.travelMode = overrides.userPlan.mode.toLowerCase() as any;
        }
        if (Object.keys(patch).length > 0) {
            updateSettlement(patch);
        }
    }, [draft, updateSettlement]);

    // --- Mileage Update Handler ---
    const handleMileageUpdate = useCallback((mileage: number) => {
        if (!draft) return;
        updateSettlement({ maltMiles: mileage });
    }, [draft, updateSettlement]);

    // --- Expense Handlers ---
    const handleAddExpense = useCallback((expense: Expense) => {
        if (!draft) return;
        updateSettlement({ expenses: [...draft.expenses, expense] });
    }, [draft, updateSettlement]);

    const handleRemoveExpense = useCallback((expenseId: string) => {
        if (!draft) return;
        updateSettlement({ expenses: draft.expenses.filter(e => e.id !== expenseId) });
    }, [draft, updateSettlement]);

    const handleUpdateExpenseAmount = useCallback((expenseId: string, amount: number) => {
        if (!draft) return;
        updateSettlement({
            expenses: draft.expenses.map(e =>
                e.id === expenseId ? { ...e, amount } : e
            ),
        });
    }, [draft, updateSettlement]);

    // --- Submit ---
    const handleSubmit = useCallback(async () => {
        if (!draft) return;

        if (!draft.memberCertification) {
            Alert.alert('Certification Required', 'You must certify the claim is accurate.');
            scrollToSection(2);
            return;
        }

        try {
            submitSettlement();
            setShowSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => router.back(), 2500);
        } catch (error) {
            Alert.alert('Error', 'Failed to submit claim.');
        }
    }, [draft, submitSettlement, router]);

    // Computed display values — must be above early return to satisfy Rules of Hooks
    const receiptCount = useMemo(() => {
        if (!draft) return 0;
        return draft.expenses.reduce((acc: number, e) => acc + (e.receipts?.length || 0), 0);
    }, [draft]);

    const hasWarnings = useMemo(() => {
        if (!draft) return false;
        return (draft.totalExpenses || 0) > 5000;
    }, [draft]);

    // Group expenses by type for Step 2
    const expensesByType = useMemo(() => {
        if (!draft) return {} as Record<string, Expense[]>;
        const groups: Record<string, Expense[]> = {};
        for (const exp of draft.expenses) {
            const key = exp.expenseType;
            if (!groups[key]) groups[key] = [];
            groups[key].push(exp);
        }
        return groups;
    }, [draft]);

    // Loading state
    if (!draft) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Text className="text-slate-500 font-medium">Preparing settlement...</Text>
            </View>
        );
    }

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
                    {/* Header */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        className="bg-white/95 dark:bg-slate-900/95 sticky top-0 z-10 px-4 py-2"
                    >
                        <View className="flex-row justify-between items-start mb-1 pr-2">
                            <View className="pl-8">
                                <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }} className="text-slate-400 dark:text-gray-500">
                                    PHASE 4 • SETTLEMENT
                                </Text>
                                <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }} className="text-slate-900 dark:text-white">
                                    Settle Travel Claim
                                </Text>
                            </View>
                            <Pressable onPress={() => setShowExitModal(true)} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
                                <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
                            </Pressable>
                        </View>

                        {/* 3-Step Stepper */}
                        <View className="flex-row items-center justify-between px-8 pt-4 pb-2">
                            {STEPS.map((step, index) => {
                                const isLast = index === STEPS.length - 1;
                                const Icon = step.icon;
                                const isActive = index === activeStep;
                                const isCompleted = index < activeStep;

                                return (
                                    <React.Fragment key={step.id}>
                                        <Pressable
                                            hitSlop={10}
                                            onPress={() => scrollToSection(index)}
                                            className="items-center justify-center z-10"
                                        >
                                            <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${isActive && isLast
                                                ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : isActive
                                                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : isCompleted
                                                        ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950'
                                                }`}>
                                                <Icon
                                                    size={18}
                                                    color={
                                                        isCompleted || (isActive && isLast)
                                                            ? (isDark ? '#22c55e' : '#16a34a')
                                                            : isActive
                                                                ? (isDark ? '#3b82f6' : '#2563eb')
                                                                : (isDark ? '#6b7280' : '#9ca3af')
                                                    }
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                />
                                            </View>
                                            <Text
                                                className={`text-[10px] font-bold mt-1 ${isCompleted || (isActive && isLast) ? 'text-green-600 dark:text-green-500' :
                                                    isActive ? 'text-blue-600 dark:text-blue-400' :
                                                        'text-slate-400 dark:text-gray-500'
                                                    }`}
                                            >{step.label}</Text>
                                        </Pressable>

                                        {!isLast && (
                                            <View
                                                className={`flex-1 h-[2px] mx-2 ${index < activeStep ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-200 dark:bg-gray-800'
                                                    }`}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    </Animated.View>

                    {/* Content */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
                    >
                        <Animated.ScrollView
                            entering={FadeInDown.delay(200).springify()}
                            ref={scrollViewRef}
                            className="flex-1"
                            contentContainerClassName="px-4 pt-4 pb-64"
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* ── Step 1: Verify Trip (pre-filled from orders) ── */}
                            <View onLayout={(e) => handleSectionLayout(0, e)} className="mb-6">
                                <View className="flex-row items-center mb-3">
                                    <View className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-2">
                                        <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">1</Text>
                                    </View>
                                    <Text className="text-base font-bold text-slate-900 dark:text-white">Verify Trip Details</Text>
                                </View>
                                <TravelStep1TripDetails
                                    segments={activeOrder?.segments ?? []}
                                    actualMileage={draft.maltMiles}
                                    onSegmentOverride={handleSegmentOverride}
                                    onMileageUpdate={handleMileageUpdate}
                                    embedded
                                />
                            </View>

                            {/* ── Step 2: Review Expenses (receipts auto-attached + scanner) ── */}
                            <View onLayout={(e) => handleSectionLayout(1, e)} className="mb-6">
                                <View className="flex-row items-center mb-3">
                                    <View className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-2">
                                        <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">2</Text>
                                    </View>
                                    <Text className="text-base font-bold text-slate-900 dark:text-white">Review Expenses</Text>
                                    <View className="ml-2 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
                                        <Text className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                            {draft.expenses.length} items
                                        </Text>
                                    </View>
                                </View>

                                {/* Expense Breakdown by Category */}
                                {Object.entries(expensesByType).map(([type, expenses]) => {
                                    const categoryTotal = expenses.reduce((s, e) => s + e.amount, 0);
                                    const categoryLabel = {
                                        fuel: '⛽ Fuel',
                                        lodging: '🏨 Lodging',
                                        toll: '🛣️ Tolls',
                                        parking: '🅿️ Parking',
                                        misc: '📋 Other',
                                        rental_car: '🚗 Rental',
                                        airfare: '✈️ Airfare',
                                    }[type] || type;

                                    return (
                                        <View key={type} className="mb-4">
                                            <View className="flex-row items-center justify-between mb-2">
                                                <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    {categoryLabel}
                                                </Text>
                                                <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                                    ${categoryTotal.toFixed(2)}
                                                </Text>
                                            </View>
                                            {expenses.map((expense) => (
                                                <View
                                                    key={expense.id}
                                                    className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/50 mb-2 p-3"
                                                >
                                                    <View className="flex-row items-center justify-between">
                                                        <View className="flex-1 mr-2">
                                                            <Text className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                                {expense.description || expense.expenseType}
                                                            </Text>
                                                            {expense.receipts.length > 0 && (
                                                                <View className="flex-row items-center mt-1">
                                                                    <Camera size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                                                                    <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                                                                        {expense.receipts.length} receipt{expense.receipts.length !== 1 ? 's' : ''} attached
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        <View className="flex-row items-center gap-2">
                                                            {/* Inline Amount Edit */}
                                                            {editingExpenseId === expense.id ? (
                                                                <TextInput
                                                                    autoFocus
                                                                    keyboardType="decimal-pad"
                                                                    defaultValue={expense.amount.toFixed(2)}
                                                                    onBlur={() => setEditingExpenseId(null)}
                                                                    onSubmitEditing={(e: NativeSyntheticEvent<{ text: string }>) => {
                                                                        const val = parseFloat(e.nativeEvent.text);
                                                                        if (!isNaN(val) && val >= 0) {
                                                                            handleUpdateExpenseAmount(expense.id, val);
                                                                        }
                                                                        setEditingExpenseId(null);
                                                                    }}
                                                                    className="text-base font-bold text-slate-900 dark:text-white min-w-[80px] text-right border-b-2 border-blue-500 py-0.5"
                                                                    returnKeyType="done"
                                                                />
                                                            ) : (
                                                                <Pressable
                                                                    onPress={() => setEditingExpenseId(expense.id)}
                                                                    hitSlop={8}
                                                                    className="flex-row items-center gap-1 active:opacity-60"
                                                                >
                                                                    <Text className="text-base font-bold text-slate-900 dark:text-white">
                                                                        ${expense.amount.toFixed(2)}
                                                                    </Text>
                                                                    <Pencil size={12} color={isDark ? '#64748b' : '#94a3b8'} />
                                                                </Pressable>
                                                            )}

                                                            {/* Delete */}
                                                            <Pressable
                                                                hitSlop={8}
                                                                onPress={() => {
                                                                    Alert.alert(
                                                                        'Remove Expense',
                                                                        `Delete "${expense.description || expense.expenseType}"?`,
                                                                        [
                                                                            { text: 'Cancel', style: 'cancel' },
                                                                            { text: 'Delete', style: 'destructive', onPress: () => handleRemoveExpense(expense.id) },
                                                                        ]
                                                                    );
                                                                }}
                                                                className="p-1.5 rounded-full active:bg-red-100 dark:active:bg-red-900/20"
                                                            >
                                                                <Trash2 size={14} color={isDark ? '#ef4444' : '#dc2626'} />
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    );
                                })}

                                {draft.expenses.length === 0 && (
                                    <View className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 items-center border border-dashed border-slate-300 dark:border-slate-600">
                                        <Receipt size={28} color={isDark ? '#64748b' : '#94a3b8'} />
                                        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 text-center">
                                            No receipts captured during transit.{'\n'}Use the scanner below to add expenses.
                                        </Text>
                                    </View>
                                )}

                                {/* Entitlements Summary */}
                                <View className="bg-blue-50 dark:bg-blue-900/15 rounded-xl border border-blue-200 dark:border-blue-800/30 p-3 mt-3">
                                    <Text className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-2">
                                        ENTITLEMENTS (FROM FINANCIAL REVIEW)
                                    </Text>
                                    {draft.maltAmount > 0 && (
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-sm text-slate-600 dark:text-slate-300">MALT</Text>
                                            <Text className="text-sm font-semibold text-slate-800 dark:text-white">${draft.maltAmount.toFixed(2)}</Text>
                                        </View>
                                    )}
                                    {draft.dlaAmount > 0 && (
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-sm text-slate-600 dark:text-slate-300">DLA</Text>
                                            <Text className="text-sm font-semibold text-slate-800 dark:text-white">${draft.dlaAmount.toFixed(2)}</Text>
                                        </View>
                                    )}
                                    <View className="flex-row justify-between border-t border-blue-200 dark:border-blue-800/30 pt-1 mt-1">
                                        <Text className="text-sm font-bold text-slate-800 dark:text-white">Total Entitlements</Text>
                                        <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">${draft.totalEntitlements.toFixed(2)}</Text>
                                    </View>
                                </View>

                                {/* Inline Receipt Scanner */}
                                <InlineReceiptScanner
                                    claimId={draft.id}
                                    onExpenseAdded={handleAddExpense}
                                />
                            </View>

                            {/* ── Step 3: Certify & Submit ── */}
                            <View onLayout={(e) => handleSectionLayout(2, e)} className="mb-6">
                                <View className="flex-row items-center mb-3">
                                    <View className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-2">
                                        <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">3</Text>
                                    </View>
                                    <Text className="text-base font-bold text-slate-900 dark:text-white">Certify & Submit</Text>
                                </View>
                                <TravelStep5Review
                                    claim={draft}
                                    embedded
                                    onToggleCertification={(cert) => updateSettlement({ memberCertification: cert })}
                                />
                            </View>

                        </Animated.ScrollView>
                    </KeyboardAvoidingView>

                    {/* Footer */}
                    <View
                        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl"
                        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    >
                        <View className="pt-4 px-4">
                            <TravelClaimHUD
                                totalClaim={draft.totalClaimAmount}
                                receiptCount={receiptCount}
                                hasWarnings={hasWarnings}
                                isValid={true}
                            />

                            <View className="mt-2">
                                <SignatureButton
                                    onSign={handleSubmit}
                                    isSubmitting={settlementStatus === 'submitted'}
                                    disabled={!draft.memberCertification}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            {/* Exit Modal */}
            {showExitModal && (
                <View className="absolute inset-0 z-50 items-center justify-center p-4">
                    <Animated.View entering={FadeIn} className="absolute inset-0 bg-black/60">
                        <Pressable className="flex-1" onPress={() => setShowExitModal(false)} />
                    </Animated.View>
                    <Animated.View entering={ZoomIn.duration(200)} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden p-6">
                        <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Save Draft?</Text>
                        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
                            Your settlement progress is auto-saved.
                        </Text>
                        <View className="gap-3">
                            <Pressable onPress={() => { setShowExitModal(false); router.back(); }} className="bg-blue-600 p-3 rounded-xl items-center">
                                <Text className="text-white font-bold">Save & Exit</Text>
                            </Pressable>
                            <Pressable onPress={() => { setShowExitModal(false); router.back(); }} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl items-center">
                                <Text className="text-red-600 dark:text-red-400 font-bold">Discard</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </View>
            )}

            {/* Success Overlay */}
            {showSuccess && (
                <Animated.View entering={FadeIn} className="absolute inset-0 z-50 items-center justify-center">
                    <BlurView intensity={40} tint="dark" className="absolute inset-0 bg-black/40 items-center justify-center">
                        <Animated.View entering={ZoomIn.delay(200).springify()}>
                            <CheckCircle size={100} color="white" strokeWidth={2.5} />
                        </Animated.View>
                        <Animated.Text entering={FadeInUp.delay(500)} className="text-white text-3xl font-bold mt-8">Claim Submitted!</Animated.Text>
                        <Animated.Text entering={FadeInUp.delay(700)} className="text-white/70 text-base mt-2">Liquidation tracking activated</Animated.Text>
                    </BlurView>
                </Animated.View>
            )}
        </View>
    );
}
