import Colors from '@/constants/Colors';
import { getShadow, getTextShadow } from '@/utils/getShadow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Image, Platform, Text, useColorScheme, useWindowDimensions } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const LOGO_SIZE = 140;
const FINAL_SCALE = 0.8;
const FINAL_TRANSLATE_Y = -50;

// Animation Timing
const FADE_IN_DURATION = 800;
const DWELL_DURATION = 500;
const TEXT_REVEAL_DELAY = 200; // Relative to start of move phase
const TEXT_DURATION = 800;
const SPRING_CONFIG = { mass: 1, damping: 15, stiffness: 120 };

interface StartupAnimationProps {
    onAnimationComplete: () => void;
}

export default function StartupAnimation({ onAnimationComplete }: StartupAnimationProps) {
    const { height: screenHeight } = useWindowDimensions();

    // Shared Values
    const logoScale = useSharedValue(1); // Start full size
    const logoOpacity = useSharedValue(0); // Start invisible (Void)
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const containerTranslateY = useSharedValue(0);

    useEffect(() => {
        const checkFirstLaunch = async () => {
            try {
                const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                const isWarmBoot = hasLaunched === 'true';

                if (isWarmBoot) {
                    // WARM BOOT: Instant Final State
                    logoScale.value = FINAL_SCALE;
                    logoOpacity.value = 1;
                    containerTranslateY.value = FINAL_TRANSLATE_Y;
                    textOpacity.value = 1;
                    textTranslateY.value = 0;

                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onAnimationComplete();
                } else {
                    // COLD BOOT: Cinematic Fade-In Sequence

                    // Stage 1: The Reveal (Fade In)
                    logoOpacity.value = withTiming(1, { duration: FADE_IN_DURATION });

                    // Stage 2: The Breath (Dwell)
                    setTimeout(() => {
                        // Stage 3: The Departure (Move & Scale)
                        logoScale.value = withSpring(FINAL_SCALE, SPRING_CONFIG);
                        containerTranslateY.value = withSpring(FINAL_TRANSLATE_Y, SPRING_CONFIG, (finished) => {
                            if (finished) {
                                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
                                runOnJS(onAnimationComplete)();
                            }
                        });

                        // Text Reveal
                        textOpacity.value = withDelay(TEXT_REVEAL_DELAY, withTiming(1, { duration: TEXT_DURATION }));
                        textTranslateY.value = withDelay(TEXT_REVEAL_DELAY, withTiming(0, {
                            duration: TEXT_DURATION,
                            easing: Easing.out(Easing.exp)
                        }));

                    }, FADE_IN_DURATION + DWELL_DURATION);

                    await AsyncStorage.setItem('hasLaunched', 'true');
                }
            } catch (error) {
                console.error('Error checking first launch:', error);

                // Fallback: Immediate Fade In & Move
                logoOpacity.value = withTiming(1, { duration: FADE_IN_DURATION });
                setTimeout(() => {
                    logoScale.value = withSpring(FINAL_SCALE, SPRING_CONFIG);
                    containerTranslateY.value = withSpring(FINAL_TRANSLATE_Y, SPRING_CONFIG, (finished) => {
                        if (finished) {
                            runOnJS(onAnimationComplete)();
                        }
                    });
                    textOpacity.value = withDelay(TEXT_REVEAL_DELAY, withTiming(1, { duration: TEXT_DURATION }));
                    textTranslateY.value = withDelay(TEXT_REVEAL_DELAY, withTiming(0, { duration: TEXT_DURATION }));
                }, FADE_IN_DURATION + DWELL_DURATION);
            }
        };

        checkFirstLaunch();

        // Web Splash Handoff (Keep existing logic)
        if (Platform.OS === 'web') {
            setTimeout(() => {
                const splash = document.getElementById('splash');
                if (splash) {
                    splash.classList.add('hidden');
                }
            }, 100);
        }

    }, [onAnimationComplete]);

    const isDark = useColorScheme() === 'dark';

    // Dynamic Colors
    const textColor = isDark ? 'white' : '#0f172a';
    const taglineColor = isDark ? '#94A3B8' : '#475569';
    const circleBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.03)';
    const circleBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)';
    const logoTint = isDark ? Colors.light.navyGold : '#eab308';

    // Day Mode: No text shadow for clean look. Dark Mode: Subtle shadow.
    const textShadowStyle = isDark ? getTextShadow({
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    }) : {};

    const rootStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: containerTranslateY.value }]
    }));

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [
            { translateY: textTranslateY.value },
        ],
    }));

    return (
        <Animated.View
            className="items-center justify-center z-10"
            style={[
                rootStyle,
                { alignItems: 'center', justifyContent: 'center', width: '100%' }
            ]}
        >

            {/* Logo Circle with Glass Effect */}
            <Animated.View
                className="justify-center items-center mb-9 border"
                style={[
                    logoAnimatedStyle,
                    {
                        width: LOGO_SIZE,
                        height: LOGO_SIZE,
                        borderRadius: LOGO_SIZE / 2,
                        backgroundColor: circleBg,
                        borderColor: circleBorder,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                    getShadow({
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 20,
                        elevation: 0,
                    })
                ]}
            >
                <Image
                    source={require('@/assets/images/splash-icon.png')}
                    style={{
                        tintColor: logoTint,
                        width: LOGO_SIZE * 0.7,
                        height: LOGO_SIZE * 0.7,
                    }}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Text Container */}
            <Animated.View
                className="items-center"
                style={[
                    textAnimatedStyle,
                    { width: '100%', marginTop: Platform.OS === 'web' ? 18 : 0 }
                ]}
            >
                <Text
                    className="text-[32px] font-bold tracking-[1.2px] mb-2"
                    style={[{ color: textColor, textAlign: 'center' }, textShadowStyle]}
                >
                    My Compass
                </Text>
                <Text
                    className="text-sm tracking-[1px] uppercase font-medium"
                    style={{ color: taglineColor, textAlign: 'center' }}
                >
                    Navy Career Navigation System
                </Text>
            </Animated.View>

        </Animated.View>
    );
}
