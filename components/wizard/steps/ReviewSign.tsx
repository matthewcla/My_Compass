import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { Text, View, useColorScheme } from 'react-native';

interface ReviewSignProps {
    formData: Partial<CreateLeaveRequestPayload>;
    embedded?: boolean;
}

export function ReviewSign({ formData, embedded = false }: ReviewSignProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    return (
        <WizardCard title="Review Request" scrollable={!embedded}>
            <View className="gap-6 pb-6">
                <View className="bg-primary-container p-4 rounded-none border border-primary">
                    <Text className="text-on-primary-container font-bold text-lg mb-4">Summary</Text>

                    <View className="gap-4">
                        <View>
                            <Text className="text-xs font-bold text-primary uppercase tracking-widest">Dates</Text>
                            <Text className="text-base text-on-surface font-medium">{formData.startDate} to {formData.endDate}</Text>
                        </View>

                        <View>
                            <Text className="text-xs font-bold text-primary uppercase tracking-widest">Type</Text>
                            <Text className="text-base text-on-surface font-medium capitalize">{formData.leaveType}</Text>
                        </View>

                        <View>
                            <Text className="text-xs font-bold text-primary uppercase tracking-widest">Location</Text>
                            <Text className="text-base text-on-surface font-medium">{formData.leaveAddress}</Text>
                            <Text className="text-base text-on-surface">{formData.leavePhoneNumber}</Text>
                        </View>

                        <View>
                            <Text className="text-xs font-bold text-primary uppercase tracking-widest">Emergency Contact</Text>
                            <Text className="text-base text-on-surface font-medium">{formData.emergencyContact?.name} ({formData.emergencyContact?.relationship})</Text>
                            <Text className="text-base text-on-surface">{formData.emergencyContact?.phoneNumber}</Text>
                        </View>

                        <View>
                            <Text className="text-xs font-bold text-primary uppercase tracking-widest">Remarks</Text>
                            <Text className="text-base text-on-surface font-italic">{formData.memberRemarks || "None"}</Text>
                        </View>
                    </View>
                </View>

                <View className="bg-warning-container p-4 rounded-none border border-warning flex-row items-start">
                    <View className="mt-1 mr-3">
                        <CheckCircle2 size={20} className="text-warning" strokeWidth={1.5} />
                    </View>
                    <Text className="text-on-warning-container text-sm flex-1">
                        By submitting this request, you certify that the information provided is accurate and you understand the leave policies relevant to your request type.
                    </Text>
                </View>
            </View>
        </WizardCard>
    );
}
