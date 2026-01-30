
import Colors from '@/constants/Colors';
import { Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

export interface VerificationChecks {
    hasSufficientBalance: boolean;
    understandsReportingTime: boolean;
    verifiedDates: boolean;
}

interface Step4ChecklistProps {
    checks: VerificationChecks;
    onToggle: (key: keyof VerificationChecks) => void;
}

export function Step4Checklist({ checks, onToggle }: Step4ChecklistProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    const renderCheckbox = (label: string, key: keyof VerificationChecks) => {
        const isChecked = checks[key];
        return (
            <Pressable
                onPress={() => onToggle(key)}
                className={`flex-row items-center p-4 rounded-xl border mb-3 active:opacity-80 transition-all ${isChecked
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                    : 'bg-systemGray6 border-transparent'
                    }`}
            >
                <View
                    className={`h-6 w-6 rounded-md border items-center justify-center mr-3 ${isChecked
                        ? 'bg-systemBlue border-systemBlue'
                        : 'bg-transparent border-labelSecondary'
                        }`}
                >
                    {isChecked && <Check size={14} color="white" strokeWidth={3} />}
                </View>
                <Text
                    className={`text-sm font-medium flex-1 ${isChecked ? 'text-blue-900 dark:text-blue-100' : 'text-labelPrimary'
                        }`}
                >
                    {label}
                </Text>
            </Pressable>
        );
    };

    return (
        <View className="mt-6">
            <View className="flex-row items-center mb-4">
                <Text className="text-lg font-bold text-labelPrimary">Pre-Departure Verification</Text>
            </View>

            <View>
                {renderCheckbox("I verify I have sufficient leave balance.", 'hasSufficientBalance')}
                {renderCheckbox("I understand I must report by 0730 on return date.", 'understandsReportingTime')}
                {renderCheckbox("I have verified my travel dates.", 'verifiedDates')}
            </View>
        </View>
    );
}
