import { GlassView } from '@/components/ui/GlassView';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, useColorScheme } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

interface WizardCardProps {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    stickyFooter?: boolean;
    scrollable?: boolean;
}

export function WizardCard({
    title,
    children,
    footer,
    scrollable = true
}: WizardCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Animated.View
            entering={FadeInRight.springify().mass(1.2).stiffness(150).damping(22)}
            exiting={FadeOutLeft.duration(200)}
            style={{ flex: 1 }}
        >
            <GlassView
                intensity={isDark ? 30 : 50}
                tint={isDark ? 'dark' : 'light'}
                className="flex-1 mx-4 my-2 rounded-2xl overflow-hidden border border-white/20 dark:border-white/10"
            >
                <View style={{ flex: 1 }}>
                    {/* Header Removed */
                    /* <View className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/50">
                        <Text className="text-xl font-bold tracking-tight">
                            {title}
                        </Text>
                    </View> */}

                    {/* Body */}
                    {scrollable ? (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={{ flex: 1 }}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                        >
                            <ScrollView
                                className="flex-1"
                                contentContainerClassName="p-6"
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                {children}
                            </ScrollView>
                        </KeyboardAvoidingView>
                    ) : (
                        <View className="flex-1 p-6">
                            {children}
                        </View>
                    )}

                    {/* Sticky Footer */}
                    {footer && (
                        <View className="px-6 py-5 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-gray-800/50">
                            {footer}
                        </View>
                    )}
                </View>
            </GlassView>
        </Animated.View>
    );
}
