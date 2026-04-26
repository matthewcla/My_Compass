
import Colors from '@/constants/Colors';
import { Calendar, CheckCircle2, MapPin, Ship } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface WizardStatusBarProps {
    currentStep: number;
    onStepPress: (step: number) => void;
    errorSteps?: number[];
}

const STEPS = [
    { id: 0, icon: Calendar, label: 'Time' },
    { id: 1, icon: MapPin, label: 'Location' },
    { id: 2, icon: Ship, label: 'Command' },
    { id: 3, icon: CheckCircle2, label: 'Safety' },
    { id: 4, icon: CheckCircle2, label: 'Review' },
];

function AnimatedProgressLine({ filled }: { filled: boolean }) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const progress = useSharedValue(filled ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(filled ? 1 : 0, { duration: 300 });
    }, [filled]);

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute' as const,
        left: 0,
        top: 0,
        bottom: 0,
        width: `${progress.value * 100}%`,
    }));

    return (
        <View className="flex-1 h-[2px] mx-2 bg-outline-variant dark:bg-slate-700 overflow-hidden">
            <Animated.View style={[animatedStyle, { height: '100%' }]}>
                <View className="w-full h-full bg-primary" />
            </Animated.View>
        </View>
    );
}

function AnimatedStepCircle({ isActive, children, className: cn }: { isActive: boolean; children: React.ReactNode; className: string }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (isActive) {
            scale.value = withSpring(1.15, { damping: 12, stiffness: 200 }, () => {
                scale.value = withSpring(1, { damping: 12, stiffness: 200 });
            });
        } else {
            scale.value = withTiming(1, { duration: 150 });
        }
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <View className={cn}>
                {children}
            </View>
        </Animated.View>
    );
}

export function WizardStatusBar({ currentStep, onStepPress, errorSteps = [] }: WizardStatusBarProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    return (
        <View className="flex-row items-center justify-between px-8 pt-4 pb-2">
            {STEPS.map((step, index) => {
                const isLast = index === STEPS.length - 1;
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isError = errorSteps.includes(index);

                // Determine Icon Color based on state and theme (Semantic Colors)
                const getIconColor = () => {
                    if (isError) return isDark ? '#FFB4AB' : '#BA1A1A'; // error
                    if (isActive || isCompleted) return isDark ? '#001A41' : '#FFFFFF'; // on-primary
                    return isDark ? '#94A3B8' : '#44474F'; // slate-400 for dark mode, outline-variant for light
                };

                const getStepContainerClass = () => {
                    if (isError) return 'border-error bg-error-container';
                    if (isActive || isCompleted) return 'border-primary bg-primary';
                    return 'border-outline-variant dark:border-slate-700 bg-surface-container dark:bg-slate-800';
                };

                const getTextColorClass = () => {
                    if (isError) return 'text-error';
                    if ((isActive && isLast) || isCompleted) return 'text-primary';
                    if (isActive) return 'text-primary';
                    return 'text-on-surface-variant dark:text-slate-400';
                };

                return (
                    <React.Fragment key={step.id}>
                        <Pressable
                            hitSlop={10}
                            onPress={() => onStepPress(index)}
                            className="items-center justify-center z-10"
                        >
                            <AnimatedStepCircle
                                isActive={isActive}
                                className={`w-10 h-10 rounded-full items-center justify-center border-2 ${getStepContainerClass()}`}
                            >
                                <Icon
                                    size={18}
                                    color={getIconColor()}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </AnimatedStepCircle>
                            <Text
                                className={`text-[10px] font-bold mt-1 ${getTextColorClass()}`}
                            >{step.label}</Text>
                        </Pressable>

                        {!isLast && (
                            <AnimatedProgressLine filled={index < currentStep} />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}
