import { SignatureButton } from '@/components/ui/SignatureButton';
import { LeaveImpactHUD } from '@/components/wizard/LeaveImpactHUD';
import { WizardStatusBar } from '@/components/wizard/WizardStatusBar';
import { ReviewSign } from '@/components/wizard/steps/ReviewSign';
import { Step1Intent } from '@/components/wizard/steps/Step1Intent';
import { Step2Contact } from '@/components/wizard/steps/Step2Contact';
import { Step3Routing } from '@/components/wizard/steps/Step3Routing';
import { Step4Safety } from '@/components/wizard/steps/Step4Safety';
import Colors from '@/constants/Colors';
import { useHeaderStore } from '@/store/useHeaderStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { calculateLeave } from '@/utils/leaveLogic';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, X } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Types & Constants ---

const TOTAL_STEPS = 5;

export default function LeaveRequestScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const submitRequest = useLeaveStore((state) => state.submitRequest);
    const discardDraft = useLeaveStore((state) => state.discardDraft);
    const leaveRequests = useLeaveStore((state) => state.leaveRequests);
    const isSyncing = useLeaveStore((state) => state.isSyncingRequests);
    const setHeaderVisible = useHeaderStore((state) => state.setVisible);

    // Hide Global Header
    useFocusEffect(
        React.useCallback(() => {
            setHeaderVisible(false);
            return () => setHeaderVisible(true);
        }, [setHeaderVisible])
    );

    // Resume/Draft tracking
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleExit = () => {
        setShowExitModal(true);
    };

    const confirmExit = async (action: 'discard' | 'save') => {
        setShowExitModal(false);
        if (action === 'discard') {
            if (currentDraftId) {
                await discardDraft(currentDraftId);
            }
            router.back();
        } else {
            // Save & Exit (default behavior: back out, store persists state)
            router.back();
        }
    };

    // Check for draft on mount
    const { draftId } = useLocalSearchParams();
    const fetchUserRequests = useLeaveStore((state) => state.fetchUserRequests);
    const fetchLeaveData = useLeaveStore((state) => state.fetchLeaveData);
    const userId = "USER_0001"; // TODO: Auth
    const [isHydrated, setIsHydrated] = useState(false);

    React.useEffect(() => {
        // Hydrate and then set ready
        const init = async () => {
            // Always fetch latest data to ensure balance is accurate
            await Promise.all([
                fetchUserRequests(userId),
                fetchLeaveData(userId)
            ]);
            setIsHydrated(true);
        };
        init();
    }, []);

    React.useEffect(() => {
        if (!isHydrated) return; // Wait for hydration

        // 1. Direct Draft Link (from Hub Card)
        if (draftId && typeof draftId === 'string') {
            const draft = leaveRequests[draftId];
            if (draft) {
                setCurrentDraftId(draft.id);
                setFormData({
                    leaveType: draft.leaveType,
                    startDate: draft.startDate,
                    endDate: draft.endDate,
                    leaveAddress: draft.leaveAddress,
                    leavePhoneNumber: draft.leavePhoneNumber,
                    emergencyContact: draft.emergencyContact,
                    memberRemarks: draft.memberRemarks,
                    modeOfTravel: draft.modeOfTravel,
                    dutySection: draft.dutySection,
                    deptDiv: draft.deptDiv,
                    dutyPhone: draft.dutyPhone,
                    rationStatus: draft.rationStatus as any,
                });
                return;
            }
        }

        // 2. Auto-discovery (Fallback)
        // Simple logic: grab the first 'draft' status request found for this user
        const drafts = Object.values(leaveRequests).filter(r => r.status === 'draft');

        if (drafts.length > 0 && !currentDraftId) {
            const draft = drafts[0];
            console.log("Auto-Resuming Draft:", draft.id);
            setCurrentDraftId(draft.id);
            setFormData({
                leaveType: draft.leaveType,
                startDate: draft.startDate,
                endDate: draft.endDate,
                leaveAddress: draft.leaveAddress,
                leavePhoneNumber: draft.leavePhoneNumber,
                emergencyContact: draft.emergencyContact,
                memberRemarks: draft.memberRemarks,
                modeOfTravel: draft.modeOfTravel,
                dutySection: draft.dutySection,
                deptDiv: draft.deptDiv,
                dutyPhone: draft.dutyPhone,
                rationStatus: draft.rationStatus as any,
            });
        }
    }, [leaveRequests, draftId, isHydrated]);

    // --- State ---
    const [activeStep, setActiveStep] = useState(0);
    const scrollViewRef = useRef<any>(null);
    const sectionCoords = useRef<number[]>([]);



    const [formData, setFormData] = useState<Partial<CreateLeaveRequestPayload>>({
        leaveType: 'annual',
        leaveInConus: true,
        destinationCountry: 'USA',
        startTime: '16:00',
        endTime: '07:30',
        departureWorkingHours: '0730-1600',
        returnWorkingHours: '0730-1600',
        emergencyContact: {
            name: '',
            relationship: '',
            phoneNumber: '',
        },
        rationStatus: 'not_applicable', // Default to avoid validation lock
    });

    const createDraft = useLeaveStore((state) => state.createDraft);
    const updateDraft = useLeaveStore((state) => state.updateDraft);
    const generateQuickDraft = useLeaveStore((state) => state.generateQuickDraft);
    const userDefaults = useLeaveStore((state) => state.userDefaults);

    // Smart Defaults: Pre-fill on Mount if New Request
    React.useEffect(() => {
        if (!draftId && !currentDraftId && userDefaults) {
            console.log('Applying Smart Defaults from History');
            setFormData(prev => ({
                ...prev,
                leaveAddress: userDefaults.leaveAddress,
                leavePhoneNumber: userDefaults.leavePhoneNumber,
                emergencyContact: userDefaults.emergencyContact || prev.emergencyContact,
                dutySection: userDefaults.dutySection,
                deptDiv: userDefaults.deptDiv,
                dutyPhone: userDefaults.dutyPhone,
                rationStatus: userDefaults.rationStatus as any,
            }));
        }
    }, [draftId, currentDraftId, userDefaults]);

    // Auto-Save / Draft Creation
    React.useEffect(() => {
        // Skip initial mount or empty state
        if (!formData.startDate && !formData.leaveType) return;

        const timer = setTimeout(async () => {
            if (currentDraftId) {
                // Update Existing
                console.log('Auto-Saving Draft:', currentDraftId);
                // We need to match the LeaveRequest shape somewhat or just patch known fields
                // The store updateDraft takes Partial<LeaveRequest>.
                // Mapping formData (CreatePayload) to LeaveRequest partial:
                const patch: any = { ...formData };
                await updateDraft(currentDraftId, patch);
            } else {
                // Create New Draft if we have minimal viable data
                // Only create if user has actually interacted (e.g. selected a date)
                if (formData.startDate) {
                    console.log('Creating New Auto-Draft');
                    const userId = "user-123"; // TODO: Get from Auth
                    const newDraft = generateQuickDraft('standard', userId);
                    // Override defaults with current form data
                    Object.assign(newDraft, formData);
                    await createDraft(newDraft);
                    setCurrentDraftId(newDraft.id);
                }
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [formData, currentDraftId, createDraft, updateDraft, generateQuickDraft]);

    // Enforce Time Rules: Departure = End of Day, Return = Start of Day
    React.useEffect(() => {
        const getShiftTimes = (shiftCode: string = '0730-1600') => {
            if (shiftCode === 'NONE') return { start: '00:00', end: '00:00' };
            // Format: HHMM-HHMM
            const startStr = shiftCode.split('-')[0];
            const endStr = shiftCode.split('-')[1];
            const formatTime = (t: string) => `${t.substring(0, 2)}:${t.substring(2)}`;
            return { start: formatTime(startStr), end: formatTime(endStr) };
        };

        const dep = getShiftTimes(formData.departureWorkingHours);
        const ret = getShiftTimes(formData.returnWorkingHours);

        // Only update if different
        if (formData.startTime !== dep.end || formData.endTime !== ret.start) {
            console.log('Enforcing Leave Times:', dep.end, ret.start);
            setFormData(prev => ({
                ...prev,
                startTime: dep.end, // Departure at End of Shift
                endTime: ret.start  // Return at Start of Shift
            }));
        }
    }, [formData.departureWorkingHours, formData.returnWorkingHours]);

    // --- Hoisted Logic (Leave Calculation) ---
    const leaveBalance = useLeaveStore((state) => state.leaveBalance);
    const availableDays = leaveBalance?.currentBalance ?? 0;

    const calculation = useMemo(() => {
        return calculateLeave({
            startDate: formData.startDate || '',
            endDate: formData.endDate || '',
            startTime: formData.startTime || '00:00',
            endTime: formData.endTime || '00:00',
            departureWorkingHours: formData.departureWorkingHours || 'NONE',
            returnWorkingHours: formData.returnWorkingHours || 'NONE'
        }, availableDays);
    }, [formData.startDate, formData.endDate, formData.startTime, formData.endTime, formData.departureWorkingHours, formData.returnWorkingHours, availableDays]);

    const { chargeableDays, projectedBalance, isOverdraft } = calculation;

    console.log('[LeaveRequest] Render Balance:', leaveBalance);
    console.log('[LeaveRequest] Available Days:', availableDays);
    console.log('[LeaveRequest] Is Hydrated:', isHydrated);

    // --- Helpers ---

    const updateField = (field: keyof CreateLeaveRequestPayload, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };



    // --- Validation Logic ---
    const validateStep = (stepIndex: number): boolean => {
        switch (stepIndex) {
            case 0: // Intent
                return !!(formData.startDate && formData.endDate && formData.leaveType);
            case 1: // Location
                const isLocationValid = !!(formData.leaveAddress && formData.leavePhoneNumber && formData.modeOfTravel);
                if (formData.leaveInConus) {
                    return isLocationValid;
                }
                return isLocationValid && !!formData.destinationCountry;
            case 2: // Command
                return !!(formData.dutySection && formData.deptDiv && formData.dutyPhone && formData.rationStatus);
            case 3: // Safety
                return !!(formData.emergencyContact?.name && formData.emergencyContact?.phoneNumber && formData.memberRemarks);
            default:
                return true;
        }
    };

    const stepErrors = useMemo(() => {
        const errors: number[] = [];
        for (let i = 0; i < activeStep; i++) {
            if (!validateStep(i)) {
                errors.push(i);
            }
        }
        return errors;
    }, [activeStep, formData]);

    const handleSubmit = async () => {
        // Validate all
        if (!validateStep(0)) {
            Alert.alert('Required', 'Please complete the Leave Request details (Step 1).');
            scrollToSection(0);
            return;
        }
        if (!validateStep(1)) {
            Alert.alert('Required', 'Please complete Location & Travel (Step 2).');
            scrollToSection(1);
            return;
        }
        // Step 3 (Routing) is technically optional or has defaults, but if we had checks we'd scroll to index 2.

        if (!validateStep(2)) {
            Alert.alert('Required', 'Please complete Command & Duty details (Step 3).');
            scrollToSection(2);
            return;
        }

        if (!validateStep(3)) {
            Alert.alert('Required', 'Please complete Emergency Contact (Step 4).');
            scrollToSection(3);
            return;
        }


        try {
            const currentUserId = "user-123";
            await submitRequest(formData as CreateLeaveRequestPayload, currentUserId);

            // Success Celebration
            setShowSuccess(true);
            setTimeout(() => {
                router.back();
            }, 2500);

        } catch (error) {
            Alert.alert("Error", "Failed to submit leave request.");
        }
    };

    // --- Scroll Handling ---

    const handleSectionLayout = (index: number, event: LayoutChangeEvent) => {
        const layout = event.nativeEvent.layout;
        sectionCoords.current[index] = layout.y;
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        // Offset to trigger "active" state a bit earlier than top-edge
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

    if (!isHydrated) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Text className="text-slate-500 font-medium">Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950" >
            {colorScheme === 'dark' && (
                <LinearGradient
                    colors={['#0f172a', '#020617']} // slate-900 to slate-950
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                />
            )}
            < SafeAreaView style={{ flex: 1 }} edges={['top']} >
                <View className="flex-1">
                    {/* Header: StatusBar */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        className="bg-white/95 dark:bg-slate-900/95 sticky top-0 z-10 px-4 py-2"
                    >
                        <WizardStatusBar
                            currentStep={activeStep}
                            onStepPress={scrollToSection}
                            errorSteps={stepErrors}
                        />
                    </Animated.View>

                    {/* Main Scroll Feed */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0} // Accounts for header
                    >
                        <Animated.ScrollView
                            entering={FadeInDown.delay(200).springify()}
                            ref={scrollViewRef}
                            className="flex-1"
                            contentContainerClassName="px-4 pt-4 pb-56" // Adjusted bottom padding for Floating Footer
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* 1. Intent */}
                            <View onLayout={(e) => handleSectionLayout(0, e)} className="mb-6">
                                <Step1Intent
                                    leaveType={formData.leaveType}
                                    startDate={formData.startDate || ''}
                                    endDate={formData.endDate || ''}
                                    startTime={formData.startTime}
                                    endTime={formData.endTime}
                                    departureWorkingHours={formData.departureWorkingHours}
                                    returnWorkingHours={formData.returnWorkingHours}
                                    onUpdate={updateField}
                                    embedded={true}
                                />
                            </View>

                            {/* 2. Contact */}
                            <View onLayout={(e) => handleSectionLayout(1, e)} className="mb-6">
                                <Step2Contact
                                    formData={formData}
                                    onUpdate={updateField}
                                    embedded={true}
                                />
                            </View>

                            {/* 3. Routing */}
                            <View onLayout={(e) => handleSectionLayout(2, e)} className="mb-6">
                                <Step3Routing
                                    formData={formData}
                                    onUpdate={updateField}
                                    embedded={true}
                                />
                            </View>

                            {/* 4. Safety */}
                            <View onLayout={(e) => handleSectionLayout(3, e)} className="mb-6">
                                <Step4Safety
                                    formData={formData}
                                    onUpdate={updateField}
                                    embedded={true}
                                />
                            </View>

                            {/* 5. Review */}
                            <View onLayout={(e) => handleSectionLayout(4, e)} className="mb-6">
                                <ReviewSign
                                    formData={formData}
                                    embedded={true}
                                />
                            </View>
                        </Animated.ScrollView>
                    </KeyboardAvoidingView>

                    {/* Floating Footer: HUD + Signature (Simplified for Debugging) */}
                    <View
                        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
                        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    >
                        <View className="pt-4 px-4">
                            <LeaveImpactHUD
                                chargeableDays={chargeableDays}
                                projectedBalance={projectedBalance}
                                isOverdraft={isOverdraft}
                            />
                            <View className="mt-4 flex-row items-center gap-3">
                                {/* Exit Button */}
                                <Pressable
                                    onPress={handleExit}
                                    className="h-14 w-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 border border-slate-200 dark:border-slate-700"
                                    accessibilityLabel="Exit Wizard"
                                >
                                    <X size={24} color={themeColors.labelSecondary} strokeWidth={2} />
                                </Pressable>

                                <View className="flex-1">
                                    <SignatureButton
                                        onSign={handleSubmit}
                                        isSubmitting={isSyncing}
                                        disabled={!(validateStep(0) && validateStep(1) && validateStep(2) && validateStep(3))}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView >

            {/* Exit Confirmation Overlay */}
            {
                showExitModal && (
                    <View className="absolute inset-0 z-50 items-center justify-center p-4">
                        {/* Backdrop */}
                        <Animated.View entering={FadeIn} className="absolute inset-0 bg-black/60">
                            <Pressable className="flex-1" onPress={() => setShowExitModal(false)} />
                        </Animated.View>

                        {/* Content */}
                        <Animated.View entering={ZoomIn.duration(200)} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
                            <View className="p-6 items-center">
                                <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                                    Save Draft?
                                </Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-center mb-6">
                                    Would you like to save this request as a draft before exiting?
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
                )
            }

            {/* Success Celebration Overlay */}
            {
                showSuccess && (
                    <Animated.View
                        entering={FadeIn}
                        className="absolute inset-0 z-50 bg-blue-600/98 dark:bg-blue-950/98 items-center justify-center"
                    >
                        <Animated.View entering={ZoomIn.delay(200).springify()}>
                            <CheckCircle size={100} color="white" strokeWidth={2.5} />
                        </Animated.View>
                        <Animated.Text entering={FadeInUp.delay(500)} className="text-white text-3xl font-bold mt-8 tracking-tight">
                            Request Sent!
                        </Animated.Text>
                        <Animated.Text entering={FadeInUp.delay(600)} className="text-blue-100 text-lg mt-3 text-center">
                            Your leave request is on its way{'\n'}to the approver.
                        </Animated.Text>
                    </Animated.View>
                )
            }
        </View >
    );
}
