import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import * as Haptics from 'expo-haptics';
import { Briefcase, Building2, Phone } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, TextInput, View, useColorScheme } from 'react-native';

interface Step3RoutingProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
}

export function Step3Routing({ formData, onUpdate }: Step3RoutingProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const handleTextChange = (field: keyof CreateLeaveRequestPayload, value: string) => {
        onUpdate(field, value);
    };

    const RATION_OPTIONS = [
        { id: 'commuted', label: 'Commuted' },
        { id: 'in_kind', label: 'In-Kind' },
        { id: 'not_applicable', label: 'N/A' },
    ];

    return (
        <WizardCard title="Command Coverage">
            <View className="gap-6">

                {/* Group 1: Duty Info */}
                <View className="gap-3">
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                        DUTY INFORMATION
                    </Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 gap-4">

                        {/* Duty Section */}
                        <View className="flex-row items-center border-b border-gray-200 dark:border-slate-700 pb-2">
                            <Briefcase size={20} color={themeColors.tint} className="mr-3" strokeWidth={2} />
                            <TextInput
                                className="flex-1 text-base text-gray-900 dark:text-white"
                                placeholder="Duty Section (e.g. N1 Admin)"
                                placeholderTextColor={Colors.gray[500]}
                                value={formData.dutySection}
                                onChangeText={(text) => handleTextChange('dutySection', text)}
                            />
                        </View>

                        {/* Dept/Div */}
                        <View className="flex-row items-center border-b border-gray-200 dark:border-slate-700 pb-2">
                            <Building2 size={20} color={themeColors.tint} className="mr-3" strokeWidth={2} />
                            <TextInput
                                className="flex-1 text-base text-gray-900 dark:text-white"
                                placeholder="Dept / Div"
                                placeholderTextColor={Colors.gray[500]}
                                value={formData.deptDiv}
                                onChangeText={(text) => handleTextChange('deptDiv', text)}
                            />
                        </View>

                        {/* Duty Phone */}
                        <View className="flex-row items-center">
                            <Phone size={20} color={themeColors.tint} className="mr-3" strokeWidth={2} />
                            <TextInput
                                className="flex-1 text-base text-gray-900 dark:text-white"
                                placeholder="Duty Phone"
                                placeholderTextColor={Colors.gray[500]}
                                value={formData.dutyPhone}
                                onChangeText={(text) => handleTextChange('dutyPhone', text)}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                </View>

                {/* Group 2: Ration Status */}
                <View className="gap-3">
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                        RATION STATUS
                    </Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-2 border border-slate-100 dark:border-slate-700 flex-row">
                        {RATION_OPTIONS.map((option) => {
                            const isSelected = formData.rationStatus === option.id;
                            return (
                                <Pressable
                                    key={option.id}
                                    onPress={() => {
                                        Haptics.selectionAsync().catch(() => {
                                            // Ignore haptics error
                                        });
                                        onUpdate('rationStatus', option.id);
                                    }}
                                    className={`flex-1 py-3 px-2 rounded-xl items-center justify-center ${isSelected
                                        ? 'bg-white dark:bg-slate-700'
                                        : 'bg-transparent'
                                        }`}
                                >
                                    <Text className={`font-medium ${isSelected
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

            </View>
        </WizardCard>
    );
}
