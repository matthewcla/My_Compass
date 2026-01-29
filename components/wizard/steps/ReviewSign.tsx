
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { Step4Checklist, VerificationChecks } from './Step4Checklist';

interface ReviewSignProps {
    formData: Partial<CreateLeaveRequestPayload>;
    verificationChecks: VerificationChecks;
    onToggleVerification: (key: keyof VerificationChecks) => void;
}

export function ReviewSign({ formData, verificationChecks, onToggleVerification }: ReviewSignProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    return (
        <View className="gap-6">
            <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <Text className="text-blue-900 dark:text-blue-100 font-bold text-lg mb-4">Summary</Text>

                <View className="gap-4">
                    <View>
                        <Text className="text-xs font-bold text-systemBlue uppercase tracking-widest">Dates</Text>
                        <Text className="text-base text-labelPrimary font-medium">{formData.startDate} to {formData.endDate}</Text>
                    </View>

                    <View>
                        <Text className="text-xs font-bold text-systemBlue uppercase tracking-widest">Type</Text>
                        <Text className="text-base text-labelPrimary font-medium capitalize">{formData.leaveType}</Text>
                    </View>

                    <View>
                        <Text className="text-xs font-bold text-systemBlue uppercase tracking-widest">Location</Text>
                        <Text className="text-base text-labelPrimary font-medium">{formData.leaveAddress}</Text>
                        <Text className="text-base text-labelPrimary">{formData.leavePhoneNumber}</Text>
                    </View>

                    <View>
                        <Text className="text-xs font-bold text-systemBlue uppercase tracking-widest">Emergency Contact</Text>
                        <Text className="text-base text-labelPrimary font-medium">{formData.emergencyContact?.name} ({formData.emergencyContact?.relationship})</Text>
                        <Text className="text-base text-labelPrimary">{formData.emergencyContact?.phoneNumber}</Text>
                    </View>

                    <View>
                        <Text className="text-xs font-bold text-systemBlue uppercase tracking-widest">Remarks</Text>
                        <Text className="text-base text-labelPrimary font-italic">{formData.memberRemarks || "None"}</Text>
                    </View>
                </View>
            </View>

            {/* Verification Checklist */}
            <Step4Checklist checks={verificationChecks} onToggle={onToggleVerification} />

            <View className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 flex-row items-start">
                <View className="mt-1 mr-3">
                    <CheckCircle2 size={20} color={themeColors.navyGold} strokeWidth={1.5} />
                </View>
                <Text className="text-amber-800 dark:text-amber-100 text-sm flex-1">
                    By submitting this request, you certify that the information provided is accurate and you understand the leave policies relevant to your request type.
                </Text>
            </View>
        </View>
    );
}
