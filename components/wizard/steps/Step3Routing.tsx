import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import * as Haptics from 'expo-haptics';
import { Briefcase, Building2, Phone } from 'lucide-react-native';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';

interface Step3RoutingProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
    embedded?: boolean;
}

export function Step3Routing({ formData, onUpdate, embedded = false }: Step3RoutingProps) {
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
        <WizardCard title="Command Coverage" scrollable={!embedded}>
            <View className="gap-6">

                {/* Group 1: Duty Info */}
                <View className="gap-3">
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                        DUTY INFORMATION
                    </Text>
                    <View className="bg-inputBackground rounded-2xl p-4 border border-slate-200 dark:border-slate-700 gap-4">

                        {/* Duty Section */}
                        <View className="flex-row items-center border-b border-gray-200 dark:border-slate-700 pb-2">
                            <Briefcase size={20} color={themeColors.tint} className="mr-3" strokeWidth={2} />
                            <TextInput
                                className="flex-1 text-base text-labelPrimary dark:text-white"
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
                                className="flex-1 text-base text-labelPrimary dark:text-white"
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
                                className="flex-1 text-base text-labelPrimary dark:text-white"
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
                    <View className="bg-inputBackground rounded-2xl p-2 border border-slate-200 dark:border-slate-700 flex-row">
                        {RATION_OPTIONS.map((option) => {
                            const isSelected = formData.rationStatus === option.id;
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    onPress={() => {
                                        Haptics.selectionAsync().catch(() => {
                                            // Ignore haptics error
                                        });
                                        onUpdate('rationStatus', option.id);
                                    }}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 12, // py-3
                                        paddingHorizontal: 8, // px-2
                                        borderRadius: 12, // rounded-xl
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isSelected ? (isDark ? '#334155' : 'white') : 'transparent',
                                        shadowColor: isSelected ? '#000' : undefined,
                                        shadowOffset: isSelected ? { width: 0, height: 1 } : undefined,
                                        shadowOpacity: isSelected ? 0.05 : undefined,
                                        elevation: isSelected ? 1 : undefined,
                                    }}
                                >
                                    <Text className={`font-medium ${isSelected
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {option.label}
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
