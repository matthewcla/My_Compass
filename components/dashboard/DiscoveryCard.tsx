import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChevronRight, Search, SlidersHorizontal } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface DiscoveryCardProps {
    matchingBillets: number;
    onStartExploring?: () => void;
}

export function DiscoveryCard({ matchingBillets, onStartExploring }: DiscoveryCardProps) {
    const scale = useSharedValue(1);

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
        <View className="flex-1 flex flex-col min-h-0 gap-3">
            {/* Primary Hero Card: Start Discovery */}
            <View
                className="flex-1 rounded-2xl shadow-lg relative overflow-hidden flex flex-col group"
                style={{ shadowColor: '#e2e8f0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 }}
            >
                <LinearGradient
                    colors={['#1e293b', '#020617']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Decorative Blur / Glow */}
                <View className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500 opacity-20 rounded-full blur-3xl" />

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
                <View className="relative z-10 flex-1 justify-end p-5 pt-0">
                    <View className="flex-row items-center gap-3 mb-6">
                        <Text className="text-4xl font-bold text-white tracking-tight">{matchingBillets}</Text>
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
                            className="w-full bg-white py-3.5 rounded-xl shadow-sm flex-row items-center justify-center gap-2"
                            style={animatedButtonStyle}
                            // @ts-ignore
                            sharedTransitionTag="explore-btn"
                        >
                            <Text className="font-bold text-sm text-slate-900">Start Exploring</Text>
                            <ArrowRight size={16} color="#0f172a" />
                        </Animated.View>
                    </Pressable>
                </View>
            </View>

            {/* Secondary Actions: Preferences */}
            <TouchableOpacity
                className="h-16 bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex-row items-center justify-between"
                style={{ elevation: 2 }}
            >
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-lg bg-slate-50 items-center justify-center">
                        <SlidersHorizontal size={20} color="#64748B" />
                    </View>
                    <View>
                        <Text className="text-xs font-bold text-slate-800">Job Preferences</Text>
                        <Text className="text-[10px] text-slate-400">Last updated 24 days ago</Text>
                    </View>
                </View>
                <ChevronRight size={16} color="#cbd5e1" />
            </TouchableOpacity>
        </View>
    );
}
