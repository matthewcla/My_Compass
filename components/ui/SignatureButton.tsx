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
                className={`h-14 w-full rounded-none items-center justify-center border ${disabled
                    ? 'bg-surface-container border-outline-variant'
                    : 'bg-secondary border-secondary'
                    }`}
            >
                <Text className={`font-bold text-base uppercase tracking-wider ${disabled ? 'text-on-surface-variant' : 'text-on-secondary'}`}>
                    {isSubmitting ? 'Sending...' : 'Submit Request'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}



