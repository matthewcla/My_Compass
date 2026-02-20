import { useColorScheme } from '@/components/useColorScheme';
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
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            {/* Header — always visible */}
            <TouchableOpacity
                onPress={toggle}
                className="flex-row items-center justify-between"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center gap-3">
                    <View className="bg-amber-50 dark:bg-amber-900/30 p-2.5 rounded-full">
                        <ClipboardList size={20} color={isDark ? '#fbbf24' : '#d97706'} />
                    </View>
                    <View>
                        <Text className="text-base font-bold text-slate-900 dark:text-white">
                            How MNA Works
                        </Text>
                        <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            4-Step Process
                        </Text>
                    </View>
                </View>
                {expanded
                    ? <ChevronUp size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                    : <ChevronDown size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                }
            </TouchableOpacity>

            {/* Stepper dots — always visible */}
            <View className="flex-row items-center mt-4 mb-1 px-1">
                {STEPS.map((step, i) => (
                    <React.Fragment key={step.label}>
                        {/* Dot */}
                        <View className="items-center" style={{ flex: 0 }}>
                            <View
                                className={`w-3.5 h-3.5 rounded-full ${i === ACTIVE_STEP
                                    ? 'bg-amber-500 dark:bg-amber-400'
                                    : i < ACTIVE_STEP
                                        ? 'bg-green-500 dark:bg-green-400'
                                        : 'border-2 border-slate-300 dark:border-slate-600'
                                    }`}
                            />
                            <Text
                                className={`text-[9px] font-bold mt-1 ${i === ACTIVE_STEP
                                    ? 'text-amber-700 dark:text-amber-300'
                                    : 'text-slate-400 dark:text-slate-500'
                                    }`}
                                numberOfLines={1}
                            >
                                {step.label}
                            </Text>
                        </View>
                        {/* Connector line */}
                        {i < STEPS.length - 1 && (
                            <View
                                className={`h-0.5 flex-1 mx-1 ${i < ACTIVE_STEP
                                    ? 'bg-green-400 dark:bg-green-600'
                                    : 'bg-slate-200 dark:bg-slate-700'
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
                <View className="mt-4 gap-4">
                    {STEPS.map((step, i) => (
                        <View key={step.label} className="flex-row gap-3">
                            <View className="items-center" style={{ width: 20 }}>
                                <View
                                    className={`w-5 h-5 rounded-full items-center justify-center ${i === ACTIVE_STEP
                                        ? 'bg-amber-500 dark:bg-amber-400'
                                        : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                >
                                    <Text className={`text-[10px] font-black ${i === ACTIVE_STEP ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                                        }`}>
                                        {i + 1}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className={`text-sm font-bold ${i === ACTIVE_STEP
                                    ? 'text-amber-800 dark:text-amber-200'
                                    : 'text-slate-700 dark:text-slate-300'
                                    }`}>
                                    {step.label}
                                </Text>
                                <Text className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                    {step.description}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {/* Reassurance footer */}
                    <View className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-800/30 mt-4">
                        <Text className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            💡 You have 3 cycles over 6 months to be matched. If you're not selected in
                            one cycle, your slate automatically carries forward to the next.
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}
