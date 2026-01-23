import { useUserDisplayName, useUserRank } from '@/store/useUserStore';
import { Compass, User as UserIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

/**
 * WebHeader Component
 * 
 * Top navigation bar for the web interface.
 * Displays the App Logo/Title on the left and User Profile summary on the right.
 */
export function WebHeader() {
    const rank = useUserRank();
    const displayName = useUserDisplayName();

    return (
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
            {/* Left: App Identity */}
            <View className="flex-row items-center gap-2">
                <Compass size={24} color="#000" strokeWidth={1.5} />
                <Text className="text-xl font-bold text-gray-900">My Compass</Text>
            </View>

            {/* Right: User Profile */}
            <Pressable
                className="flex-row items-center gap-3 p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
                onPress={() => {
                    console.log('Navigate to profile');
                    // Future: router.push('/profile')
                }}
            >
                <View className="items-end">
                    <Text className="text-sm font-medium text-gray-900">{rank || 'Unknown Rank'}</Text>
                    <Text className="text-xs text-gray-500">{displayName || 'Guest'}</Text>
                </View>
                <View className="h-10 w-10 rounded-full bg-gray-200 items-center justify-center">
                    <UserIcon size={20} color="#6B7280" strokeWidth={1.5} />
                </View>
            </Pressable>
        </View>
    );
}
