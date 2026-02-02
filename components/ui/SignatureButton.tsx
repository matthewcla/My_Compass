import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface SignatureButtonProps {
    onSign: () => void;
    isSubmitting: boolean;
    disabled?: boolean;
}

export function SignatureButton({ onSign, isSubmitting, disabled }: SignatureButtonProps) {
    return (
        <View className="w-full">
            <TouchableOpacity
                onPress={onSign}
                disabled={disabled || isSubmitting}
                className={`h-14 w-full rounded-xl items-center justify-center border ${disabled
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    : 'bg-blue-600 border-blue-500'
                    }`}
            >
                <Text className={`font-bold text-base uppercase tracking-wider ${disabled ? 'text-slate-400' : 'text-white'}`}>
                    {isSubmitting ? 'Sending...' : 'Submit Request'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}



