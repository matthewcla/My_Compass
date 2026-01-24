import Colors from '@/constants/Colors';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions } from 'react-native';
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
const ICON_FADE_DURATION = 800; // Phase 1: Icon opacity animation
const TITLE_FADE_DURATION = 600; // Phase 2: Title opacity animation
const DWELL_AFTER_TEXT = 1000; // Pause after text reveals before handoff
const MOVE_UP_DURATION = 800; // Phase 3: Handoff animation

interface StartupAnimationProps {
    onAnimationComplete: () => void;
}

export default function StartupAnimation({ onAnimationComplete }: StartupAnimationProps) {
    const { height: screenHeight } = useWindowDimensions();

    // Conditional rendering state for text - prevents flash
    const [showText, setShowText] = useState(false);

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
            // Mount the text component right before animating
            setShowText(true);

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

            logoScale.value = withDelay(
                DWELL_AFTER_TEXT,
                withTiming(FINAL_LOGO_SIZE / LOGO_SIZE, { duration: MOVE_UP_DURATION })
            );

            containerTranslateY.value = withDelay(
                DWELL_AFTER_TEXT,
                withTiming(targetTranslation, {
                    duration: MOVE_UP_DURATION,
                    easing: Easing.inOut(Easing.cubic),
                }, (finished) => {
                    if (finished) {
                        runOnJS(onAnimationComplete)();
                    }
                })
            );
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
        <Animated.View style={[styles.container, rootStyle]}>

            {/* Logo Circle with Glass Effect */}
            <Animated.View style={[styles.logoCircle, logoAnimatedStyle]}>
                <Image
                    source={require('@/assets/images/splash-icon.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Text Container - Conditionally Rendered to Prevent Flash */}
            {showText && (
                <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
                    <Text style={styles.appName}>My Compass</Text>
                    <Text style={styles.tagline}>Navy Career Navigation System</Text>
                </Animated.View>
            )}

        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        // Ensure it doesn't take up full screen height rigidly so layout can flow
    },
    logoCircle: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        borderRadius: LOGO_SIZE / 2,
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // Subtle glass fill
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)', // Glass border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
    logoImage: {
        width: '70%',
        height: '70%',
        tintColor: Colors.light.navyGold, // Optional: Tint gold if it's a monochrome icon, remove if full color
    },
    textContainer: {
        alignItems: 'center',
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 1.2,
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        fontSize: 14,
        color: '#94A3B8',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
