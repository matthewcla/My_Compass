import React from 'react';
import { View } from 'react-native';
import { Skeleton } from './Skeleton';

export function JobCardSkeleton() {
    return (
        <View className="bg-white dark:bg-systemGray6 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 my-2">
            {/* Header: Title + Location + Match */}
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                    {/* Title */}
                    <Skeleton width="70%" height={24} borderRadius={4} style={{ marginBottom: 8 }} />
                    {/* Location */}
                    <Skeleton width="40%" height={16} borderRadius={4} />
                </View>

                {/* Match Indicator Badge Placeholder */}
                <Skeleton width={80} height={24} borderRadius={6} />
            </View>

            {/* Narrative Box */}
            <View className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mb-4 h-20">
                {/* Simulate lines of text */}
                <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width="90%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width="60%" height={14} borderRadius={4} />
            </View>

            {/* Footer: Buy-It-Now Button */}
            <Skeleton width="100%" height={48} borderRadius={8} />
        </View>
    );
}
