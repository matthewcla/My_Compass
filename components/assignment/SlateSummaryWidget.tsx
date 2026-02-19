import { ScalePressable } from '@/components/ScalePressable';
import { MAX_SLATE_SIZE, useAssignmentStore } from '@/store/useAssignmentStore';
import { useDemoStore } from '@/store/useDemoStore';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface SlateSummaryWidgetProps {
    onPress?: () => void;
}

const SLOT_INDICES = Array.from({ length: MAX_SLATE_SIZE }, (_, i) => i);

export default function SlateSummaryWidget({ onPress }: SlateSummaryWidgetProps) {
    const { applications, slateDeadline, userApplicationIds, submitSlate } = useAssignmentStore();

    const isDemoMode = useDemoStore((s) => s.isDemoMode);
    const negotiationDetails = useDemoStore((s) => s.negotiationDetails);

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

    // Logic: Calculate Time Remaining
    // In demo mode, use negotiation windowCloseDate to match StatusCard
    const now = new Date();
    const deadlineStr = (isDemoMode && negotiationDetails?.windowCloseDate)
        ? negotiationDetails.windowCloseDate
        : slateDeadline;
    const deadline = new Date(deadlineStr);
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

    const canSubmit = draftCount > 0 && submittedCount === 0;
    const allSubmitted = filledCount > 0 && draftCount === 0 && submittedCount > 0;

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
                <View className="flex-row items-center space-x-2 mb-4">
                    {SLOT_INDICES.map((index) => {
                        const isFilled = index < filledCount;
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

                {/* Submit CTA or Confirmation */}
                {canSubmit && (
                    <TouchableOpacity
                        onPress={submitSlate}
                        className="bg-orange-600 dark:bg-orange-700 mt-4 py-3 rounded-xl"
                        style={{ minHeight: 44 }}
                    >
                        <Text className="text-white text-center font-bold text-sm tracking-wide">
                            Submit Slate
                        </Text>
                    </TouchableOpacity>
                )}
                {allSubmitted && (
                    <View className="bg-green-50 dark:bg-green-900/20 mt-4 py-2.5 rounded-xl border border-green-200 dark:border-green-800">
                        <Text className="text-green-700 dark:text-green-400 text-center text-sm font-semibold">
                            ✅ Slate Submitted
                        </Text>
                    </View>
                )}
            </View>
        </ScalePressable>
    );
}
