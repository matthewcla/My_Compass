
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import { MapPin, Phone, User } from 'lucide-react-native';
import React from 'react';
import { Text, TextInput, View, useColorScheme } from 'react-native';

// LEAVE_TYPES moved to Step3Routing

interface Step2ContactProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
    onUpdateEmergency: (field: keyof CreateLeaveRequestPayload['emergencyContact'], value: string) => void;
}

export function Step2Contact({ formData, onUpdate, onUpdateEmergency }: Step2ContactProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    const handleTextChange = (field: keyof CreateLeaveRequestPayload, value: string) => {
        // PII Safety: Logs are sanitized by default via utils/logger if we log.
        // But explicitly ensuring we don't log raw here.
        // User requirement: ZERO console.log of these values.
        onUpdate(field, value);
    };

    return (
        <View className="space-y-8">
            {/* 1. Leave Type */}
            {/* 1. Leave Type Removed - Moved to Step 3 */}

            {/* 2. Contact Details */}
            <View className="space-y-4">
                <Text className="text-lg font-bold text-labelPrimary">Contact Details</Text>

                {/* Address */}
                <View>
                    <Text className="text-sm font-medium text-labelSecondary mb-1">Leave Address</Text>
                    <View className="flex-row items-start bg-systemGray6 rounded-xl px-4 py-3 border border-systemGray6">
                        <MapPin size={20} color={themeColors.labelSecondary} className="mr-3 mt-1" strokeWidth={1.5} />
                        <TextInput
                            className="flex-1 text-base text-labelPrimary min-h-[60px]"
                            placeholder="123 Beach St, Honolulu, HI"
                            value={formData.leaveAddress}
                            onChangeText={(text) => handleTextChange('leaveAddress', text)}
                            multiline
                            textAlignVertical="top"
                            // PII: Explicitly false per requirements
                            secureTextEntry={false}
                        />
                    </View>
                </View>

                {/* Phone */}
                <View>
                    <Text className="text-sm font-medium text-labelSecondary mb-1">Leave Phone Number</Text>
                    <View className="flex-row items-center bg-systemGray6 rounded-xl px-4 py-3 border border-systemGray6">
                        <Phone size={20} color={themeColors.labelSecondary} className="mr-3" strokeWidth={1.5} />
                        <TextInput
                            className="flex-1 text-base text-labelPrimary"
                            placeholder="555-123-4567"
                            value={formData.leavePhoneNumber}
                            onChangeText={(text) => handleTextChange('leavePhoneNumber', text)}
                            keyboardType="phone-pad"
                            secureTextEntry={false}
                        />
                    </View>
                </View>
            </View>

            {/* 3. Emergency Contact */}
            <View className="space-y-4">
                <Text className="text-lg font-bold text-labelPrimary">Emergency Contact</Text>
                <Text className="text-labelSecondary text-sm -mt-2">
                    Who should we contact in case of an emergency?
                </Text>

                <View>
                    <Text className="text-sm font-medium text-labelSecondary mb-1">Name</Text>
                    <View className="flex-row items-center bg-systemGray6 rounded-xl px-4 py-3 border border-systemGray6">
                        <User size={20} color={themeColors.labelSecondary} className="mr-3" strokeWidth={1.5} />
                        <TextInput
                            className="flex-1 text-base text-labelPrimary"
                            placeholder="Jane Doe"
                            value={formData.emergencyContact?.name}
                            onChangeText={(text) => onUpdateEmergency('name', text)}
                            secureTextEntry={false}
                        />
                    </View>
                </View>

                <View>
                    <Text className="text-sm font-medium text-labelSecondary mb-1">Relationship</Text>
                    <View className="flex-row items-center bg-systemGray6 rounded-xl px-4 py-3 border border-systemGray6">
                        <User size={20} color={themeColors.labelSecondary} className="mr-3" strokeWidth={1.5} />
                        <TextInput
                            className="flex-1 text-base text-labelPrimary"
                            placeholder="Spouse, Parent, etc."
                            value={formData.emergencyContact?.relationship}
                            onChangeText={(text) => onUpdateEmergency('relationship', text)}
                            secureTextEntry={false}
                        />
                    </View>
                </View>

                <View>
                    <Text className="text-sm font-medium text-labelSecondary mb-1">Emergency Phone</Text>
                    <View className="flex-row items-center bg-systemGray6 rounded-xl px-4 py-3 border border-systemGray6">
                        <Phone size={20} color={themeColors.labelSecondary} className="mr-3" strokeWidth={1.5} />
                        <TextInput
                            className="flex-1 text-base text-labelPrimary"
                            placeholder="555-987-6543"
                            value={formData.emergencyContact?.phoneNumber}
                            onChangeText={(text) => onUpdateEmergency('phoneNumber', text)}
                            keyboardType="phone-pad"
                            secureTextEntry={false}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}
