import { ScalePressable } from '@/components/ScalePressable';
import { useColorScheme } from '@/components/useColorScheme';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { SwipeDecision } from '@/types/schema';
import { getShadow } from '@/utils/getShadow';
import { LinearGradient } from 'expo-linear-gradient';
import { Compass } from 'lucide-react-native';
import React from 'react';
import { Platform, Text, View } from 'react-native';

interface DiscoveryEntryWidgetProps {
    onPress?: () => void;
}

export default function DiscoveryEntryWidget({ onPress }: DiscoveryEntryWidgetProps) {
    const { realDecisions } = useAssignmentStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Logic: Calculate Start Count (Like + Super)
    const savedCount = Object.values(realDecisions).filter(
        (decision: SwipeDecision) => decision === 'like' || decision === 'super'
    ).length;

    return (
        <ScalePressable onPress={onPress}>
            <View
                style={Platform.OS !== 'web' ? getShadow({
                    shadowColor: isDark ? '#4f46e5' : '#4338ca',
                    shadowOpacity: isDark ? 0.3 : 0.2,
                    shadowRadius: 16,
                    elevation: 8,
                }) : {}}
            >
                <View className="rounded-2xl overflow-hidden h-40 border border-indigo-400/20 dark:border-indigo-400/10">
                    <LinearGradient
                        colors={isDark ? ['#312e81', '#1e1b4b'] : ['#4f46e5', '#3730a3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />

                    {/* Background Decorative Icon */}
                    <View className="absolute -right-6 -bottom-6 opacity-[0.15]">
                        <Compass size={140} color="#e0e7ff" />
                    </View>

                    {/* Content */}
                    <View className="p-5 flex-1 justify-between">
                        <View>
                            <Text className="text-xl font-black text-white tracking-wide shadow-sm">
                                Billet Explorer
                            </Text>
                            <Text className="text-indigo-100 text-[13px] font-medium mt-1 leading-5 opacity-90 max-w-[80%]">
                                Discover opportunities and guide your career trajectory.
                            </Text>
                        </View>

                        {/* Footer Pill */}
                        {savedCount > 0 && (
                            <View className="self-start bg-white/20 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                <Text className="text-white text-[11px] font-bold uppercase tracking-widest">
                                    {savedCount} Saved Billets
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </ScalePressable>
    );
}
