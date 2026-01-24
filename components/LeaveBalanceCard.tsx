import React from 'react';
import { Text, View } from 'react-native';

interface LeaveBalanceCardProps {
    daysAvailable: number;
    useOrLose: number;
    projectedBalance: number;
}

export function LeaveBalanceCard({
    daysAvailable,
    useOrLose,
    projectedBalance
}: LeaveBalanceCardProps) {
    return (
        <View className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 mb-4 border border-gray-100 dark:border-slate-800">
            <View className="mb-2">
                <Text className="text-gray-500 dark:text-slate-100 text-sm font-medium uppercase tracking-wider">
                    Days Available
                </Text>
                <Text className="text-4xl font-bold text-slate-900 dark:text-white mt-1">
                    {daysAvailable.toFixed(1)}
                </Text>
            </View>

            <View className="flex-row justify-between mt-4">
                <View>
                    <Text className="text-gray-400 dark:text-slate-100 text-xs font-medium uppercase tracking-wider mb-1">
                        Use or Lose
                    </Text>
                    <Text
                        className={`text-lg font-semibold ${useOrLose > 0 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'
                            }`}
                    >
                        {useOrLose.toFixed(1)}
                    </Text>
                </View>

                <View>
                    <Text className="text-gray-400 dark:text-slate-100 text-xs font-medium uppercase tracking-wider mb-1 text-right">
                        Projected
                    </Text>
                    <Text className="text-lg font-semibold text-slate-400 dark:text-slate-500 text-right">
                        {projectedBalance.toFixed(1)}
                    </Text>
                </View>
            </View>
        </View>
    );
}
