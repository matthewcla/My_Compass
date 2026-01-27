import React, { useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    Text,
    View,
    useColorScheme,
    useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StartupAnimation from '@/components/StartupAnimation';
import { useSession } from '@/lib/ctx';
import { getShadow } from '@/utils/getShadow';

/**
 * Okta Login Screen with Cinematic Startup
 * 
 * Features a high-fidelity startup animation that transitions
 * seamlessly into the login controls.
 * 
 * "Zero Trust" & "Anti-Hallucination" compliant.
 * 
 * DESIGN NOTE:
 * Uses a "Double-Container Pattern" for the Sign In button to ensure
 * exact pixel parity between Light and Dark modes.
 * - Outer Container: Handles Layout (Width/Height) and Shadows.
 * - Inner Container: Handles Border, Clipping, and Background Color.
 * 
 * This prevents the iOS shadow/border clipping conflict.
 */
export default function SignInScreen() {
    const { signInWithOkta, isSigningIn } = useSession();
    const [error, setError] = useState<string | null>(null);
    const [showLoginControls, setShowLoginControls] = useState(false);

    // Reactive dimensions
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const buttonWidth = Math.min(width - 32, 560); // Reactive width calculation

    const handleSignIn = async () => {
        setError(null);
        try {
            await signInWithOkta();
            // AuthGuard in _layout.tsx will handle navigation on success
        } catch (err) {
            setError('Authentication failed. Please try again.');
            console.error('[SignIn] Error:', err);
        }
    };

    // Explicitly define theme state for robustness
    // Robustly handle undefined state during hydration
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const backgroundColor = isDark ? '#0A1628' : '#EFF6FF';

    // UI Constants - High Contrast for "Wow" Factor
    const buttonBaseColor = isDark ? 'rgba(255,255,255,0.1)' : '#1e3a8a'; // Navy Blue (Blue 900) for Day Mode
    const buttonPressedColor = isDark ? 'rgba(255,255,255,0.2)' : '#172554'; // Blue 950 for pressed

    // Strict Layout Constants
    const BUTTON_HEIGHT = 60;
    const BUTTON_RADIUS = 16;
    const BORDER_WIDTH = 1; // Constant across modes

    return (
        <View className="flex-1" style={{ backgroundColor }}>
            {/* Background is always Navy Abyss or Light Gray */}

            <View className="flex-1 justify-center items-center">

                {/* 
                   Startup Animation 
                   - Handles only the visuals of the logo and text.
                   - On completion, triggers the appearance of the login form.
                */}
                <StartupAnimation
                    onAnimationComplete={() => setShowLoginControls(true)}
                />

                {/* Login Controls - Only appear after animation */}
                {showLoginControls && (
                    <Animated.View
                        entering={FadeInDown.duration(1200)}
                        style={{
                            position: 'absolute',
                            bottom: '25%',
                            left: 0,
                            right: 0,
                            width: '100%',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingBottom: Platform.OS === 'web' ? insets.bottom : 0
                        }}
                    >
                        {/* Spacer to push buttons down relative to the moved-up logo */}
                        <View className="h-20" />

                        {/* 
                            DOUBLE-CONTAINER PATTERN (Visual Stability)
                            Outer: Layout + Shadow
                            Inner: Border + Content + Clipping
                        */}
                        <View
                            style={{
                                width: buttonWidth,
                                height: BUTTON_HEIGHT,
                                borderRadius: BUTTON_RADIUS,
                                backgroundColor: 'transparent',
                                // Deterministic Shadow Props
                                ...getShadow({
                                    shadowColor: '#1e3a8a',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowRadius: 10,
                                    // Shadow Opacity toggles, but layout props remain constant
                                    shadowOpacity: isDark ? 0 : 0.25,
                                }),
                            }}
                        >
                            <Pressable
                                disabled={isSigningIn}
                                accessibilityRole="button"
                                accessibilityLabel="Sign In"
                                accessibilityState={{ disabled: isSigningIn }}
                                hitSlop={20}
                                style={{ flex: 1, borderRadius: BUTTON_RADIUS }}
                                onPress={handleSignIn}
                            >
                                {({ pressed }) => (
                                    <View
                                        style={{
                                            flex: 1,
                                            borderRadius: BUTTON_RADIUS,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            overflow: 'hidden', // Ensures content stays inside border

                                            // STYLE DETERMINISM:
                                            // Border width is ALWAYS 1.
                                            // Color becomes transparent in Light Mode to match Dark Mode footprint.
                                            borderWidth: BORDER_WIDTH,
                                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'transparent',

                                            backgroundColor: pressed ? buttonPressedColor : buttonBaseColor,
                                        }}
                                    >
                                        {isSigningIn ? (
                                            <View className="flex-row items-center gap-3">
                                                <ActivityIndicator size="small" color="white" />
                                                <Text className="text-white font-bold text-lg">Redirecting...</Text>
                                            </View>
                                        ) : (
                                            <Text className="text-white font-bold text-lg tracking-wider">Sign In with Okta</Text>
                                        )}
                                    </View>
                                )}
                            </Pressable>
                        </View>

                        {/* Error message */}
                        {error && (
                            <View className="mt-4 px-4 py-3 bg-red-600/15 rounded-lg border border-red-600/30">
                                <Text className="text-red-300 text-sm text-center">{error}</Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Footer - Positioned at bottom of screen */}
                {showLoginControls && (
                    <Animated.View
                        entering={FadeInDown.duration(600).delay(100)}
                        style={{
                            position: 'absolute',
                            bottom: 48 + (Platform.OS === 'web' ? insets.bottom : 0),
                            left: 0,
                            right: 0,
                            alignItems: 'center',
                            paddingHorizontal: 32
                        }}
                    >
                        <Text className="text-xs text-gray-500 text-center leading-[18px]">
                            Authorized personnel only. Use of this system constitutes consent to monitoring.
                        </Text>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}
