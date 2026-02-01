// Simplified Version (No Reanimated)
import * as Haptics from 'expo-haptics';
import { Check, ScanLine } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface SignatureButtonProps {
    onSign: () => void;
    isSubmitting: boolean;
    disabled?: boolean;
}

export function SignatureButton({ onSign, isSubmitting, disabled }: SignatureButtonProps) {
    const [isComplete, setIsComplete] = useState(false);
    const [isHeld, setIsHeld] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handlePressIn = () => {
        if (disabled || isSubmitting || isComplete) return;
        setIsHeld(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Simulate hold duration
        timerRef.current = setTimeout(() => {
            triggerSuccess();
        }, 1500);
    };

    const handlePressOut = () => {
        if (isComplete) return;
        setIsHeld(false);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const triggerSuccess = () => {
        setIsComplete(true);
        setIsHeld(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
            onSign();
        }, 600);
    };

    return (
        <View className="w-full">
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || isSubmitting || isComplete}
                className={`h-14 w-full rounded-xl overflow-hidden relative items-center justify-center border ${disabled
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    : isComplete
                        ? 'bg-green-500 border-green-500'
                        : 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20'
                    }`}
            >
                {/* Simulated Progress Bar */}
                {isHeld && !isComplete && (
                    <View className="absolute left-0 top-0 bottom-0 bg-white/20 w-full" />
                )}

                <View className="flex-row items-center justify-center gap-3 z-10">
                    {isComplete ? (
                        <View className="flex-row items-center gap-2">
                            <Check size={20} color="white" strokeWidth={3} />
                            <Text className="text-white font-bold text-base uppercase tracking-wider">
                                Signed
                            </Text>
                        </View>
                    ) : isSubmitting ? (
                        <Text className="text-white font-bold text-base uppercase tracking-wider">
                            Processing...
                        </Text>
                    ) : (
                        <>
                            <ScanLine size={18} color={disabled ? '#94a3b8' : 'white'} />
                            <Text className={`font-bold text-base uppercase tracking-wider ${disabled ? 'text-slate-400' : 'text-white'}`}>
                                Hold to Sign
                            </Text>
                        </>
                    )}
                </View>
            </Pressable>
        </View>
    );
}



