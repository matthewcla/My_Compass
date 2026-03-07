import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { SwipeDecision } from '@/types/schema';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Compass } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

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
            <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/10 mx-4 mb-6">
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
                                <Compass size={26} color={isDark ? '#818CF8' : '#4F46E5'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
                                    Billet Explorer
                                </Text>
                                <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>
                                    Discover opportunities
                                </Text>
                            </View>
                        </View>
                        {savedCount > 0 && (
                            <View className="bg-indigo-500/10 px-3 py-1.5 rounded-[12px] border pb-2 border-indigo-500/20 ml-2 shadow-sm">
                                <Text className="text-[14px] font-black tracking-wide text-indigo-700 dark:text-indigo-400 uppercase">
                                    {savedCount} Saved
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
                        <View className="flex-row justify-between items-center bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                            <Text className="text-[14px] font-bold text-slate-700 dark:text-slate-300 flex-1">
                                Guide your career trajectory
                            </Text>
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
