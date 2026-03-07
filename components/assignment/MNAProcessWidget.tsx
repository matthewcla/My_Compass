import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ChevronDown,
    ChevronUp,
    ClipboardList,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { LayoutAnimation, Platform, Text, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const STEPS = [
    {
        label: 'Prepare',
        description: 'Browse billets, set your region and duty-type preferences, and learn the market.',
    },
    {
        label: 'Build Slate',
        description: 'When the cycle opens, promote your favorites into a ranked list of up to 5 billets.',
    },
    {
        label: 'Detailer Match',
        description: 'Your detailer reviews every sailor\'s slate and matches people to billets based on Navy needs and your preferences.',
    },
    {
        label: 'Orders',
        description: 'If matched, your orders are drafted and released. If not, your slate carries forward to the next cycle.',
    },
] as const;

const ACTIVE_STEP = 0; // On-Ramp = Prepare

/**
 * MNA Process Explainer — a collapsible coaching card
 * that explains how the MNA lifecycle works.
 * Only rendered during the ON_RAMP phase.
 */
export default function MNAProcessWidget() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [expanded, setExpanded] = useState(false);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded((prev) => !prev);
    };

    return (
        <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/10 mb-6 mx-4">
            <LinearGradient
                colors={isDark ? ['rgba(245,158,11,0.15)', 'rgba(217,119,6,0.05)'] : ['rgba(251,191,36,0.2)', 'rgba(245,158,11,0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            {/* Header — always visible */}
            <TouchableOpacity
                onPress={toggle}
                className="p-5 flex-row items-center justify-between"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center gap-4 flex-1">
                    <View className="w-[52px] h-[52px] rounded-full bg-amber-500/10 dark:bg-amber-900/40 items-center justify-center border-[1.5px] border-amber-500/20 dark:border-amber-800/60 shadow-sm">
                        <ClipboardList size={26} color={isDark ? '#FBBF24' : '#D97706'} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[20px] font-[800] text-slate-900 dark:text-slate-100 tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1}>
                            How MNA Works
                        </Text>
                        <Text className="text-[13px] font-[500] text-slate-600 dark:text-slate-400 leading-tight opacity-80" numberOfLines={1}>
                            4-Step Process
                        </Text>
                    </View>
                </View>
                <View className="w-8 h-8 rounded-full bg-amber-500/10 items-center justify-center border border-amber-500/20 ml-2">
                    {expanded
                        ? <ChevronUp size={20} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2.5} />
                        : <ChevronDown size={20} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2.5} />
                    }
                </View>
            </TouchableOpacity>

            <View className="px-5 pb-5">
                <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
                    {/* Stepper dots — always visible */}
                    <View className="flex-row items-center mb-1 px-1">
                        {STEPS.map((step, i) => (
                            <React.Fragment key={step.label}>
                                {/* Dot */}
                                <View className="items-center" style={{ flex: 0 }}>
                                    <View
                                        className={`w-3.5 h-3.5 rounded-full ${i === ACTIVE_STEP
                                            ? 'bg-amber-500 dark:bg-amber-400 shadow-sm'
                                            : i < ACTIVE_STEP
                                                ? 'bg-green-500 dark:bg-green-400 shadow-sm'
                                                : 'border bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                                            }`}
                                    />
                                    <Text
                                        className={`text-[9px] font-bold mt-1.5 uppercase tracking-wider ${i === ACTIVE_STEP
                                            ? 'text-amber-700 dark:text-amber-400'
                                            : 'text-slate-500 dark:text-slate-400'
                                            }`}
                                        numberOfLines={1}
                                    >
                                        {step.label}
                                    </Text>
                                </View>
                                {/* Connector line */}
                                {i < STEPS.length - 1 && (
                                    <View
                                        className={`h-0.5 flex-1 mx-2 ${i < ACTIVE_STEP
                                            ? 'bg-green-400 dark:bg-green-600'
                                            : 'bg-slate-200 dark:bg-slate-700/80 border border-slate-300/50 dark:border-slate-600/50'
                                            }`}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </View>

                    {/* "You are here" indicator */}
                    <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-1 px-1">
                        ▸ You Are Here
                    </Text>

                    {/* Expanded Detail */}
                    {expanded && (
                        <View className="mt-5 gap-4">
                            {STEPS.map((step, i) => (
                                <View key={step.label} className="flex-row gap-4">
                                    <View className="items-center" style={{ width: 24 }}>
                                        <View
                                            className={`w-6 h-6 rounded-full items-center justify-center shadow-sm ${i === ACTIVE_STEP
                                                ? 'bg-amber-500 dark:bg-amber-400'
                                                : 'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600'
                                                }`}
                                        >
                                            <Text className={`text-[11px] font-black ${i === ACTIVE_STEP ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                                                }`}>
                                                {i + 1}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-1 mt-0.5">
                                        <Text className={`text-[14px] font-bold ${i === ACTIVE_STEP
                                            ? 'text-amber-800 dark:text-amber-400'
                                            : 'text-slate-700 dark:text-slate-300'
                                            }`}>
                                            {step.label}
                                        </Text>
                                        <Text className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                            {step.description}
                                        </Text>
                                    </View>
                                </View>
                            ))}

                            {/* Reassurance footer */}
                            <View className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 mt-4 shadow-sm">
                                <Text className="text-[13px] text-amber-800 dark:text-amber-300 leading-relaxed font-semibold">
                                    <Text className="font-extrabold">💡 Note: </Text>
                                    You have 3 cycles over 6 months to be matched. If you're not selected in
                                    one cycle, your slate automatically carries forward to the next.
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </GlassView>
    );
}
