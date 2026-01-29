import { Text } from '@/components/Themed';
import { GlassView } from '@/components/ui/GlassView';
import React from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    return (
        <Animated.View
            entering={FadeInRight.springify().damping(18)}
            exiting={FadeOutLeft.duration(200)}
            style={{ flex: 1 }}
        >
            <GlassView intensity={50} className="flex-1 mx-4 my-2 rounded-2xl overflow-hidden border border-white/20 dark:border-white/10">
                <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
                    {/* Header */}
                    <View className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/50">
                        <Text className="text-xl font-bold tracking-tight">
                            {title}
                        </Text>
                    </View>

                    {/* Body */}
                    {scrollable ? (
                        <ScrollView
                            className="flex-1"
                            contentContainerClassName="p-6"
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {children}
                        </ScrollView>
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
                </SafeAreaView>
            </GlassView>
        </Animated.View>
    );
}
