import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { MAX_SLATE_SIZE, useAssignmentStore } from '@/store/useAssignmentStore';
import { useRouter } from 'expo-router';
import { BarChart2, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface SlateSummaryWidgetProps {
    onPress?: () => void;
}

const SLOT_INDICES = Array.from({ length: MAX_SLATE_SIZE }, (_, i) => i);

export default function SlateSummaryWidget({ onPress }: SlateSummaryWidgetProps) {
    const router = useRouter();
    const { applications, userApplicationIds, billets } = useAssignmentStore();
    const isDark = useColorScheme() === 'dark';

    // Calculate Filled Slots
    const filledCount = userApplicationIds.length;

    // Calculate Metadata: Sea vs. Shore Balance
    let seaCount = 0;
    let shoreCount = 0;

    userApplicationIds.forEach((appId) => {
        const app = applications[appId];
        if (!app) return;

        const billet = billets[app.billetId];
        if (billet) {
            // Match exactly or loosely based on standard Navy duty types
            if (billet.dutyType?.toLowerCase().includes('sea')) {
                seaCount++;
            } else if (billet.dutyType?.toLowerCase().includes('shore')) {
                shoreCount++;
            }
        }
    });

    const handlePress = () => {
        if (onPress) onPress();
        else router.push('/(tabs)/(assignment)' as any);
    };

    return (
        <ScalePressable onPress={handlePress}>
            <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-2xl p-5 shadow-sm border border-black/5 dark:border-white/10 mb-4">
                {/* Header: Title + Analytic Icon */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white">SLATE COMPOSITION</Text>
                    <View className="px-2 py-1 flex-row items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                        <BarChart2 size={12} color={isDark ? '#818cf8' : '#4f46e5'} />
                        <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            Analyzer
                        </Text>
                    </View>
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

                {/* Footer: Metadata Summary + Chevron */}
                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center gap-2">
                            <View className="w-2 h-2 rounded-full bg-cyan-500" />
                            <Text className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {seaCount} Sea
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <View className="w-2 h-2 rounded-full bg-emerald-500" />
                            <Text className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {shoreCount} Shore
                            </Text>
                        </View>
                        {filledCount === 0 && (
                            <Text className="text-sm font-medium text-slate-400 dark:text-slate-500 italic">
                                Add billets to analyze loadout
                            </Text>
                        )}
                    </View>
                    <ChevronRight size={20} color="#94a3b8" />
                </View>
            </GlassView>
        </ScalePressable>
    );
}
