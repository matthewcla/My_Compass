import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import { EmergencyContact } from '@/types/schema';
import { FileText, Phone, User, UserPlus } from 'lucide-react-native';
import React from 'react';
import { Text, TextInput, View, useColorScheme } from 'react-native';

interface Step4SafetyProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
}

export function Step4Safety({ formData, onUpdate }: Step4SafetyProps) {
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
        <WizardCard title="Safety & Remarks">
            <View className="space-y-8">

                {/* Section 1: Emergency Contact */}
                <View className="space-y-4">
                    <View className="flex-row items-center space-x-2">
                        <UserPlus size={22} color={themeColors.tint} strokeWidth={2} />
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">
                            Emergency Contact
                        </Text>
                    </View>

                    <View className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 space-y-4">

                        {/* Name */}
                        <View className="space-y-2">
                            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Name</Text>
                            <View className="flex-row items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3">
                                <User size={18} color={themeColors.tabIconDefault} className="mr-3" />
                                <TextInput
                                    className="flex-1 text-base text-gray-900 dark:text-white"
                                    placeholder="Full Name"
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    value={formData.emergencyContact?.name}
                                    onChangeText={(text) => handleEmergencyUpdate('name', text)}
                                />
                            </View>
                        </View>

                        {/* Relationship */}
                        <View className="space-y-2">
                            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Relationship</Text>
                            <View className="flex-row items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3">
                                <User size={18} color={themeColors.tabIconDefault} className="mr-3" />
                                <TextInput
                                    className="flex-1 text-base text-gray-900 dark:text-white"
                                    placeholder="e.g. Spouse, Parent"
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    value={formData.emergencyContact?.relationship}
                                    onChangeText={(text) => handleEmergencyUpdate('relationship', text)}
                                />
                            </View>
                        </View>

                        {/* Phone */}
                        <View className="space-y-2">
                            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Phone Number</Text>
                            <View className="flex-row items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3">
                                <Phone size={18} color={themeColors.tabIconDefault} className="mr-3" />
                                <TextInput
                                    className="flex-1 text-base text-gray-900 dark:text-white"
                                    placeholder="555-123-4567"
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    value={formData.emergencyContact?.phoneNumber}
                                    onChangeText={(text) => handleEmergencyUpdate('phoneNumber', text)}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                    </View>
                </View>

                {/* Section 2: Remarks */}
                <View className="space-y-4">
                    <View className="flex-row items-center space-x-2">
                        <FileText size={22} color={themeColors.tint} strokeWidth={2} />
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">
                            Member Remarks
                        </Text>
                    </View>

                    <View className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                        <TextInput
                            className="flex-1 text-base text-gray-900 dark:text-white min-h-[120px]"
                            placeholder="Add any additional context for your chain of command here..."
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
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
