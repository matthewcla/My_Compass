import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

interface ReviewSignProps {
    formData: Partial<CreateLeaveRequestPayload>;
    embedded?: boolean;
}

export function ReviewSign({ formData, embedded = false }: ReviewSignProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    return (
        <WizardCard title="Review Request" scrollable={!embedded}>
            <View className="gap-6 pb-6">
                <View className="bg-primary-container p-4 rounded-none border border-primary">
                    <Text className="text-on-primary-container font-bold text-lg mb-4">Summary</Text>

                    <View className="gap-4">
                        <View>
                            <Text className="text-xs font-bold text-on-primary-container uppercase tracking-widest mb-1">Dates</Text>
                            <Text className="text-base text-white font-medium">{formData.startDate} to {formData.endDate}</Text>
                        </View>

                        <View>
                            <Text className="text-xs font-bold text-on-primary-container uppercase tracking-widest mb-1">Type</Text>
                            <Text className="text-base text-white font-medium capitalize">{formData.leaveType}</Text>
                        </View>

                        <View>
                            <Text className="text-xs font-bold text-on-primary-container uppercase tracking-widest mb-1">Location</Text>
                            <Text className="text-base text-white font-medium">{formData.leaveAddress}</Text>
                            <Text className="text-base text-white">{formData.leavePhoneNumber}</Text>
                        </View>

                        <View>
                            <Text className="text-xs font-bold text-on-primary-container uppercase tracking-widest mb-1">Emergency Contact</Text>
                            <Text className="text-base text-white font-medium">{formData.emergencyContact?.name} ({formData.emergencyContact?.relationship})</Text>
                            <Text className="text-base text-white">{formData.emergencyContact?.phoneNumber}</Text>
                        </View>

                        <View>
                            <Text className="text-xs font-bold text-on-primary-container uppercase tracking-widest mb-1">Remarks</Text>
                            <Text className="text-base text-white font-italic">{formData.memberRemarks || "None"}</Text>
                        </View>
                    </View>
                </View>

                <View className="bg-surface-container p-4 rounded-none border border-outline-variant flex-row items-start">
                    <View className="mt-1 mr-3">
                        <CheckCircle2 size={20} color={isDark ? '#C4C6D0' : '#44474F'} className="text-on-surface-variant" strokeWidth={1.5} />
                    </View>
                    <Text className="text-on-surface-variant text-sm flex-1 font-medium">
                        By submitting this request, you certify that the information provided is accurate and you understand the leave policies relevant to your request type.
                    </Text>
                </View>
            </View>
        </WizardCard>
    );
}
