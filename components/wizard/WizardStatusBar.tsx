
import { Calendar, CheckCircle2, MapPin, Ship } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

interface WizardStatusBarProps {
    currentStep: number;
    onStepPress: (step: number) => void;
}

const STEPS = [
    { id: 0, icon: Calendar, label: 'Intent' },
    { id: 1, icon: MapPin, label: 'Contact' },
    { id: 2, icon: Ship, label: 'Routing' },
    { id: 3, icon: CheckCircle2, label: 'Check' },
];

export function WizardStatusBar({ currentStep, onStepPress }: WizardStatusBarProps) {
    return (
        <View className="flex-row items-center justify-between px-8 pt-4 pb-2">
            {STEPS.map((step, index) => {
                const isLast = index === STEPS.length - 1;
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                    <React.Fragment key={step.id}>
                        <Pressable
                            hitSlop={10}
                            disabled={!isCompleted}
                            onPress={() => isCompleted && onStepPress(index)}
                            className="items-center justify-center z-10"
                        >
                            <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${isActive
                                ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : isCompleted
                                    ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950'
                                }`}>
                                <Icon
                                    size={18}
                                    color={isActive ? '#2563EB' : isCompleted ? '#16A34A' : '#9CA3AF'}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </View>
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
