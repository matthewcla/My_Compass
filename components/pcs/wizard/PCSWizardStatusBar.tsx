import Colors from '@/constants/Colors';
import { Calendar, Car, CheckCircle2, Route } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

interface PCSWizardStatusBarProps {
    currentStep: number;
    onStepPress: (step: number) => void;
    errorSteps?: number[];
}

const STEPS = [
    { id: 0, icon: Calendar, label: 'Dates' },
    { id: 1, icon: Car, label: 'Mode' },
    { id: 2, icon: Route, label: 'Itinerary' },
    { id: 3, icon: CheckCircle2, label: 'Review' },
];

export function PCSWizardStatusBar({ currentStep, onStepPress, errorSteps = [] }: PCSWizardStatusBarProps) {
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

                const getIconColor = () => {
                    if (isError) return isDark ? Colors.dark.status.error : Colors.light.status.error;
                    if (isActive && isLast) return isDark ? Colors.green[500] : Colors.green[600];
                    if (isActive) return isDark ? Colors.blue[500] : Colors.blue[600];
                    if (isCompleted) return isDark ? Colors.green[500] : Colors.green[600];
                    return isDark ? Colors.gray[500] : Colors.gray[400];
                };

                return (
                    <React.Fragment key={step.id}>
                        <Pressable
                            hitSlop={10}
                            onPress={() => onStepPress(index)}
                            className="items-center justify-center z-10"
                        >
                            <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${isError
                                ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                                : (isActive && isLast)
                                    ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : isActive
                                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : isCompleted
                                            ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950'
                                }`}>
                                <Icon
                                    size={18}
                                    color={getIconColor()}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </View>
                            <Text
                                className={`text-[10px] font-bold mt-1 ${isError ? 'text-red-600 dark:text-red-400' :
                                    (isActive && isLast) ? 'text-green-600 dark:text-green-500' :
                                        isActive ? 'text-blue-600 dark:text-blue-400' :
                                            isCompleted ? 'text-green-600 dark:text-green-500' :
                                                'text-slate-400 dark:text-gray-500'
                                    }`}
                            >{step.label}</Text>
                        </Pressable>

                        {!isLast && (
                            <View
                                className={`flex-1 h-[2px] mx-2 ${index < currentStep ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-200 dark:bg-gray-800'
                                    }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}
