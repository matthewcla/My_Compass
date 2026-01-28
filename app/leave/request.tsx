import { WizardStatusBar } from '@/components/wizard/WizardStatusBar';
import { ReviewSign } from '@/components/wizard/steps/ReviewSign';
import { Step1Intent } from '@/components/wizard/steps/Step1Intent';
import { Step2Contact } from '@/components/wizard/steps/Step2Contact';
import { Step3Routing } from '@/components/wizard/steps/Step3Routing';
import { VerificationChecks } from '@/components/wizard/steps/Step4Checklist';
import Colors from '@/constants/Colors';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Trash } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';

// --- Types & Constants ---

const LEAVE_TYPES = [
    { id: 'annual', label: 'Annual' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'convalescent', label: 'Convalescent' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'parental', label: 'Parental' },
    { id: 'bereavement', label: 'Bereavement' },
    { id: 'adoption', label: 'Adoption' },
    { id: 'ptdy', label: 'PTDY' },
    { id: 'other', label: 'Other' },
] as const;

const TOTAL_STEPS = 4;

export default function LeaveRequestScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const router = useRouter();
    const submitRequest = useLeaveStore((state) => state.submitRequest);
    const discardDraft = useLeaveStore((state) => state.discardDraft);
    const leaveRequests = useLeaveStore((state) => state.leaveRequests);
    const isSyncing = useLeaveStore((state) => state.isSyncingRequests);

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

    useScreenHeader("MY ADMIN", "Drafting Request", {
        icon: Trash,
        onPress: handleDiscard,
    });

    // Check for draft on mount
    React.useEffect(() => {
        // Simple logic: grab the first 'draft' status request found for this user (in a real app, might pick latest)
        // Note: userLeaveRequestIds might be empty if not fetched yet, but hydration happens early.
        const drafts = Object.values(leaveRequests).filter(r => r.status === 'draft'); // Assuming 'draft' status exists or we use pending/undefined
        // Actually our schema uses 'pending' for submitted. Storage doesn't explicitly have 'draft' unless we added it?
        // Wait, schema status enum is: 'draft' | 'pending' | 'approved' | 'denied' | 'canceled'.
        // Let's verify schema.ts if needed, but assuming 'draft' is valid.

        if (drafts.length > 0 && !currentDraftId) {
            const draft = drafts[0]; // Just take first for now
            Alert.alert(
                "Resume Draft?",
                "You have an unfinished leave request. Would you like to resume it?",
                [
                    {
                        text: "Start New",
                        style: "destructive",
                        onPress: async () => {
                            // If they start new, we might want to discard the old one or just ignore it?
                            // User request said: "Discard old and start new" implying we clean up.
                            await discardDraft(draft.id);
                            // Form is already initial state
                        }
                    },
                    {
                        text: "Resume",
                        onPress: () => {
                            setCurrentDraftId(draft.id);
                            // Populate form data
                            setFormData({
                                leaveType: draft.leaveType,
                                startDate: draft.startDate,
                                endDate: draft.endDate,
                                leaveAddress: draft.leaveAddress,
                                leavePhoneNumber: draft.leavePhoneNumber,
                                emergencyContact: draft.emergencyContact,
                                memberRemarks: draft.memberRemarks,
                                // ... map other fields
                            });
                            // We could also try to infer the step based on what's filled
                            // but defaulting to step 0 is safer for now, or check fields.
                        }
                    }
                ]
            );
        }
    }, [leaveRequests]); // Dependency on requests to catch hydration

    // --- State ---

    const [step, setStep] = useState(0);
    const [verificationChecks, setVerificationChecks] = useState<VerificationChecks>({
        hasSufficientBalance: false,
        understandsReportingTime: false,
        verifiedDates: false,
    });

    const [formData, setFormData] = useState<Partial<CreateLeaveRequestPayload>>({
        leaveType: 'annual',
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

    const handleNext = () => {
        if (!validateStep(step)) return;
        if (step < TOTAL_STEPS - 1) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    const validateStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 0: // Dates (Intent)
                if (!formData.startDate || !formData.endDate) {
                    Alert.alert('Required', 'Please enter both start and end dates.');
                    return false;
                }
                return true;
            case 1: // Contact (Details + Emergency)
                if (!formData.leaveAddress || !formData.leavePhoneNumber) {
                    Alert.alert('Required', 'Please fill in address and phone.');
                    return false;
                }
                if (!formData.emergencyContact?.name || !formData.emergencyContact?.relationship || !formData.emergencyContact?.phoneNumber) {
                    Alert.alert('Required', 'Please fill in all emergency contact details.');
                    return false;
                }
                return true;
            case 2: // Routing (Type + Remarks)
                if (!formData.leaveType) {
                    Alert.alert('Required', 'Please select a Leave Type.');
                    return false;
                }
                return true;
            case 3: // Review (Check) + Verification
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
            // Mock User ID for now (In real app, get from auth context/store)
            const currentUserId = "user-123";

            await submitRequest(formData as CreateLeaveRequestPayload, currentUserId);

            Alert.alert("Success", "Leave request submitted successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert("Error", "Failed to submit leave request.");
        }
    };

    // --- Render Steps ---

    // renderStep0_Dates removed in favor of Step1Intent component

    // renderStep1_Details and renderStep2_Emergency removed in favor of Step2Contact component

    // renderStep3_Review removed in favor of ReviewSign component

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-systemBackground"
        >
            {/* Wizard Status Bar */}
            <WizardStatusBar currentStep={step} onStepPress={(s) => setStep(s)} />

            <ScrollView className="flex-1 px-6 pt-6">
                {step === 0 && (
                    <Step1Intent
                        startDate={formData.startDate || ''}
                        endDate={formData.endDate || ''}
                        onUpdate={updateField}
                    />
                )}
                {step === 1 && (
                    <Step2Contact
                        formData={formData}
                        onUpdate={updateField}
                        onUpdateEmergency={updateEmergencyContact}
                    />
                )}
                {step === 2 && (
                    <Step3Routing
                        formData={formData}
                        onUpdate={updateField}
                    />
                )}
                {step === 3 && (
                    <ReviewSign
                        formData={formData}
                        verificationChecks={verificationChecks}
                        onToggleVerification={toggleVerification}
                    />
                )}

                {/* Bottom spacer for scroll view */}
                <View className="h-20" />
            </ScrollView>

            {/* Footer Navigation */}
            <View className="p-6 border-t border-systemGray6 bg-systemBackground safe-area-bottom">
                <View className="flex-row gap-4">
                    {step > 0 && (
                        <Pressable
                            onPress={handleBack}
                            className="flex-1 flex-row items-center justify-center p-4 rounded-xl bg-systemGray6 active:bg-systemGray6"
                        >
                            <ArrowLeft size={20} color={themeColors.labelSecondary} className="mr-2" strokeWidth={1.5} />
                            <Text className="font-bold text-labelSecondary">Back</Text>
                        </Pressable>
                    )}

                    <Pressable
                        onPress={handleNext}
                        disabled={isSyncing || (step === TOTAL_STEPS - 1 && !Object.values(verificationChecks).every(v => v))}
                        className={`flex-1 flex-row items-center justify-center p-4 rounded-xl ${isSyncing || (step === TOTAL_STEPS - 1 && !Object.values(verificationChecks).every(v => v))
                            ? 'bg-systemGray4'
                            : 'bg-systemBlue active:bg-blue-700'
                            }`}
                    >
                        <Text className="font-bold text-white mr-2">
                            {step === TOTAL_STEPS - 1 ? (isSyncing ? 'Submitting...' : 'Sign & Submit') : 'Next'}
                        </Text>
                        {!isSyncing && <ArrowRight size={20} color="white" strokeWidth={1.5} />}
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
