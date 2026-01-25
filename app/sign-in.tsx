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

import StartupAnimation from '@/components/StartupAnimation';
import { useSession } from '@/lib/ctx';

/**
 * Okta Login Screen with Cinematic Startup
 * 
 * Features a high-fidelity startup animation that transitions
 * seamlessly into the login controls.
 * 
 * "Zero Trust" & "Anti-Hallucination" compliant.
 */
export default function SignInScreen() {
    const { signInWithOkta, isSigningIn } = useSession();
    const [error, setError] = useState<string | null>(null);
    const [showLoginControls, setShowLoginControls] = useState(false);

    // Reactive dimensions for potential future use or specific calculations
    const { width } = useWindowDimensions();

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
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const backgroundColor = isDark ? '#0A1628' : '#EFF6FF';

    // UI Constants - High Contrast for "Wow" Factor
    const buttonBaseColor = isDark ? 'rgba(255,255,255,0.1)' : '#1e3a8a'; // Navy Blue (Blue 900) for Day Mode
    const buttonPressedColor = isDark ? 'rgba(255,255,255,0.2)' : '#172554'; // Blue 950 for pressed

    return (
        <View className="flex-1" style={{ backgroundColor }}>
            {/* Background is always Navy Abyss */}

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
                        className="absolute bottom-[25%] left-0 right-0 w-full items-center px-4"
                    >
                        {/* Spacer to push buttons down relative to the moved-up logo */}
                        {/* 
                            StartupAnimation moves up by approx 25% of screen height.
                            We need enough space so the logo doesn't overlap the buttons.
                        */}
                        <View className="h-20" />

                        <Pressable
                            disabled={isSigningIn}
                            accessibilityRole="button"
                            accessibilityLabel="Sign In"
                            accessibilityState={{ disabled: isSigningIn }}
                            hitSlop={20}
                            className="w-full max-w-[560px] h-[60px] rounded-2xl self-center bg-transparent"
                            style={({ pressed }) => [
                                !isDark && {
                                    shadowColor: '#1e3a8a',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 10,
                                }
                            ]}
                            onPress={handleSignIn}
                        >
                            {({ pressed }) => (
                                <View
                                    className={`flex-1 rounded-2xl border items-center justify-center overflow-hidden ${isDark ? 'border-white/20' : 'border-transparent'
                                        }`}
                                    style={{
                                        backgroundColor: pressed ? buttonPressedColor : buttonBaseColor,
                                    }}
                                >
                                    {isSigningIn ? (
                                        <View className="flex-row items-center gap-3">
                                            <ActivityIndicator size="small" color="white" />
                                            <Text className="text-white font-bold text-lg">Redirecting...</Text>
                                        </View>
                                    ) : (
                                        <Text className="text-white font-bold text-lg tracking-wider">
                                            {Platform.OS === 'ios' ? 'Sign In with Okta' : 'Sign In'}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </Pressable>

                        {/* Error message */}
                        {error && (
                            <View className="mt-4 px-4 py-3 bg-red-600/15 rounded-lg border border-red-600/30">
                                <Text className="text-red-300 text-sm text-center">{error}</Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Footer - Positioned at bottom of screen, outside formContainer */}
                {showLoginControls && (
                    <Animated.View
                        entering={FadeInDown.duration(600).delay(100)}
                        className="absolute bottom-12 left-0 right-0 items-center px-8"
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
