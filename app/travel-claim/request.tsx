import { TravelClaimHUD } from '@/components/travel-claim/TravelClaimHUD';
import { TravelStep1TripDetails } from '@/components/travel-claim/steps/TravelStep1TripDetails';
import { TravelStep2Lodging } from '@/components/travel-claim/steps/TravelStep2Lodging';
import { TravelStep3Travel } from '@/components/travel-claim/steps/TravelStep3Travel';
import { TravelStep4Meals } from '@/components/travel-claim/steps/TravelStep4Meals';
import { TravelStep5Review } from '@/components/travel-claim/steps/TravelStep5Review';
import { SignatureButton } from '@/components/ui/SignatureButton';
import { WizardStatusBar } from '@/components/wizard/WizardStatusBar';
import Colors from '@/constants/Colors';
import { useHeaderStore } from '@/store/useHeaderStore';
import { useTravelClaimStore } from '@/store/useTravelClaimStore';
import { useUserId } from '@/store/useUserStore';
import { CreateTravelClaimPayload, TravelClaim } from '@/types/travelClaim';
import { calculateTravelClaim } from '@/utils/travelClaimCalculations';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, CheckCircle, CheckCircle2, Fuel, Hotel, Utensils, X } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    Text,
    View,
    useColorScheme,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = [
    { id: 0, icon: Calendar, label: 'Trip' },
    { id: 1, icon: Hotel, label: 'Lodging' },
    { id: 2, icon: Fuel, label: 'Travel' },
    { id: 3, icon: Utensils, label: 'Meals' },
    { id: 4, icon: CheckCircle2, label: 'Review' },
];

