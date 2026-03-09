import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { MAX_SLATE_SIZE, useAssignmentStore } from '@/store/useAssignmentStore';
import { getShadow } from '@/utils/getShadow';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, BarChart2, ChevronRight, Compass } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface NegotiationWidgetProps {
    onStartExploring?: () => void;
    onManageSlate?: () => void;
}

const SLOT_INDICES = Array.from({ length: MAX_SLATE_SIZE }, (_, i) => i);

export default function NegotiationWidget({ onStartExploring, onManageSlate }: NegotiationWidgetProps) {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
    const scale = useSharedValue(1);

    const realDecisions = useAssignmentStore(state => state.realDecisions);
    const billets = useAssignmentStore(state => state.billets);
    const applications = useAssignmentStore(state => state.applications);
    const userApplicationIds = useAssignmentStore(state => state.userApplicationIds);

    // Discovery Stats
    const stats = useMemo(() => {
        let slated = 0;
        let saved = 0;
        let passed = 0;

        Object.values(realDecisions).forEach(decision => {
            if (decision === 'super') slated++;
            else if (decision === 'like') saved++;
            else if (decision === 'nope') passed++;
        });

        return { slated, saved, passed };
    }, [realDecisions]);

    const hasActivity = stats.slated + stats.saved + stats.passed > 0;

    // Slate Stats
    const filledCount = userApplicationIds.length;
    let seaCount = 0;
    let shoreCount = 0;

    userApplicationIds.forEach((appId) => {
        const app = applications[appId];
        if (!app) return;

        const billet = billets[app.billetId];
        if (billet) {
            if (billet.dutyType?.toLowerCase().includes('sea')) {
                seaCount++;
            } else if (billet.dutyType?.toLowerCase().includes('shore')) {
                shoreCount++;
            }
        }
    });

    const handlePress = () => {
        if (onManageSlate) onManageSlate();
        else router.push('/(career)/cycle' as any);
    };

    const handleStartExploring = () => {
        if (onStartExploring) onStartExploring();
        else router.push({ pathname: '/(tabs)/(assignment)' } as any);
    };

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    if (!hasActivity) {
        return (
            <View
                className="rounded-2xl relative overflow-hidden mx-4 mb-6"
                style={{
                    borderWidth: 1,
                    borderColor: isDark
                        ? 'rgba(51, 65, 85, 0.6)'
                        : 'rgba(180, 200, 225, 0.5)',
                    ...getShadow({
                        shadowColor: isDark ? '#5B8FCF' : '#B8C9DF',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDark ? 0.2 : 0.15,
                        shadowRadius: 12,
                        elevation: 4,
                    }),
                }}
            >
                <LinearGradient
                    colors={isDark
                        ? ['#1e293b', '#0f172a']
                        : ['#F0F4FB', '#E5EBF5']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />

                <View className="relative z-10 p-5">
                    <View className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-900/40 items-center justify-center border-[1.5px] border-blue-500/20 dark:border-blue-500/30 mb-4 shadow-sm">
                        <Compass size={24} color={isDark ? '#5B8FCF' : '#1A4E8A'} />
                    </View>
                    <Text className="text-[20px] font-[800] tracking-[-0.5px] mb-1 text-slate-900 dark:text-white">
                        Build Your Slate
                    </Text>
                    <Text className="text-[14px] font-[500] text-slate-500 dark:text-slate-400 mb-5 leading-snug">
                        Swipe through available billets to start your shortlist. You can select up to 7 applications.
                    </Text>

                    <Pressable
                        onPress={handleStartExploring}
                        onPressIn={() => { scale.value = withSpring(0.97); }}
                        onPressOut={() => { scale.value = withSpring(1); }}
                    >
                        <Animated.View style={animatedButtonStyle}>
                            <View
                                className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                                style={{
                                    backgroundColor: isDark
                                        ? 'rgba(91, 143, 207, 0.15)'
                                        : 'rgba(26, 78, 138, 0.07)',
                                    borderWidth: 1,
                                    borderColor: isDark
                                        ? 'rgba(91, 143, 207, 0.3)'
                                        : 'rgba(26, 78, 138, 0.2)',
                                }}
                            >
                                <Text
                                    style={{ color: isDark ? '#5B8FCF' : '#1A4E8A' }}
                                    className="font-bold text-base"
                                >
                                    Start Exploring
                                </Text>
                                <ArrowRight size={18} color={isDark ? '#5B8FCF' : '#1A4E8A'} />
                            </View>
                        </Animated.View>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View>
            <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/10 mb-6 mx-4">
                <LinearGradient
                    colors={isDark ? ['rgba(99,102,241,0.15)', 'transparent'] : ['rgba(99,102,241,0.08)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View className="p-5">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-5">
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="w-[52px] h-[52px] rounded-full bg-indigo-500/10 dark:bg-indigo-900/40 items-center justify-center border-[1.5px] border-indigo-500/20 dark:border-indigo-800/60 shadow-sm">
                                <BarChart2 size={26} color={isDark ? '#818CF8' : '#4F46E5'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={2}>MyNavy Assignment</Text>
                                <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>Negotiation & Slate Actions</Text>
                            </View>
                        </View>
                        <View className="bg-indigo-500/10 px-3 py-1.5 rounded-[12px] border pb-2 border-indigo-500/20 ml-2 shadow-sm">
                            <Text className="text-[14px] font-black tracking-wide text-indigo-700 dark:text-indigo-400 uppercase">
                                {filledCount}/{MAX_SLATE_SIZE}
                            </Text>
                        </View>
                    </View>

                    <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
                        {/* Title and Sea/Shore Metadata */}
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-[13px] font-[600] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Slate Composition
                            </Text>

                            <View className="flex-row items-center gap-3">
                                <View className="flex-row items-center gap-1.5">
                                    <View className="w-2 h-2 rounded-full bg-cyan-500" />
                                    <Text className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{seaCount} Sea</Text>
                                </View>
                                <View className="flex-row items-center gap-1.5">
                                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <Text className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{shoreCount} Shore</Text>
                                </View>
                            </View>
                        </View>

                        {/* Slots */}
                        <View className="flex-row items-center justify-between mb-5 px-1">
                            {SLOT_INDICES.map((index) => {
                                const isFilled = index < filledCount;
                                return (
                                    <View
                                        key={index}
                                        className={`flex-1 mx-1 h-2.5 rounded-full ${isFilled
                                            ? 'bg-indigo-600 dark:bg-indigo-500 shadow-sm'
                                            : 'bg-slate-200 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600'
                                            }`}
                                    />
                                );
                            })}
                        </View>

                        {/* Actions Footer */}
                        <View className="flex-row items-center gap-3 mt-4">
                            <Pressable
                                onPress={handleStartExploring}
                                className="flex-1 bg-white/60 dark:bg-slate-800/60 rounded-xl py-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex-row items-center justify-center gap-2"
                            >
                                <Compass size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                                <Text className="text-[14px] font-bold text-slate-700 dark:text-slate-300">
                                    Explore Billets
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={handlePress}
                                className="flex-1 bg-indigo-600 dark:bg-indigo-500 rounded-xl py-3 shadow-sm flex-row items-center justify-center gap-2"
                                style={getShadow({
                                    shadowColor: isDark ? '#4F46E5' : '#4338CA',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 4,
                                    elevation: 2
                                })}
                            >
                                <Text className="text-[14px] font-bold text-white">
                                    Manage Slate
                                </Text>
                                <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </GlassView>
        </View>
    );
}
