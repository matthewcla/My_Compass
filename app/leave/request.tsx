import { WizardStatusBar } from '@/components/wizard/WizardStatusBar';
import { ReviewSign } from '@/components/wizard/steps/ReviewSign';
import { Step1Intent } from '@/components/wizard/steps/Step1Intent';
import { Step2Contact } from '@/components/wizard/steps/Step2Contact';
import { Step3Routing } from '@/components/wizard/steps/Step3Routing';
import { VerificationChecks } from '@/components/wizard/steps/Step4Checklist';
import { Step4Safety } from '@/components/wizard/steps/Step4Safety';
import Colors from '@/constants/Colors';
import { useCinematicDeck } from '@/hooks/useCinematicDeck';
import { useHeaderStore } from '@/store/useHeaderStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Types & Constants ---

// --- Types & Constants ---

const TOTAL_STEPS = 5;

export default function LeaveRequestScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
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

    const handleDiscard = async () => {
        if (!currentDraftId) {
            router.back();
            return;
        }

        Alert.alert(
            "Discard Draft?",
            "Are you sure you want to discard this request? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Discard",
                    style: "destructive",
                    onPress: async () => {
                        await discardDraft(currentDraftId);
                        setCurrentDraftId(null);
                        router.back();
                    }
                }
            ]
        );
    };

    // Check for draft on mount
    React.useEffect(() => {
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
    }, [leaveRequests]);

    // --- State ---
    const [verificationChecks, setVerificationChecks] = useState<VerificationChecks>({
        hasSufficientBalance: false,
        understandsReportingTime: false,
        verifiedDates: false,
    });

    const [formData, setFormData] = useState<Partial<CreateLeaveRequestPayload>>({
        leaveType: 'annual',
        leaveInConus: true,
        destinationCountry: 'USA',
        emergencyContact: {
            name: '',
            relationship: '',
            phoneNumber: '',
        },
    });

    // --- Helpers ---

    const updateField = (field: keyof CreateLeaveRequestPayload, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateEmergencyContact = (field: keyof CreateLeaveRequestPayload['emergencyContact'], value: string) => {
        setFormData(prev => ({
            ...prev,
            emergencyContact: {
                name: '',
                relationship: '',
                phoneNumber: '',
                ...prev.emergencyContact,
                [field]: value
            }
        }));
    };

    const toggleVerification = (key: keyof VerificationChecks) => {
        setVerificationChecks(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const validateStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 0: // Step 1: Intent
                if (!formData.leaveType) {
                    Alert.alert('Required', 'Please select a Leave Type.');
                    return false;
                }
                if (!formData.startDate || !formData.endDate) {
                    Alert.alert('Required', 'Please enter both start and end dates.');
                    return false;
                }
                return true;
            case 1: // Step 2: Contact (Location/Travel)
                if (!formData.leaveAddress || !formData.leavePhoneNumber) {
                    Alert.alert('Required', 'Please fill in address and phone.');
                    return false;
                }
                // Removed Emergency Contact validation from here
                return true;
            case 2: // Step 3: Command
                // Optional fields mostly, but verify strictness if needed
                return true;
            case 3: // Step 4: Safety
                if (!formData.emergencyContact?.name || !formData.emergencyContact?.relationship || !formData.emergencyContact?.phoneNumber) {
                    Alert.alert('Required', 'Please fill in all emergency contact details.');
                    return false;
                }
                return true;
            case 4: // Step 5: Review
                if (!formData.startDate) return false;

                const allVerified = Object.values(verificationChecks).every(v => v);
                if (!allVerified) {
                    Alert.alert('Incomplete', 'Please complete all verification checks.');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
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

    const deck = useCinematicDeck({
        totalSteps: TOTAL_STEPS,
        onComplete: handleSubmit,
    });

    const handleNext = () => {
        if (!validateStep(deck.step)) return;
        deck.next();
    };

    const renderCard = () => {
        switch (deck.step) {
            case 0:
                return (
                    <Step1Intent
                        key="step0"
                        leaveType={formData.leaveType}
                        startDate={formData.startDate || ''}
                        endDate={formData.endDate || ''}
                        leaveInConus={formData.leaveInConus ?? true}
                        destinationCountry={formData.destinationCountry ?? 'USA'}
                        onUpdate={updateField}
                    />
                );
            case 1:
                return (
                    <Step2Contact
                        key="step1"
                        formData={formData}
                        onUpdate={updateField}
                    />
                );
            case 2:
                return (
                    <Step3Routing
                        key="step2"
                        formData={formData}
                        onUpdate={updateField}
                    />
                );
            case 3:
                return (
                    <Step4Safety
                        key="safety"
                        formData={formData}
                        onUpdate={updateField}
                    />
                );
            case 4:
                return (
                    <ReviewSign
                        key="step4"
                        formData={formData}
                        verificationChecks={verificationChecks}
                        onToggleVerification={toggleVerification}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#020617']} // slate-900 to slate-950
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <View className="flex-1">
                        {/* Wizard Header with Close Button */}
                        <View className="flex-row items-center justify-between bg-slate-900/50">
                            <View className="flex-1">
                                <WizardStatusBar currentStep={deck.step} onStepPress={(s) => deck.goTo(s)} />
                            </View>
                            <Pressable
                                onPress={handleDiscard}
                                className="p-4 mr-2"
                                hitSlop={10}
                            >
                                <X size={24} color="#94a3b8" strokeWidth={2} />
                            </Pressable>
                        </View>

                        {/* Card Container */}
                        <View className="flex-1 px-4 pt-4">
                            {renderCard()}
                        </View>

                        {/* Footer Navigation */}
                        <View className="border-t border-white/10 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex-row items-center justify-center gap-4">
                            {!deck.isFirst && (
                                <Pressable
                                    onPress={deck.back}
                                    className="flex-1 flex-row items-center justify-center p-4 rounded-xl bg-slate-800 active:bg-slate-700 border border-slate-700"
                                >
                                    <ArrowLeft size={20} color={themeColors.labelSecondary} className="mr-2 opacity-80" strokeWidth={1.5} />
                                    <Text className="font-bold text-slate-300">Back</Text>
                                </Pressable>
                            )}

                            <Pressable
                                onPress={handleNext}
                                disabled={isSyncing || (deck.isLast && !Object.values(verificationChecks).every(v => v))}
                                className={`flex-1 flex-row items-center justify-center p-4 rounded-xl ${isSyncing || (deck.isLast && !Object.values(verificationChecks).every(v => v))
                                    ? 'bg-slate-800 border border-slate-700 opacity-50'
                                    : 'bg-blue-600 active:bg-blue-500 shadow-lg shadow-blue-900/20'
                                    }`}
                            >
                                <Text className="font-bold text-white mr-2">
                                    {deck.isLast ? (isSyncing ? 'Submitting...' : 'Sign & Submit') : 'Next'}
                                </Text>
                                {!isSyncing && <ArrowRight size={20} color="white" strokeWidth={1.5} />}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
