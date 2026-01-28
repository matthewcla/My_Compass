import Colors from '@/constants/Colors';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { FileText, Wallet } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, TextInput, View, useColorScheme } from 'react-native';

const LEAVE_TYPES = [
    { id: 'annual', label: 'Annual' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'convalescent', label: 'Convalescent' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'parental', label: 'Parental' },
    { id: 'bereavement', label: 'Bereavement' },
    { id: 'adoption', label: 'Adoption' },
    { id: 'ptdy', label: 'PTDY' },
    { id: 'other', label: 'Other' },
] as const;

interface Step3RoutingProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
}

export function Step3Routing({ formData, onUpdate }: Step3RoutingProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    // Read balance from store
    const leaveBalance = useLeaveStore((state) => state.leaveBalance);

    // Mock balance if not fetched (though hydration should ensure it)
    const displayBalance = leaveBalance ? leaveBalance.currentBalance : '--';
    const displayUseOrLose = leaveBalance ? leaveBalance.useOrLoseDays : '--';
    const displayProjected = leaveBalance ? leaveBalance.projectedEndOfYearBalance : '--';

    return (
        <View className="space-y-8">

            {/* 1. Context: Leave Balance Card */}
            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50">
                <View className="flex-row items-center mb-4">
                    <View className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
                        <Wallet size={20} color={themeColors.systemBlue} strokeWidth={2} />
                    </View>
                    <View>
                        <Text className="text-xs text-blue-800 dark:text-blue-300 font-bold uppercase tracking-wider">Available Balance</Text>
                        <Text className="text-2xl font-bold text-blue-900 dark:text-blue-100">{displayBalance} Days</Text>
                    </View>
                </View>

                <View className="flex-row justify-between pt-4 border-t border-blue-200 dark:border-blue-800">
                    <View>
                        <Text className="text-xs text-blue-700 dark:text-blue-400 mb-1">Use or Lose</Text>
                        <Text className="text-base font-semibold text-blue-900 dark:text-blue-200">{displayUseOrLose} Days</Text>
                    </View>
                    <View>
                        <Text className="text-xs text-blue-700 dark:text-blue-400 mb-1">Proj. End FY</Text>
                        <Text className="text-base font-semibold text-blue-900 dark:text-blue-200">{displayProjected} Days</Text>
                    </View>
                </View>
            </View>

            {/* 2. Leave Type (Moved from Step 2) */}
            <View>
                <Text className="text-lg font-bold text-labelPrimary mb-4">Request Details</Text>
                <Text className="text-sm font-medium text-labelSecondary mb-2">Leave Type</Text>
                <View className="flex-row flex-wrap gap-2">
                    {LEAVE_TYPES.map((type) => (
                        <Pressable
                            key={type.id}
                            onPress={() => onUpdate('leaveType', type.id)}
                            className={`px-4 py-2 rounded-full border ${formData.leaveType === type.id
                                ? 'bg-systemBlue border-systemBlue'
                                : 'bg-systemBackground border-systemGray6'
                                }`}
                        >
                            <Text
                                className={`${formData.leaveType === type.id ? 'text-white' : 'text-labelSecondary'
                                    } font-medium`}
                            >
                                {type.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* 3. Remarks */}
            <View>
                <Text className="text-sm font-medium text-labelSecondary mb-1">Member Remarks</Text>
                <View className="flex-row items-start bg-systemGray6 rounded-xl px-4 py-3 border border-systemGray6">
                    <FileText size={20} color={themeColors.labelSecondary} className="mr-3 mt-1" strokeWidth={1.5} />
                    <TextInput
                        className="flex-1 text-base text-labelPrimary min-h-[80px]"
                        placeholder="Optional remarks (e.g. 'Visiting family')"
                        value={formData.memberRemarks}
                        onChangeText={(text) => onUpdate('memberRemarks', text)}
                        multiline
                        textAlignVertical="top"
                    />
                </View>
            </View>
        </View>
    );
}
