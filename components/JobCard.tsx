import { ApplicationStatus, Billet } from '@/types/schema';
import { MapPin } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { ScalePressable } from './ScalePressable';

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
    const colorScheme = useColorScheme();
    const iconColor = colorScheme === 'dark' ? '#9ca3af' : '#6b7280';

    // 1. Determine Match Score Logic
    const matchScore = billet.compass.matchScore;
    let matchColorClass = 'text-gray-500';
    let matchBgClass = 'bg-gray-100';

    if (matchScore >= 80) {
        matchColorClass = 'text-green-700 dark:text-green-300';
        matchBgClass = 'bg-green-100 dark:bg-green-900/40';
    } else if (matchScore >= 50) {
        matchColorClass = 'text-yellow-700 dark:text-yellow-300';
        matchBgClass = 'bg-yellow-100 dark:bg-yellow-900/40';
    }

    // 2. Determine Button State Logic
    // 2. Determine Button State Logic
    let buttonText = 'Buy It Now';
    let buttonBgClass = 'bg-navyBlue';
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
        <ScalePressable
            className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl shadow-apple-md android:elevation-4 border border-black/5 dark:border-white/10"
            // @ts-ignore - Web-specific style to remove focus ring
            style={Platform.OS === 'web' ? { outlineStyle: 'none' } : undefined}
        >
            {/* Header: Title + Location */}
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                        {billet.title}
                    </Text>
                    <View className="flex-row items-start mt-1">
                        <MapPin size={14} color={iconColor} style={{ marginTop: 3, marginRight: 4 }} />
                        <Text className="text-sm text-gray-500 dark:text-gray-400 flex-1">
                            {billet.location}
                        </Text>
                    </View>
                </View>

                {/* Match Indicator Badge using Reanimated */}
                <Animated.View
                    entering={FadeInRight.delay(200).springify().damping(12)}
                    className={`px-2 py-1 rounded-md ${matchBgClass}`}
                >
                    <Text className={`font-bold text-xs ${matchColorClass}`}>
                        {matchScore}% Match
                    </Text>
                </Animated.View>
            </View>

            {/* Narrative Box */}
            <View className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mb-4">
                <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5" testID="compass-narrative">
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
        </ScalePressable>
    );
}
