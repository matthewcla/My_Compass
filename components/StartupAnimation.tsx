import { getTextShadow } from '@/utils/getShadow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Image, Platform, Text, useColorScheme, useWindowDimensions } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const LOGO_SIZE = 200;
const INITIAL_SCALE = 0.6; // Start small
const FINAL_SCALE = 1.0; // Grow to full size

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
    const logoScale = useSharedValue(INITIAL_SCALE); // Start small
    const logoOpacity = useSharedValue(0); // Start invisible
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);

    useEffect(() => {
        const checkFirstLaunch = async () => {
            try {
                const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                const isWarmBoot = hasLaunched === 'true';

                if (isWarmBoot) {
                    // WARM BOOT: Instant Final State
                    logoScale.value = FINAL_SCALE;
                    logoOpacity.value = 1;
                    textOpacity.value = 1;
                    textTranslateY.value = 0;

                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onAnimationComplete();
                } else {
                    // COLD BOOT: Cinematic Fade-In + Scale-Up Sequence
                    // Added 500ms delay to allow native splash to fully recede and prevent layout thrashing
                    setTimeout(() => {
                        // Stage 1: The Reveal (Fade In + Scale Up simultaneously)
                        logoOpacity.value = withTiming(1, { duration: FADE_IN_DURATION });
                        logoScale.value = withSpring(FINAL_SCALE, SPRING_CONFIG);
                    }, 500);


                    // Stage 2: Text Reveal after logo animation settles
                    // Adjusted for initial 500ms delay + 800ms fade + 500ms dwell
                    setTimeout(() => {
                        textOpacity.value = withTiming(1, { duration: TEXT_DURATION });
                        textTranslateY.value = withTiming(0, {
                            duration: TEXT_DURATION,
                            easing: Easing.out(Easing.exp)
                        }, (finished) => {
                            if (finished) {
                                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
                                runOnJS(onAnimationComplete)();
                            }
                        });
                    }, 500 + FADE_IN_DURATION + DWELL_DURATION);

                    await AsyncStorage.setItem('hasLaunched', 'true');
                }
            } catch (error) {
                console.error('Error checking first launch:', error);

                // Fallback: Immediate Fade In + Scale Up
                logoOpacity.value = withTiming(1, { duration: FADE_IN_DURATION });
                logoScale.value = withSpring(FINAL_SCALE, SPRING_CONFIG);
                setTimeout(() => {
                    textOpacity.value = withTiming(1, { duration: TEXT_DURATION });
                    textTranslateY.value = withTiming(0, { duration: TEXT_DURATION }, (finished) => {
                        if (finished) {
                            runOnJS(onAnimationComplete)();
                        }
                    });
                }, FADE_IN_DURATION + DWELL_DURATION);
            }
        };

        checkFirstLaunch();

    }, [onAnimationComplete]);

    const isDark = useColorScheme() === 'dark';

    // Dynamic Colors
    const textColor = isDark ? 'white' : '#0f172a';
    const taglineColor = isDark ? '#94A3B8' : '#475569';


    // Day Mode: No text shadow for clean look. Dark Mode: Subtle shadow.
    const textShadowStyle = isDark ? getTextShadow({
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    }) : {};

    const rootStyle = useAnimatedStyle(() => ({
        // Static container - no translation needed
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

            {/* App Logo - Anchor & Compass Emblem */}
            <Animated.View
                className="justify-center items-center mb-6"
                style={[
                    logoAnimatedStyle,
                    {
                        width: LOGO_SIZE,
                        height: LOGO_SIZE,
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                ]}
            >
                <Image
                    source={require('@/assets/images/app-logo.png')}
                    style={{
                        width: LOGO_SIZE,
                        height: LOGO_SIZE,
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
