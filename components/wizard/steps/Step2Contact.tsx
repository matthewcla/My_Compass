import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import { Bus, Car, MapPin, Phone, Plane, Train } from 'lucide-react-native';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';

interface Step2ContactProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
}

export function Step2Contact({ formData, onUpdate }: Step2ContactProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const handleTextChange = (field: keyof CreateLeaveRequestPayload, value: string) => {
        onUpdate(field, value);
    };

    const MODES = [
        { id: 'Air', label: 'Air', icon: Plane },
        { id: 'Car', label: 'Car', icon: Car },
        { id: 'Train', label: 'Train', icon: Train },
        { id: 'Bus', label: 'Bus', icon: Bus },
    ];

    return (
        <WizardCard title="Location & Travel">
            <View className="space-y-6">

                {/* 1. Leave Address */}
                <View className="space-y-3">
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                        LEAVE ADDRESS
                    </Text>
                    <View className="flex-row items-start bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                        <MapPin
                            size={20}
                            color={themeColors.tint}
                            className="mr-3 mt-1"
                            strokeWidth={2}
                        />
                        <TextInput
                            className="flex-1 text-base text-gray-900 dark:text-white min-h-[80px]"
                            placeholder="Full address where you can be reached..."
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={formData.leaveAddress}
                            onChangeText={(text) => handleTextChange('leaveAddress', text)}
                            multiline
                            textAlignVertical="top"
                            autoCapitalize="words"
                        />
                    </View>
                </View>

                {/* 2. Leave Phone */}
                <View className="space-y-3">
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                        LEAVE PHONE NUMBER
                    </Text>
                    <View className="flex-row items-center bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                        <Phone
                            size={20}
                            color={themeColors.tint}
                            className="mr-3"
                            strokeWidth={2}
                        />
                        <TextInput
                            className="flex-1 text-base text-gray-900 dark:text-white"
                            placeholder="555-123-4567"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={formData.leavePhoneNumber}
                            onChangeText={(text) => handleTextChange('leavePhoneNumber', text)}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* 3. Mode of Travel */}
                <View className="space-y-3">
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                        MODE OF TRAVEL
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                        {MODES.map((mode) => {
                            const isSelected = formData.modeOfTravel === mode.id;
                            const Icon = mode.icon;

                            return (
                                <TouchableOpacity
                                    key={mode.id}
                                    onPress={() => onUpdate('modeOfTravel', mode.id)}
                                    className={`flex-1 min-w-[45%] flex-row items-center justify-center py-4 px-3 rounded-xl border ${isSelected
                                            ? 'bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-500'
                                            : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-gray-700'
                                        }`}
                                >
                                    <Icon
                                        size={18}
                                        color={isSelected ? 'white' : (isDark ? '#94a3b8' : '#64748b')}
                                        strokeWidth={2}
                                    />
                                    <Text
                                        className={`ml-2 font-medium ${isSelected
                                                ? 'text-white'
                                                : 'text-gray-600 dark:text-slate-300'
                                            }`}
                                    >
                                        {mode.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

            </View>
        </WizardCard>
    );
}
