import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { MAX_SLATE_SIZE, useAssignmentStore } from '@/store/useAssignmentStore';
import { LinearGradient } from 'expo-linear-gradient';
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
            <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/10 mb-6 mx-4">
                <LinearGradient
                    colors={isDark ? ['rgba(99,102,241,0.15)', 'transparent'] : ['rgba(99,102,241,0.08)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View className="p-5">
                    {/* Header: Title + Analytic Icon */}
                    <View className="flex-row justify-between items-center mb-5">
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="w-[52px] h-[52px] rounded-full bg-indigo-500/10 dark:bg-indigo-900/40 items-center justify-center border-[1.5px] border-indigo-500/20 dark:border-indigo-800/60 shadow-sm">
                                <BarChart2 size={26} color={isDark ? '#818CF8' : '#4F46E5'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={2}>Slate Summary</Text>
                                <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={2}>Sea & Shore Balance</Text>
                            </View>
                        </View>
                        <View className="bg-indigo-500/10 px-3 py-1.5 rounded-[12px] border pb-2 border-indigo-500/20 ml-2 shadow-sm">
                            <Text className="text-[14px] font-black tracking-wide text-indigo-700 dark:text-indigo-400 uppercase">
                                {filledCount}/{MAX_SLATE_SIZE}
                            </Text>
                        </View>
                    </View>

                    <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
                        {/* Visuals: The Slots */}
                        <View className="flex-row items-center space-x-2 mb-5">
                            {SLOT_INDICES.map((index) => {
                                const isFilled = index < filledCount;
                                return (
                                    <View
                                        key={index}
                                        className={`flex-1 h-3 rounded-full ${isFilled
                                            ? 'bg-indigo-600 dark:bg-indigo-500 shadow-sm'
                                            : 'bg-slate-200 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600'
                                            }`}
                                    />
                                );
                            })}
                        </View>

                        {/* Footer: Metadata Summary + Chevron */}
                        <View className="flex-row justify-between items-center bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                            <View className="flex-row items-center gap-4 flex-1">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm" />
                                    <Text className="text-[14px] font-bold text-slate-700 dark:text-slate-300">
                                        {seaCount} Sea
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                                    <Text className="text-[14px] font-bold text-slate-700 dark:text-slate-300">
                                        {shoreCount} Shore
                                    </Text>
                                </View>
                                {filledCount === 0 && (
                                    <Text className="text-[13px] font-medium text-slate-500 dark:text-slate-400 italic flex-1">
                                        Add billets to analyze
                                    </Text>
                                )}
                            </View>
                            <View className="w-8 h-8 rounded-full bg-indigo-500/10 items-center justify-center border border-indigo-500/20 ml-2">
                                <ChevronRight size={18} color={isDark ? '#818CF8' : '#4F46E5'} strokeWidth={2.5} />
                            </View>
                        </View>
                    </View>
                </View>
            </GlassView>
        </ScalePressable>
    );
}
