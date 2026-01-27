import Colors from '@/constants/Colors';
import { getShadow, getTextShadow } from '@/utils/getShadow';
import React, { useEffect } from 'react';
import { Image, Text, useColorScheme, useWindowDimensions } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const LOGO_SIZE = 140; // Slightly larger for impact
const FINAL_LOGO_SIZE = 64;

// Animation Timing Constants - Strictly Sequential
const PHASE_1_START = 500; // Delay after mount (waiting for native splash)
const ICON_FADE_DURATION = 1200; // Phase 1: Icon opacity animation (Slower for gravitas)
const TITLE_FADE_DURATION = 1000; // Phase 2: Title opacity animation (Slower)
const DWELL_AFTER_TEXT = 1500; // Pause after text reveals before handoff (Longer dwell)
const MOVE_UP_DURATION = 1000; // Phase 3: Handoff animation (Slower move)

interface StartupAnimationProps {
    onAnimationComplete: () => void;
}

export default function StartupAnimation({ onAnimationComplete }: StartupAnimationProps) {
    const { height: screenHeight } = useWindowDimensions();

    // showText state removed to prevent layout shift (Option 1: Pre-render with opacity)

    // Shared Values for Animation State - BOTH START AT 0
    const logoScale = useSharedValue(0);
    const logoOpacity = useSharedValue(0); // Icon starts invisible

    // Text opacity & translation - STARTS AT 0
    const textOpacity = useSharedValue(0); // Title starts invisible
    const textTranslateY = useSharedValue(20);

    // Container translation for the "Handoff"
    const containerTranslateY = useSharedValue(0);

    useEffect(() => {
        // Helper to trigger Phase 2 (Title fade) - called via runOnJS from Phase 1 callback
        const startPhase2 = () => {
            // Text is already mounted, just animate opacity

            // PHASE 2: THE IDENTITY - Title fades in over 600ms
            textOpacity.value = withTiming(1, {
                duration: TITLE_FADE_DURATION,
                easing: Easing.out(Easing.quad),
            });
            textTranslateY.value = withTiming(0, {
                duration: TITLE_FADE_DURATION,
                easing: Easing.out(Easing.exp),
            }, (finished) => {
                if (finished) {
                    runOnJS(startPhase3)();
                }
            });
        };

        // Helper to trigger Phase 3 (Handoff) - called via runOnJS from Phase 2 callback
        const startPhase3 = () => {
            // Pause briefly after text is readable, then handoff
            const targetTranslation = -(screenHeight * 0.18);

            // logoScale.value update removed to prevent shrinking during move up
            // logoScale.value = withDelay(
            //     DWELL_AFTER_TEXT,
            //     withTiming(FINAL_LOGO_SIZE / LOGO_SIZE, { duration: MOVE_UP_DURATION })
            // );

            containerTranslateY.value = withDelay(
                DWELL_AFTER_TEXT,
                withTiming(targetTranslation, {
                    duration: MOVE_UP_DURATION,
                    easing: Easing.out(Easing.exp), // Modern, smooth settling
                })
                // Removed completion callback to decouple timing
            );

            // OVERLAP: Trigger the login controls appearance *during* the move
            // starting 30% into the move animation for a fluid handoff.
            setTimeout(() => {
                onAnimationComplete();
            }, DWELL_AFTER_TEXT + (MOVE_UP_DURATION * 0.3));
        };

        // PHASE 1: THE REVEAL - Icon fades in over 800ms with Ease Out
        // Spring for scale, timing with callback for opacity to trigger Phase 2
        logoScale.value = withDelay(
            PHASE_1_START,
            withSpring(1, {
                damping: 15,
                stiffness: 90,
            })
        );

        logoOpacity.value = withDelay(
            PHASE_1_START,
            withTiming(1, {
                duration: ICON_FADE_DURATION,
                easing: Easing.out(Easing.quad),
            }, (finished) => {
                // STRICTLY WAIT for icon animation to complete before starting Phase 2
                if (finished) {
                    runOnJS(startPhase2)();
                }
            })
        );
    }, [screenHeight, onAnimationComplete]);

    const isDark = useColorScheme() === 'dark';

    // Dynamic Colors
    const textColor = isDark ? 'white' : '#0f172a'; // Slate 900 for sharpest contrast in day
    const taglineColor = isDark ? '#94A3B8' : '#475569'; // Slate 400 : Slate 600
    const circleBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.03)';
    const circleBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)';
    const shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'transparent'; // Clean look for day mode
    const logoTint = isDark ? Colors.light.navyGold : '#eab308'; // Gold for both, but ensured visibility

    const textShadowStyle = getTextShadow({
        textShadowColor: shadowColor,
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    });

    /* ... existing animation logic ... */

    // Fix: Reanimated safe access
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
        <Animated.View className="items-center justify-center z-10" style={rootStyle}>

            {/* Logo Circle with Glass Effect */}
            <Animated.View
                className="justify-center items-center mb-6 border w-[140px] h-[140px] rounded-[70px]"
                style={[
                    logoAnimatedStyle,
                    { backgroundColor: circleBg, borderColor: circleBorder },
                    getShadow({
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1, // Reduced for subtle feel
                        shadowRadius: 20,
                        elevation: 5,
                    })
                ]}
            >
                <Image
                    source={require('@/assets/images/splash-icon.png')}
                    className="w-[70%] h-[70%]"
                    style={{ tintColor: logoTint }}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Text Container */}
            <Animated.View className="items-center" style={textAnimatedStyle}>
                <Text
                    className="text-[32px] font-bold tracking-[1.2px] mb-2"
                    style={[{ color: textColor }, textShadowStyle]}
                >
                    My Compass
                </Text>
                <Text
                    className="text-sm tracking-[1px] uppercase font-medium"
                    style={{ color: taglineColor }}
                >
                    Navy Career Navigation System
                </Text>
            </Animated.View>

        </Animated.View>
    );
}
