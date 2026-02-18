import { ScalePressable } from '@/components/ScalePressable';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { SwipeDecision } from '@/types/schema';
import { Compass } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface DiscoveryEntryWidgetProps {
    onPress?: () => void;
}

export default function DiscoveryEntryWidget({ onPress }: DiscoveryEntryWidgetProps) {
    const { realDecisions } = useAssignmentStore();

    // Logic: Calculate Start Count (Like + Super)
    const savedCount = Object.values(realDecisions).filter(
        (decision: SwipeDecision) => decision === 'like' || decision === 'super'
    ).length;

    return (
        <ScalePressable onPress={onPress}>
            <View className="bg-indigo-600 rounded-2xl p-5 shadow-md overflow-hidden relative h-40 justify-between">

                {/* Background Decorative Icon */}
                <View className="absolute -right-10 -bottom-10 opacity-20">
                    {/* Large, semi-transparent Compass Icon (text-indigo-400) */}
                    <Compass size={120} color="#818cf8" />
                </View>

                {/* Content */}
                <View>
                    <Text className="text-xl font-bold text-white">Billet Explorer</Text>
                    <Text className="text-indigo-100 text-sm mt-1">Explore opportunities & build your career.</Text>
                </View>

                {/* Footer Pill */}
                {savedCount > 0 && (
                    <View className="self-start bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-semibold">
                            {savedCount} Saved Billets
                        </Text>
                    </View>
                )}
            </View>
        </ScalePressable>
    );
}
