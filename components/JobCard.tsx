import { ApplicationStatus, Billet } from '@/types/schema';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface JobCardProps {
    billet: Billet;
    onBuyPress: (id: string) => void;
    isProcessing: boolean;
    applicationStatus: ApplicationStatus | undefined;
}

export function JobCard({
    billet,
    onBuyPress,
    isProcessing,
    applicationStatus,
}: JobCardProps) {
    // 1. Determine Match Score Logic
    const matchScore = billet.compass.matchScore;
    let matchColorClass = 'text-gray-500';
    let matchBgClass = 'bg-gray-100';

    if (matchScore >= 80) {
        matchColorClass = 'text-green-700';
        matchBgClass = 'bg-green-100';
    } else if (matchScore >= 50) {
        matchColorClass = 'text-yellow-700';
        matchBgClass = 'bg-yellow-100';
    }

    // 2. Determine Button State Logic
    let buttonText = 'Buy It Now';
    let buttonBgClass = 'bg-blue-600';
    let isDisabled = false;

    if (isProcessing || applicationStatus === 'optimistically_locked') {
        buttonText = 'Processing...';
        buttonBgClass = 'bg-gray-400';
        isDisabled = true;
    } else if (applicationStatus === 'confirmed') {
        buttonText = 'Locked';
        buttonBgClass = 'bg-green-600';
        isDisabled = true;
    } else if (applicationStatus === 'rejected_race_condition') {
        buttonText = 'Unavailable';
        buttonBgClass = 'bg-red-600';
        isDisabled = true; // Or allow retry? Usually unavailable means lost race.
    } else if (applicationStatus === 'submitted') {
        buttonText = 'Pending Confirmation...';
        buttonBgClass = 'bg-blue-400';
        isDisabled = true;
    }

    return (
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 my-2">
            {/* Header: Title + Location */}
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                    <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                        {billet.title}
                    </Text>
                    <Text className="text-sm text-gray-500">{billet.location}</Text>
                </View>

                {/* Match Indicator Badge */}
                <View className={`px-2 py-1 rounded-md ${matchBgClass}`}>
                    <Text className={`font-bold text-xs ${matchColorClass}`}>
                        {matchScore}% Match
                    </Text>
                </View>
            </View>

            {/* Narrative Box */}
            <View className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                <Text className="text-gray-600 text-sm leading-5" testID="compass-narrative">
                    {billet.compass.contextualNarrative}
                </Text>
            </View>

            {/* Footer: Buy-It-Now Button */}
            <Pressable
                onPress={() => onBuyPress(billet.id)}
                disabled={isDisabled}
                className={`py-3 rounded-lg flex-row justify-center items-center active:opacity-90 ${buttonBgClass}`}
            >
                <Text className="text-white font-bold text-base">{buttonText}</Text>
            </Pressable>
        </View>
    );
}
