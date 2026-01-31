import { SignatureButton } from '@/components/ui/SignatureButton';
import { LeaveImpactHUD } from '@/components/wizard/LeaveImpactHUD';
import { WizardStatusBar } from '@/components/wizard/WizardStatusBar';
import { ReviewSign } from '@/components/wizard/steps/ReviewSign';
import { Step1Intent } from '@/components/wizard/steps/Step1Intent';
import { Step2Contact } from '@/components/wizard/steps/Step2Contact';
import { Step3Routing } from '@/components/wizard/steps/Step3Routing';
import { VerificationChecks } from '@/components/wizard/steps/Step4Checklist';
import { Step4Safety } from '@/components/wizard/steps/Step4Safety';
import Colors from '@/constants/Colors';
import { useHeaderStore } from '@/store/useHeaderStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { calculateLeave } from '@/utils/leaveLogic';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, LayoutChangeEvent, Modal, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
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

    React.useEffect(() => {
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
            Alert.alert(
                "Resume Draft?",
                "You have an unfinished leave request. Would you like to resume it?",
                [
                    {
                        text: "Start New",
                        style: "destructive",
                        onPress: async () => {
                            await discardDraft(draft.id);
                        }
                    },
                    {
                        text: "Resume",
                        onPress: () => {
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
                    }
                ]
            );
        }
    }, [leaveRequests, draftId]);

    // --- State ---
    const [activeStep, setActiveStep] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const sectionCoords = useRef<number[]>([]);

    const [verificationChecks, setVerificationChecks] = useState<VerificationChecks>({
        hasSufficientBalance: false,
        understandsReportingTime: false,
        verifiedDates: false,
    });

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
    });

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

    // --- Helpers ---

    const updateField = (field: keyof CreateLeaveRequestPayload, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleVerification = (key: keyof VerificationChecks) => {
        setVerificationChecks(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = async () => {
        // Validate all
        if (!formData.leaveType || !formData.startDate || !formData.endDate) {
            Alert.alert('Required', 'Please complete the Leave Request details (Step 1).');
            scrollToSection(0);
            return;
        }
        if (!formData.leaveAddress || !formData.leavePhoneNumber) {
            Alert.alert('Required', 'Please complete Location & Travel (Step 2).');
            scrollToSection(1);
            return;
        }
        if (!formData.emergencyContact?.name || !formData.emergencyContact?.phoneNumber) {
            Alert.alert('Required', 'Please complete Emergency Contact (Step 4).');
            scrollToSection(3);
            return;
        }

        const allVerified = Object.values(verificationChecks).every(v => v);
        if (!allVerified) {
            Alert.alert('Incomplete', 'Please check all verification boxes at the bottom.');
            scrollToSection(4);
            return;
        }

        try {
            const currentUserId = "user-123";
            await submitRequest(formData as CreateLeaveRequestPayload, currentUserId);
            Alert.alert("Success", "Leave request submitted successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
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

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            {colorScheme === 'dark' && (
                <LinearGradient
                    colors={['#0f172a', '#020617']} // slate-900 to slate-950
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                />
            )}
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View className="flex-1">
                    {/* Header: StatusBar */}
                    <View className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 px-4 py-2">
                        <WizardStatusBar
                            currentStep={activeStep}
                            onStepPress={scrollToSection}
                        />
                    </View>

                    {/* Main Scroll Feed */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0} // Accounts for header
                    >
                        <ScrollView
                            ref={scrollViewRef}
                            className="flex-1"
                            contentContainerClassName="px-4 pt-4 pb-80" // Large bottom padding for Floating Footer
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
                                    verificationChecks={verificationChecks}
                                    onToggleVerification={toggleVerification}
                                    embedded={true}
                                />
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>

                    {/* Floating Footer: HUD + Signature */}
                    <View className="absolute bottom-0 left-0 right-0">
                        <LinearGradient
                            colors={[
                                'transparent',
                                isDark ? 'rgba(2,6,23,0.95)' : 'rgba(248,250,252,0.95)',
                                isDark ? '#020617' : '#f8fafc'
                            ]}
                            locations={[0, 0.3, 1]}
                            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                            className="pt-12"
                        >
                            <View className="px-4">
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
                                            disabled={!Object.values(verificationChecks).every(v => v)}
                                        />
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                </View>
            </SafeAreaView>

            {/* Exit Confirmation Modal */}
            <Modal
                transparent
                visible={showExitModal}
                animationType="fade"
                onRequestClose={() => setShowExitModal(false)}
            >
                <View className="flex-1 bg-black/50 backdrop-blur-sm items-center justify-center p-4">
                    <View className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
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
                    </View>
                </View>
            </Modal>
        </View>
    );
}
