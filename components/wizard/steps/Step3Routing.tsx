import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import * as Haptics from 'expo-haptics';
import { Briefcase, Building2, Phone } from 'lucide-react-native';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

interface Step3RoutingProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: unknown) => void;
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
                    <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                        DUTY INFORMATION
                    </Text>
                    <View className="bg-surface-container rounded-none p-4 border border-outline-variant gap-4">

                        {/* Duty Section */}
                        <View className="flex-row items-center border-b border-outline-variant py-2 gap-3">
                            <Briefcase size={20} color={isDark ? '#338EF7' : '#000A23'} className="text-primary" strokeWidth={2} />
                            <TextInput
                                className="flex-1 text-base text-on-surface"
                                placeholder="Duty Section (e.g. N1 Admin)"
                                placeholderTextColor={isDark ? '#C4C6D0' : '#44474F'}
                                value={formData.dutySection}
                                onChangeText={(text) => handleTextChange('dutySection', text)}
                            />
                        </View>

                        {/* Dept/Div */}
                        <View className="flex-row items-center border-b border-outline-variant py-2 gap-3">
                            <Building2 size={20} color={isDark ? '#338EF7' : '#000A23'} className="text-primary" strokeWidth={2} />
                            <TextInput
                                className="flex-1 text-base text-on-surface"
                                placeholder="Dept / Div"
                                placeholderTextColor={isDark ? '#C4C6D0' : '#44474F'}
                                value={formData.deptDiv}
                                onChangeText={(text) => handleTextChange('deptDiv', text)}
                            />
                        </View>

                        {/* Duty Phone */}
                        <View className="flex-row items-center py-2 gap-3">
                            <Phone size={20} color={isDark ? '#338EF7' : '#000A23'} className="text-primary" strokeWidth={2} />
                            <TextInput
                                className="flex-1 text-base text-on-surface"
                                placeholder="Duty Phone"
                                placeholderTextColor={isDark ? '#C4C6D0' : '#44474F'}
                                value={formData.dutyPhone}
                                onChangeText={(text) => handleTextChange('dutyPhone', text)}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                </View>

                {/* Group 2: Ration Status */}
                <View className="gap-3">
                    <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                        RATION STATUS
                    </Text>
                    <View className="bg-surface-container rounded-none p-2 border border-outline-variant flex-row">
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
                                    className={`flex-1 py-3 px-2 rounded-none items-center justify-center ${isSelected ? 'bg-primary-container' : 'bg-transparent'}`}
                                >
                                    <Text className={`font-bold ${isSelected
                                        ? 'text-on-primary-container'
                                        : 'text-on-surface-variant'
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
