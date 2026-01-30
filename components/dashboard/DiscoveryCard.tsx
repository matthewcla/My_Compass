import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { getShadow } from '@/utils/getShadow';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChevronRight, Search, SlidersHorizontal } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface DiscoveryCardProps {
    matchingBillets: number;
    onStartExploring?: () => void;
    onJobPreferencesPress?: () => void;
}

export function DiscoveryCard({ matchingBillets, onStartExploring, onJobPreferencesPress }: DiscoveryCardProps) {
    const scale = useSharedValue(1);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <View className="flex-1 flex flex-col min-h-0 gap-6">
            {/* Primary Hero Card: Start Discovery */}
            <View
                className="flex-1 rounded-2xl shadow-lg relative overflow-hidden flex flex-col group"
                style={getShadow({ shadowColor: '#e2e8f0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 })}
            >
                <LinearGradient
                    colors={['#1e293b', '#020617']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />



                <View className="relative z-10 flex-row justify-between items-start p-5 pb-0">
                    <View>
                        <Text className="text-xl font-bold leading-tight mb-1 text-white">Discovery Mode</Text>
                        <Text className="text-slate-400 text-xs font-medium">Explore & sort available billets.</Text>
                    </View>
                    <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center backdrop-blur-md border border-white/10">
                        <Search size={16} className="text-emerald-400" color="#34d399" />
                    </View>
                </View>

                {/* Content Section - Pushed to bottom with flex spacer using justify-end */}
                <View className="relative z-10 flex-1 justify-end p-5 pt-[5px]">
                    <View className="flex-row items-center gap-3 mb-6">
                        <Text className="text-5xl font-bold text-white tracking-tight">{matchingBillets}</Text>
                        <View className="flex flex-col">
                            <Text className="text-xs text-emerald-400 font-bold uppercase tracking-wider">New Matches</Text>
                            <Text className="text-[10px] text-slate-500 font-medium">Since last login</Text>
                        </View>
                    </View>

                    <Pressable
                        onPress={onStartExploring}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                    >
                        <Animated.View
                            style={animatedButtonStyle}
                            // @ts-ignore
                            sharedTransitionTag="explore-btn"
                        >
                            <View className="w-full bg-white dark:bg-slate-200 z-20 py-4 rounded-xl shadow-sm flex-row items-center justify-center gap-2">
                                <Text className="font-bold text-base text-slate-900">Start Exploring</Text>
                                <ArrowRight size={18} color="#0f172a" />
                            </View>
                        </Animated.View>
                    </Pressable>
                </View>
            </View>

            {/* Secondary Actions: Preferences */}
            <TouchableOpacity
                onPress={onJobPreferencesPress}
                activeOpacity={0.8}
                style={getShadow({ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 })}
            >
                <GlassView
                    intensity={60}
                    tint={isDark ? 'dark' : 'light'}
                    className="h-20 rounded-xl px-5 border border-slate-200/50 dark:border-slate-700/50 flex-row items-center justify-between"
                >
                    <View className="flex-row items-center gap-4">
                        <View className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center">
                            <SlidersHorizontal size={20} color={isDark ? "#94A3B8" : "#64748B"} />
                        </View>
                        <View>
                            <Text className="text-base font-bold text-slate-800 dark:text-white">Job Preferences</Text>
                            <Text className="text-sm text-slate-500">Last updated 24 days ago</Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color={isDark ? "#475569" : "#cbd5e1"} />
                </GlassView>
            </TouchableOpacity>
        </View>
    );
}
