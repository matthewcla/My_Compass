import { ScalePressable } from '@/components/ScalePressable';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface SlateSummaryWidgetProps {
    onPress?: () => void;
}

export default function SlateSummaryWidget({ onPress }: SlateSummaryWidgetProps) {
    const { applications, slateDeadline, userApplicationIds } = useAssignmentStore();

    // Logic: Calculate Filled Slots based on userApplicationIds
    const filledCount = userApplicationIds.length;

    // Logic: Calculate Counts based on status
    let draftCount = 0;
    let submittedCount = 0;
    Object.values(applications).forEach(app => {
        if (app.status === 'draft') {
            draftCount++;
        } else if (['submitted', 'confirmed'].includes(app.status)) {
            submittedCount++;
        }
    });

    const totalSlots = 7;

    // Logic: Calculate Time Remaining
    const now = new Date();
    const deadline = new Date(slateDeadline);
    const diffMs = deadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));

    let timeLabel = '';
    let isUrgent = false;

    if (diffMs <= 0) {
        timeLabel = 'Closed';
        isUrgent = false;
    } else if (hoursRemaining < 48) {
        timeLabel = `${hoursRemaining}h Left`;
        isUrgent = true;
    } else {
        timeLabel = `${daysRemaining}d Left`;
        isUrgent = false;
    }

    return (
        <ScalePressable onPress={onPress}>
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                {/* Header: Title + Cycle Status Pill */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white">MY SLATE</Text>
                    {timeLabel !== 'Closed' && (
                        <View className={`px-2 py-1 rounded-full ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            <Text className={`text-xs font-semibold ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                {timeLabel}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Visuals: The Slots */}
                <View className="flex-row items-center space-x-2 mb-6">
                    {Array.from({ length: totalSlots }).map((_, index) => {
                        const isFilled = index < filledCount;
                        // Solid Blue circle (bg-blue-600) vs Empty Gray ring (border-2 border-slate-200)
                        return (
                            <View
                                key={index}
                                className={`w-3 h-3 rounded-full ${isFilled
                                    ? 'bg-blue-600'
                                    : 'border-2 border-slate-200 dark:border-slate-700'
                                    }`}
                            />
                        );
                    })}
                </View>

                {/* Footer: Text Summary + Chevron */}
                <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {draftCount} Drafts • {submittedCount} Submitted
                    </Text>
                    <ChevronRight size={20} color="#94a3b8" />
                </View>
            </View>
        </ScalePressable>
    );
}
