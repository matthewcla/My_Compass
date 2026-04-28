import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Compass, Ship } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CareerDashboard() {
    const isDark = useColorScheme() === 'dark';
    const insets = useSafeAreaInsets();

    return (
        <ScreenGradient>
            <View
                style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: insets.top,
                    backgroundColor: isDark ? Colors.gradient.dark[0] : Colors.gradient.light[0],
                    zIndex: 10,
                }}
            />

            <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, zIndex: 11 }}>
                <ScreenHeader
                    title="My Career"
                    subtitle="COMMAND CENTER"
                    withSafeArea={false}
                />
            </View>

            {/* Cinematic Empty State */}
            <View className="flex-1 items-center justify-center px-8 pb-32">
                <Animated.View entering={FadeInDown.duration(600).springify().damping(20)}>
                    <View className="mb-8 items-center justify-center">
                        <View className="absolute">
                            <Compass size={120} color={isDark ? '#18181B' : '#F1F5F9'} strokeWidth={1} />
                        </View>
                        <Animated.View entering={FadeIn.delay(300).duration(800)}>
                            <View style={styles.iconCircle}>
                                <Ship size={32} color={isDark ? '#C9A227' : '#B89222'} strokeWidth={2} />
                            </View>
                        </Animated.View>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(150).duration(600).springify()}>
                    <Text className="text-2xl font-black text-slate-900 dark:text-white text-center tracking-tight mb-3">
                        Career Pipeline
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300).duration(600).springify()}>
                    <Text className="text-base text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                        Your Rank Strategy Matrix and Billet Projections will appear here when your next selection cycle approaches.
                    </Text>
                </Animated.View>

                {/* Glass Mock Element to enforce depth */}
                <Animated.View entering={FadeInUp.delay(500).duration(700).springify()} style={styles.glassMockCard}>
                    <View className="flex-row items-center justify-between">
                        <View className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-700/50" />
                        <View className="flex-1 ml-4">
                            <View className="h-3 w-2/3 bg-slate-200/50 dark:bg-slate-700/50 rounded-full mb-2" />
                            <View className="h-2 w-1/3 bg-slate-200/30 dark:bg-slate-700/30 rounded-full" />
                        </View>
                    </View>
                </Animated.View>
            </View>
        </ScreenGradient>
    );
}

const styles = StyleSheet.create({
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEF3C7', // Navy Gold tint
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    glassMockCard: {
        width: '100%',
        marginTop: 48,
        padding: 20,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        opacity: 0.6,
    }
});
