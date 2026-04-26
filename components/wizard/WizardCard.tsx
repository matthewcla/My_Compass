import { SolidView } from '@/components/ui/SolidView';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

interface WizardCardProps {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    stickyFooter?: boolean;
    scrollable?: boolean;
    noPadding?: boolean;
}

export function WizardCard({
    title,
    children,
    footer,
    scrollable = true,
    noPadding = false
}: WizardCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Animated.View
            entering={FadeInRight.springify().mass(1.2).stiffness(150).damping(22)}
            exiting={FadeOutLeft.duration(200)}
            style={{ flex: 1 }}
        >
            <SolidView
                intensity={isDark ? 30 : 90}
                tint={isDark ? 'dark' : 'light'}
                className="flex-1 w-full rounded-none overflow-hidden border border-slate-200 dark:border-white/10 md:mx-auto md:max-w-2xl bg-surface dark:bg-transparent"
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
                                contentContainerClassName={noPadding ? undefined : "p-4 md:p-6 web:p-8"}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="interactive"
                            >
                                {children}
                            </ScrollView>
                        </KeyboardAvoidingView>
                    ) : (
                        <View className={noPadding ? undefined : "p-6"}>
                            {children}
                        </View>
                    )}

                    {/* Sticky Footer */}
                    {footer && (
                        <View className="px-6 py-5 bg-cardBackground dark:bg-slate-900/50 border-t border-gray-100 dark:border-gray-800/50">
                            {footer}
                        </View>
                    )}
                </View>
            </SolidView>
        </Animated.View>
    );
}
