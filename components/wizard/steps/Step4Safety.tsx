import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import { EmergencyContact } from '@/types/schema';
import { FileText, Phone, User, UserPlus } from 'lucide-react-native';
import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

interface Step4SafetyProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: unknown) => void;
    embedded?: boolean;
}

export function Step4Safety({ formData, onUpdate, embedded = false }: Step4SafetyProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const handleEmergencyUpdate = (field: keyof EmergencyContact, value: string) => {
        const currentContact = formData.emergencyContact || {
            name: '',
            relationship: '',
            phoneNumber: '',
        };

        onUpdate('emergencyContact', {
            ...currentContact,
            [field]: value
        });
    };

    return (
        <WizardCard title="Safety & Remarks" scrollable={!embedded}>
            <View className="gap-8">

                {/* Section 1: Emergency Contact */}
                <View className="gap-4">
                    <View className="flex-row items-center gap-2">
                        <UserPlus size={22} color={isDark ? '#338EF7' : '#000A23'} className="text-primary" strokeWidth={2} />
                        <Text className="text-lg font-bold text-on-surface">
                            Emergency Contact
                        </Text>
                    </View>

                    <View className="bg-surface-container rounded-none p-4 border border-outline-variant gap-4">

                        {/* Name */}
                        <View className="gap-2">
                            <Text className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Name</Text>
                            <View className="flex-row items-center bg-surface border border-outline-variant rounded-none px-5 py-4 gap-3">
                                <User size={18} color={isDark ? '#C4C6D0' : '#44474F'} className="text-on-surface-variant" />
                                <TextInput
                                    className="flex-1 text-base text-on-surface"
                                    placeholder="Full Name"
                                    placeholderTextColor={isDark ? '#C4C6D0' : '#44474F'}
                                    value={formData.emergencyContact?.name}
                                    onChangeText={(text) => handleEmergencyUpdate('name', text)}
                                />
                            </View>
                        </View>

                        {/* Relationship */}
                        <View className="gap-2">
                            <Text className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Relationship</Text>
                            <View className="flex-row items-center bg-surface border border-outline-variant rounded-none px-5 py-4 gap-3">
                                <User size={18} color={isDark ? '#C4C6D0' : '#44474F'} className="text-on-surface-variant" />
                                <TextInput
                                    className="flex-1 text-base text-on-surface"
                                    placeholder="e.g. Spouse, Parent"
                                    placeholderTextColor={isDark ? '#C4C6D0' : '#44474F'}
                                    value={formData.emergencyContact?.relationship}
                                    onChangeText={(text) => handleEmergencyUpdate('relationship', text)}
                                />
                            </View>
                        </View>

                        {/* Phone */}
                        <View className="gap-2">
                            <Text className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Phone Number</Text>
                            <View className="flex-row items-center bg-surface border border-outline-variant rounded-none px-5 py-4 gap-3">
                                <Phone size={18} color={isDark ? '#C4C6D0' : '#44474F'} className="text-on-surface-variant" />
                                <TextInput
                                    className="flex-1 text-base text-on-surface"
                                    placeholder="555-123-4567"
                                    placeholderTextColor={isDark ? '#C4C6D0' : '#44474F'}
                                    value={formData.emergencyContact?.phoneNumber}
                                    onChangeText={(text) => handleEmergencyUpdate('phoneNumber', text)}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                    </View>
                </View>

                {/* Section 2: Remarks */}
                <View className="gap-4">
                    <View className="flex-row items-center gap-2">
                        <FileText size={22} color={isDark ? '#338EF7' : '#000A23'} className="text-primary" strokeWidth={2} />
                        <Text className="text-lg font-bold text-on-surface">
                            Member Remarks
                        </Text>
                    </View>

                    <View className="bg-surface-container rounded-none p-4 border border-outline-variant">
                        <TextInput
                            className="flex-1 text-base text-on-surface min-h-[120px]"
                            placeholder="Add any additional context for your chain of command here..."
                            placeholderTextColor={isDark ? '#8E909A' : '#747780'}
                            value={formData.memberRemarks}
                            onChangeText={(text) => onUpdate('memberRemarks', text)}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                </View>

            </View>
        </WizardCard>
    );
}
