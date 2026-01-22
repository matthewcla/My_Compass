import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, MapPin, Phone, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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
    const router = useRouter();
    const submitRequest = useLeaveStore((state) => state.submitRequest);
    const isSyncing = useLeaveStore((state) => state.isSyncingRequests);

    // --- State ---

    const [step, setStep] = useState(0);
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
            case 0: // Dates
                if (!formData.startDate || !formData.endDate) {
                    Alert.alert('Required', 'Please enter both start and end dates.');
                    return false;
                }
                // Simple regex or Date.parse check could go here
                return true;
            case 1: // Details
                if (!formData.leaveType || !formData.leaveAddress || !formData.leavePhoneNumber) {
                    Alert.alert('Required', 'Please fill in all details.');
                    return false;
                }
                return true;
            case 2: // Emergency Contact
                if (!formData.emergencyContact?.name || !formData.emergencyContact?.relationship || !formData.emergencyContact?.phoneNumber) {
                    Alert.alert('Required', 'Please fill in all emergency contact details.');
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

    const renderStep0_Dates = () => (
        <View className="space-y-6">
            <View>
                <Text className="text-sm font-medium text-slate-500 mb-1">Start Date (YYYY-MM-DD)</Text>
                <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                    <Calendar size={20} color="#64748b" className="mr-3" />
                    <TextInput
                        className="flex-1 text-base text-slate-900"
                        placeholder="2026-02-01"
                        value={formData.startDate}
                        onChangeText={(text) => updateField('startDate', text)}
                        keyboardType="numbers-and-punctuation"
                    />
                </View>
            </View>

            <View>
                <Text className="text-sm font-medium text-slate-500 mb-1">End Date (YYYY-MM-DD)</Text>
                <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                    <Calendar size={20} color="#64748b" className="mr-3" />
                    <TextInput
                        className="flex-1 text-base text-slate-900"
                        placeholder="2026-02-05"
                        value={formData.endDate}
                        onChangeText={(text) => updateField('endDate', text)}
                        keyboardType="numbers-and-punctuation"
                    />
                </View>
            </View>
        </View>
    );

    const renderStep1_Details = () => (
        <View className="space-y-6">
            <View>
                <Text className="text-sm font-medium text-slate-500 mb-2">Leave Type</Text>
                <View className="flex-row flex-wrap gap-2">
                    {LEAVE_TYPES.map((type) => (
                        <Pressable
                            key={type.id}
                            onPress={() => updateField('leaveType', type.id)}
                            className={`px-4 py-2 rounded-full border ${formData.leaveType === type.id
                                ? 'bg-blue-600 border-blue-600'
                                : 'bg-white border-slate-200'
                                }`}
                        >
                            <Text
                                className={`${formData.leaveType === type.id ? 'text-white' : 'text-slate-600'
                                    } font-medium`}
                            >
                                {type.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View>
                <Text className="text-sm font-medium text-slate-500 mb-1">Leave Address</Text>
                <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                    <MapPin size={20} color="#64748b" className="mr-3" />
                    <TextInput
                        className="flex-1 text-base text-slate-900"
                        placeholder="123 Beach St, Honolulu, HI"
                        value={formData.leaveAddress}
                        onChangeText={(text) => updateField('leaveAddress', text)}
                    />
                </View>
            </View>

            <View>
                <Text className="text-sm font-medium text-slate-500 mb-1">Leave Phone Number</Text>
                <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                    <Phone size={20} color="#64748b" className="mr-3" />
                    <TextInput
                        className="flex-1 text-base text-slate-900"
                        placeholder="555-123-4567"
                        value={formData.leavePhoneNumber}
                        onChangeText={(text) => updateField('leavePhoneNumber', text)}
                        keyboardType="phone-pad"
                    />
                </View>
            </View>
        </View>
    );

    const renderStep2_Emergency = () => (
        <View className="space-y-6">
            <Text className="text-slate-500 text-sm">
                Who should we contact in case of an emergency while you are on leave?
            </Text>

            <View>
                <Text className="text-sm font-medium text-slate-500 mb-1">Contact Name</Text>
                <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                    <User size={20} color="#64748b" className="mr-3" />
                    <TextInput
                        className="flex-1 text-base text-slate-900"
                        placeholder="Jane Doe"
                        value={formData.emergencyContact?.name}
                        onChangeText={(text) => updateEmergencyContact('name', text)}
                    />
                </View>
            </View>

            <View>
                <Text className="text-sm font-medium text-slate-500 mb-1">Relationship</Text>
                <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                    {/* Reusing User icon for relationship broadly, or could use Heart etc */}
                    <User size={20} color="#64748b" className="mr-3" />
                    <TextInput
                        className="flex-1 text-base text-slate-900"
                        placeholder="Spouse, Parent, etc."
                        value={formData.emergencyContact?.relationship}
                        onChangeText={(text) => updateEmergencyContact('relationship', text)}
                    />
                </View>
            </View>

            <View>
                <Text className="text-sm font-medium text-slate-500 mb-1">Emergency Phone</Text>
                <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                    <Phone size={20} color="#64748b" className="mr-3" />
                    <TextInput
                        className="flex-1 text-base text-slate-900"
                        placeholder="555-987-6543"
                        value={formData.emergencyContact?.phoneNumber}
                        onChangeText={(text) => updateEmergencyContact('phoneNumber', text)}
                        keyboardType="phone-pad"
                    />
                </View>
            </View>
        </View>
    );

    const renderStep3_Review = () => (
        <View className="space-y-6">
            <View className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <Text className="text-blue-900 font-bold text-lg mb-4">Summary</Text>

                <View className="space-y-4">
                    <View>
                        <Text className="text-xs font-bold text-blue-500 uppercase tracking-widest">Dates</Text>
                        <Text className="text-base text-slate-800 font-medium">{formData.startDate} to {formData.endDate}</Text>
                    </View>

                    <View>
                        <Text className="text-xs font-bold text-blue-500 uppercase tracking-widest">Type</Text>
                        <Text className="text-base text-slate-800 font-medium capitalize">{formData.leaveType}</Text>
                    </View>

                    <View>
                        <Text className="text-xs font-bold text-blue-500 uppercase tracking-widest">Location</Text>
                        <Text className="text-base text-slate-800 font-medium">{formData.leaveAddress}</Text>
                        <Text className="text-base text-slate-800">{formData.leavePhoneNumber}</Text>
                    </View>

                    <View>
                        <Text className="text-xs font-bold text-blue-500 uppercase tracking-widest">Emergency Contact</Text>
                        <Text className="text-base text-slate-800 font-medium">{formData.emergencyContact?.name} ({formData.emergencyContact?.relationship})</Text>
                        <Text className="text-base text-slate-800">{formData.emergencyContact?.phoneNumber}</Text>
                    </View>
                </View>
            </View>

            <View className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex-row items-start">
                <View className="mt-1 mr-3">
                    <CheckCircle2 size={20} color="#d97706" />
                </View>
                <Text className="text-amber-800 text-sm flex-1">
                    By submitting this request, you certify that the information provided is accurate and you understand the leave policies relevant to your request type.
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            {/* Header */}
            <View className="pt-4 pb-2 px-6 border-b border-slate-100 flex-row items-center justify-between">
                <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
                    <X size={24} color="#334155" />
                </Pressable>
                <View className="items-center">
                    <Text className="font-bold text-lg text-slate-900">Request Leave</Text>
                    <Text className="text-xs text-slate-500 font-medium">Step {step + 1} of {TOTAL_STEPS}</Text>
                </View>
                <View className="w-8" />{/* Spacer for centering */}
            </View>

            {/* Progress Bar */}
            <View className="h-1 bg-slate-100 w-full">
                <View
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                />
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {step === 0 && renderStep0_Dates()}
                {step === 1 && renderStep1_Details()}
                {step === 2 && renderStep2_Emergency()}
                {step === 3 && renderStep3_Review()}

                {/* Bottom spacer for scroll view */}
                <View className="h-20" />
            </ScrollView>

            {/* Footer Navigation */}
            <View className="p-6 border-t border-slate-100 bg-white safe-area-bottom">
                <View className="flex-row gap-4">
                    {step > 0 && (
                        <Pressable
                            onPress={handleBack}
                            className="flex-1 flex-row items-center justify-center p-4 rounded-xl bg-slate-100 active:bg-slate-200"
                        >
                            <ArrowLeft size={20} color="#475569" className="mr-2" />
                            <Text className="font-bold text-slate-700">Back</Text>
                        </Pressable>
                    )}

                    <Pressable
                        onPress={handleNext}
                        disabled={isSyncing}
                        className={`flex-1 flex-row items-center justify-center p-4 rounded-xl ${isSyncing ? 'bg-blue-400' : 'bg-blue-600 active:bg-blue-700'
                            }`}
                    >
                        <Text className="font-bold text-white mr-2">
                            {step === TOTAL_STEPS - 1 ? (isSyncing ? 'Submitting...' : 'Submit Request') : 'Next'}
                        </Text>
                        {!isSyncing && <ArrowRight size={20} color="white" />}
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
