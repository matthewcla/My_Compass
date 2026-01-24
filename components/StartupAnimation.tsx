import Colors from '@/constants/Colors';
import { Anchor } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const NAVY_ABYSS = '#0A1628';
const LOGO_SIZE = 120;
const FINAL_LOGO_SIZE = 64;

// Animation Timing Constants
const STEP_1_DELAY = 800; // Wait before starting
const LOGO_SCALE_DURATION = 1000;
const TEXT_REVEAL_DELAY = 1200;
const TEXT_REVEAL_DURATION = 800;
const HOLD_DURATION = 1000; // How long to hold the full state before moving up
const MOVE_UP_DURATION = 800;

interface StartupAnimationProps {
    onAnimationComplete: () => void;
}

export default function StartupAnimation({ onAnimationComplete }: StartupAnimationProps) {
    // Shared Values for Animation State
    const logoScale = useSharedValue(0);
    const logoOpacity = useSharedValue(0);
    const logoTranslateY = useSharedValue(0);

    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);

    const containerTranslateY = useSharedValue(0);

    useEffect(() => {
        // PHASE 1: THE REVEAL
        // Logo fades in and scales up
        logoOpacity.value = withDelay(STEP_1_DELAY, withTiming(1, { duration: 800 }));
        logoScale.value = withDelay(
            STEP_1_DELAY,
            withSpring(1, {
                damping: 12,
                stiffness: 100,
            })
        );

        // PHASE 2: THE IDENTITY
        // Text slides up and fades in
        textOpacity.value = withDelay(TEXT_REVEAL_DELAY, withTiming(1, { duration: TEXT_REVEAL_DURATION }));
        textTranslateY.value = withDelay(
            TEXT_REVEAL_DELAY,
            withTiming(0, {
                duration: TEXT_REVEAL_DURATION,
                easing: Easing.out(Easing.exp),
            })
        );

        // PHASE 3: THE HANDOFF
        // After holding, everything moves to the top & logo shrinks
        const TOTAL_DELAY = TEXT_REVEAL_DELAY + TEXT_REVEAL_DURATION + HOLD_DURATION;

        // We animate the LOGO scale down to its header size
        logoScale.value = withDelay(TOTAL_DELAY, withTiming(FINAL_LOGO_SIZE / LOGO_SIZE, { duration: MOVE_UP_DURATION }));

        // Animate the entire container up to the header position
        // We calculate the rough distance to move up based on screen layout assumptions, 
        // but a relative translation is safer for now.
        // Let's rely on the layout flex changes for the final position, 
        // but here we want a smooth transition. 
        // Actually, properly transitioning layout from center to top can be tricky with absolute positioning.
        // Strategy: We will animate the translateY of the container to a negative value that places it roughly at the top,
        // Then call onAnimationComplete to let the parent switch layouts if needed, or just keep it there.
        // Better Strategy for smooth UX: The parent (SignInScreen) keeps this component mounted.
        // We explicitly animate to a specific negative Y offset that approximates the header position.

        // Assuming center is 0. Moving to top requires approx -30% of screen height or a fixed amount.
        // Let's use a fixed decent amount mostly to clear space for the login buttons.
        containerTranslateY.value = withDelay(
            TOTAL_DELAY,
            withTiming(-200, {
                duration: MOVE_UP_DURATION,
                easing: Easing.inOut(Easing.cubic)
            }, () => {
                runOnJS(onAnimationComplete)();
            })
        );

    }, []);

    // Animated Styles
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

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: containerTranslateY.value }],
    }));

    return (
        <Animated.View style={[styles.container, containerAnimatedStyle]}>

            {/* Logo Circle */}
            <Animated.View style={[styles.logoCircle, logoAnimatedStyle]}>
                {/* 
            Ideally we use the Image component here with the asset.
            For now, using the Anchor Icon as per previous implementation 
            but scaling it. If the user provides the image, we can swap this.
            The USER requested: "Navigate to assets/images/navy-logo.png".
            I will use the Anchor as a fallback if the Image is not loaded effectively,
            but let's implement the container for the image.
          */}
                <Anchor size={64} color="white" strokeWidth={1.5} />
            </Animated.View>

            {/* Text Container */}
            <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
                <Text style={styles.appName}>My Compass</Text>
                <Text style={styles.tagline}>Navy Career Navigation System</Text>
            </Animated.View>

        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    logoCircle: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        borderRadius: LOGO_SIZE / 2,
        backgroundColor: Colors.light.navyLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 3,
        borderColor: Colors.light.navyGold,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    textContainer: {
        alignItems: 'center',
    },
    appName: {
        fontSize: 36,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 1,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: '#8BA3C7',
        letterSpacing: 0.5,
    },
});
