import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChevronRight, Search, SlidersHorizontal } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface DiscoveryCardProps {
    matchingBillets: number;
    onStartExploring?: () => void;
}

export function DiscoveryCard({ matchingBillets, onStartExploring }: DiscoveryCardProps) {
    return (
        <View className="flex-1 flex flex-col mb-3 min-h-0 gap-3">
            {/* Primary Hero Card: Start Discovery */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onStartExploring}
                className="flex-1 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between group"
                style={{ shadowColor: '#e2e8f0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 }}
            >
                <LinearGradient
                    colors={['#1e293b', '#0f172a', '#000000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute inset-0 z-0 h-full w-full"
                />

                {/* Abstract Map Grid - Removed pattern as asset was missing, can use a placeholder or pure code pattern if needed later */}
                <View className="absolute inset-0 opacity-20 bg-transparent" />

                {/* Decorative Blur */}
                <View className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />

                <View className="relative z-10 flex-row justify-between items-start p-5 pb-0">
                    <View>
                        <Text className="text-xl font-bold leading-tight mb-1 text-white">Discovery Mode</Text>
                        <Text className="text-slate-400 text-xs font-medium">Explore & sort available billets.</Text>
                    </View>
                    <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center backdrop-blur-md">
                        {/* Note: View-based backdrop-blur-md might act differently on Android. For full cross-platform blur, we'd use expo-blur. */}
                        <Search size={16} className="text-emerald-400" color="#34d399" />
                    </View>
                </View>

                <View className="relative z-10 mt-6 p-5 pt-0">
                    <View className="flex-row items-center gap-2 mb-4">
                        <Text className="text-3xl font-bold text-white">{matchingBillets}</Text>
                        <View className="flex flex-col">
                            <Text className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">New Matches</Text>
                            <Text className="text-[10px] text-slate-500">Since last login</Text>
                        </View>
                    </View>

                    <View className="w-full bg-white py-3 rounded-xl shadow-sm flex-row items-center justify-center gap-2">
                        <Text className="font-bold text-sm text-slate-900">Start Exploring</Text>
                        <ArrowRight size={16} color="#0f172a" />
                    </View>
                </View>
            </TouchableOpacity>

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
