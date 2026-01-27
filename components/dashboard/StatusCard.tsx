import { Calendar } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface StatusCardProps {
    nextCycle: string;
    daysUntilOpen: number;
}

export function StatusCard({ nextCycle, daysUntilOpen }: StatusCardProps) {
    return (
        <View className="flex flex-col gap-2">
            <View className="bg-blue-50 border-l-4 border-blue-600 pl-3 pr-2 py-2.5 rounded-r-lg shadow-sm flex-row items-start justify-between">
                <View className="flex-row items-center gap-2.5">
                    <Calendar size={16} className="text-blue-600" color="#2563EB" />
                    <View>
                        <Text className="text-blue-900 text-xs font-bold leading-none mb-0.5">Cycle Closed</Text>
                        <Text className="text-blue-700 text-[10px] leading-tight">
                            {nextCycle} opens in <Text className="font-bold">{daysUntilOpen} days</Text>.
                        </Text>
                    </View>
                </View>
                <Text className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full overflow-hidden">
                    Prep Mode
                </Text>
            </View>
        </View>
    );
}