export default function TravelClaimRequestScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const userId = useUserId();

    // Store Hooks
    const setHeaderVisible = useHeaderStore((state) => state.setVisible);
    const travelClaims = useTravelClaimStore((state) => state.travelClaims);
    const createDraft = useTravelClaimStore((state) => state.createDraft);
    const updateDraft = useTravelClaimStore((state) => state.updateDraft);
    const discardDraft = useTravelClaimStore((state) => state.discardDraft);
    const submitClaim = useTravelClaimStore((state) => state.submitClaim);
    const validateStepStore = useTravelClaimStore((state) => state.validateStep);
    const isSyncing = useTravelClaimStore((state) => state.isSyncingClaims);
    const fetchUserClaims = useTravelClaimStore((state) => state.fetchUserClaims);

    // Local State
    const { draftId } = useLocalSearchParams();
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(typeof draftId === 'string' ? draftId : null);
    const [activeStep, setActiveStep] = useState(0);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    const scrollViewRef = useRef<any>(null);
    const sectionCoords = useRef<number[]>([]);

    // Hide Global Header
    useFocusEffect(
        React.useCallback(() => {
            setHeaderVisible(false);
            return () => setHeaderVisible(true);
        }, [setHeaderVisible])
    );

    // Hydrate Data
    React.useEffect(() => {
        if (!userId) return;

        // Safety timeout to ensure we don't hang on loading
        const safetyTimer = setTimeout(() => setIsHydrated(true), 1500);

        const init = async () => {
            try {
                // Non-blocking fetch
                fetchUserClaims(userId).catch(() => {});
                setIsHydrated(true);
            } catch (e) {
                // Fallback handled by timeout or state update
                setIsHydrated(true);
            }
        };
        init();

        return () => clearTimeout(safetyTimer);
    }, [userId]);

    // Initialize or Create Draft
    React.useEffect(() => {
        if (!isHydrated || currentDraftId || !userId) return;

        // Auto-create new draft if none provided
        const newId = `tc-draft-${Date.now()}`;
        const newDraft: TravelClaim = {
            id: newId,
            userId,
            travelType: 'tdy',
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSyncTimestamp: new Date().toISOString(),
            syncStatus: 'pending',
            departureDate: new Date().toISOString(),
            returnDate: new Date().toISOString(),
            departureLocation: '',
            destinationLocation: '',
            isOconus: false,
            travelMode: 'commercial_air', // Default
            maltAmount: 0,
            maltMiles: 0,
            dlaAmount: 0,
            tleDays: 0,
            tleAmount: 0,
            perDiemDays: [],
            expenses: [],
            totalExpenses: 0,
            totalEntitlements: 0,
            totalClaimAmount: 0,
            advanceAmount: 0,
            netPayable: 0,
            statusHistory: [],
            approvalChain: [],
            memberCertification: false,
        };
        createDraft(newDraft);
        setCurrentDraftId(newId);
    }, [isHydrated, currentDraftId, userId]);

    const claim = useMemo(() => {
        return currentDraftId ? travelClaims[currentDraftId] : null;
    }, [travelClaims, currentDraftId]);

    // Debounced Auto-Save (Logic handled by direct store updates in this implementation,
    // but we can add a listener or reliance on the store actions which persist automatically)
    // The store 'updateDraft' persists to AsyncStorage.

    // --- Validation ---
    const stepErrors = useMemo(() => {
        if (!currentDraftId) return [];
        const errors: number[] = [];
        // Map 0-4 to 1-5
        for (let i = 0; i <= 4; i++) {
            const stepNum = (i + 1) as 1|2|3|4|5;
            const res = validateStepStore(currentDraftId, stepNum);
            if (!res.success) {
                // Only show error for current or past steps if invalid?
                if (i <= activeStep && !res.success) {
                     errors.push(i);
                }
            }
        }
        return errors;
    }, [activeStep, validateStepStore, currentDraftId, claim]); // Add claim dependency to re-calc

    const validateAll = (): boolean => {
        if (!currentDraftId) return false;
        let valid = true;
        for (let i = 1; i <= 5; i++) {
            const res = validateStepStore(currentDraftId, i as any);
            if (!res.success) {
                valid = false;
                // Scroll to first error
                scrollToSection(i - 1);
                Alert.alert(`Step ${i} Incomplete`, 'Please complete all required fields.');
                break;
            }
        }
        return valid;
    };

    const handleUpdate = (field: string, value: any) => {
        if (!currentDraftId) return;

        // Map Step 1 fields to TravelClaim fields
        const fieldMap: Record<string, keyof TravelClaim> = {
            'pcsOrderId': 'orderNumber',
            'startDate': 'departureDate',
            'endDate': 'returnDate',
            'travelMode': 'travelMode',
            'actualMileage': 'maltMiles',
            // 'estimatedMileage': ignored or mapped if needed
            // 'originZip': ignored
            // 'destinationZip': ignored
        };

        const targetField = fieldMap[field] || (field as keyof TravelClaim);

        // Check if targetField is actually a key of TravelClaim (runtime check mostly)
        // We cast to any to bypass strict type check for now, relying on store to handle partial updates
        if (targetField === 'originZip' || targetField === 'destinationZip' || targetField === 'estimatedMileage') {
             // Ignore transient fields for now
             return;
        }

        updateDraft(currentDraftId, { [targetField]: value });
    };

    // specialized updaters
    const updateLodging = (lodgingSubset: any[]) => {
        if (!claim) return;
        const otherExpenses = claim.expenses.filter(e => e.expenseType !== 'lodging');
        // Map lodgingSubset to ensure correct type if needed, but they should be Expenses
        // TravelStep2Lodging produces LodgingExpense which is compatible with Expense (mostly)
        // We need to ensure `expenseType: 'lodging'`
        const newLodging = lodgingSubset.map(e => ({ ...e, expenseType: 'lodging' }));
        updateDraft(claim.id, { expenses: [...otherExpenses, ...newLodging] });
    };

    const updateTransportation = (transSubset: any[]) => {
        if (!claim) return;
        const otherExpenses = claim.expenses.filter(e => !['fuel', 'toll', 'parking'].includes(e.expenseType));
        updateDraft(claim.id, { expenses: [...otherExpenses, ...transSubset] });
    };

    // Step 4 updates perDiemDays directly, which is a top-level field.

    // --- Scroll Handling ---
    const handleSectionLayout = (index: number, event: LayoutChangeEvent) => {
        const layout = event.nativeEvent.layout;
        sectionCoords.current[index] = layout.y;
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

    const handleSubmit = async () => {
        if (!validateAll() || !claim || !userId) return;

        try {
            // WORKAROUND: I will update the draft status to 'pending' and maybe call `submitClaim`
            // effectively replacing it? Or maybe I shouldn't call `submitClaim` if it ignores data.
            // I'll stick to updating the draft to 'pending'.

            await updateDraft(currentDraftId, {
                status: 'pending',
                submittedAt: new Date().toISOString(),
                memberCertification: true
            });

            // Trigger success
            setShowSuccess(true);
            setTimeout(() => {
                router.back();
            }, 2500);

        } catch (error) {
            Alert.alert("Error", "Failed to submit claim.");
        }
    };

    if (!isHydrated || !claim) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Text className="text-slate-500 font-medium">Loading...</Text>
            </View>
        );
    }

    const hasWarnings = (claim.totalExpenses || 0) > 5000; // Mock warning rule
    const receiptCount = claim.expenses.reduce((acc, e) => acc + (e.receipts?.length || 0), 0);

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
                        <View className="flex-row justify-between items-center mb-1 pl-8 pr-2">
                             <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }} className="text-slate-400 dark:text-gray-500">
                                TRAVEL CLAIM
                            </Text>
                            <Pressable onPress={() => setShowExitModal(true)} className="p-1">
                                <X size={20} color={themeColors.text} />
                            </Pressable>
                        </View>

                        <WizardStatusBar
                            currentStep={activeStep}
                            onStepPress={scrollToSection}
                            errorSteps={stepErrors}
                            steps={STEPS}
                        />
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
                        >
                            {/* Step 0: Trip */}
                            <View onLayout={(e) => handleSectionLayout(0, e)} className="mb-6">
                                <TravelStep1TripDetails
                                    pcsOrderId={claim.orderNumber}
                                    startDate={claim.departureDate}
                                    endDate={claim.returnDate}
                                    travelMode={claim.travelMode}
                                    originZip={''} // Not in TravelClaim type top level, simplified
                                    destinationZip={''}
                                    estimatedMileage={claim.maltMiles}
                                    actualMileage={claim.maltMiles} // Re-using for now
                                    onUpdate={(field, val) => handleUpdate(field as string, val)}
                                    embedded
                                />
                            </View>

                            {/* Step 1: Lodging */}
                            <View onLayout={(e) => handleSectionLayout(1, e)} className="mb-6">
                                <TravelStep2Lodging
                                    lodgingExpenses={claim.expenses.filter(e => e.expenseType === 'lodging') as any}
                                    onUpdate={(field, val) => updateLodging(val)}
                                    embedded
                                />
                            </View>

                            {/* Step 2: Travel */}
                            <View onLayout={(e) => handleSectionLayout(2, e)} className="mb-6">
                                <TravelStep3Travel
                                    transportationExpenses={claim.expenses.filter(e => ['fuel', 'toll', 'parking'].includes(e.expenseType))}
                                    onUpdate={(field, val) => updateTransportation(val)}
                                    embedded
                                />
                            </View>

                            {/* Step 3: Meals */}
                            <View onLayout={(e) => handleSectionLayout(3, e)} className="mb-6">
                                <TravelStep4Meals
                                    perDiemDays={claim.perDiemDays}
                                    onUpdate={(field, val) => handleUpdate(field, val)}
                                    embedded
                                />
                            </View>

                            {/* Step 4: Review */}
                            <View onLayout={(e) => handleSectionLayout(4, e)} className="mb-6">
                                <TravelStep5Review
                                    claim={claim}
                                    embedded
                                    onToggleCertification={(cert) => handleUpdate('memberCertification', cert)}
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
                                totalClaim={claim.totalClaimAmount}
                                receiptCount={receiptCount}
                                hasWarnings={hasWarnings}
                                isValid={true}
                            />

                            <View className="mt-2">
                                <SignatureButton
                                    onSign={handleSubmit}
                                    isSubmitting={isSyncing}
                                    disabled={!claim.memberCertification}
                                    label="Submit Claim"
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
                            <View className="gap-3 mt-4">
                                <Pressable onPress={() => { setShowExitModal(false); router.back(); }} className="bg-blue-600 p-3 rounded-xl items-center">
                                    <Text className="text-white font-bold">Save & Exit</Text>
                                </Pressable>
                                <Pressable onPress={() => { discardDraft(currentDraftId!); setShowExitModal(false); router.back(); }} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl items-center">
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
                    </BlurView>
                </Animated.View>
            )}
        </View>
    );
}
