import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View,
    useColorScheme,
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

    // Get screen dimensions for absolute button width calculation
    const screenWidth = Dimensions.get('window').width;
    const buttonWidth = Math.min(screenWidth - 32, 560); // 16px margin each side, max 560px

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
        <View style={[styles.container, { backgroundColor }]}>
            {/* Background is always Navy Abyss */}

            <View style={styles.content}>

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
                        style={styles.formContainer}
                        entering={FadeInDown.duration(1200)}
                    >
                        {/* Spacer to push buttons down relative to the moved-up logo */}
                        {/* 
                            StartupAnimation moves up by approx 25% of screen height.
                            We need enough space so the logo doesn't overlap the buttons.
                            The logo is 140px, moves up. 
                            Let's increase spacer to ensure clearance.
                        */}
                        <View style={styles.spacer} />

                        <Pressable
                            disabled={isSigningIn}
                            accessibilityRole="button"
                            accessibilityLabel="Sign In"
                            accessibilityState={{ disabled: isSigningIn }}
                            style={({ pressed }) => [
                                {
                                    width: buttonWidth, // Absolute pixel width: screenWidth - 32
                                    height: 60, // Taller, modern touch target
                                    borderRadius: 16,
                                    alignSelf: 'center',
                                    backgroundColor: 'transparent',
                                    ...(!isDark ? {
                                        shadowColor: '#1e3a8a',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 10,
                                    } : {})
                                }
                            ]}
                            onPress={handleSignIn}
                        >
                            {({ pressed }) => (
                                <View style={{
                                    flex: 1,
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    backgroundColor: pressed ? buttonPressedColor : buttonBaseColor,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                }}>
                                    {isSigningIn ? (
                                        <View className="flex-row items-center gap-3">
                                            <ActivityIndicator size="small" color="white" />
                                            <Text className="text-white font-bold text-lg">Redirecting...</Text>
                                        </View>
                                    ) : (
                                        <Text className="text-white font-bold text-lg tracking-wider">Sign In</Text>
                                    )}
                                </View>
                            )}
                        </Pressable>

                        {/* Error message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Footer - Positioned at bottom of screen, outside formContainer */}
                {showLoginControls && (
                    <Animated.View
                        style={styles.footer}
                        entering={FadeInDown.duration(600).delay(100)}
                    >
                        <Text style={styles.footerText}>
                            Authorized personnel only. Use of this system constitutes consent to monitoring.
                        </Text>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // container backgroundColor is now dynamic
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // Removed paddingHorizontal - absolute children position relative to padding box, causing off-center
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
        position: 'absolute',
        bottom: '25%',
        left: 0,
        right: 0,
        // Padding removed - button now handles its own margins for full-width flexibility
    },
    spacer: {
        height: 80, // Reduced slightly since we moved the logo down (0.25 -> 0.18)
    },
    errorContainer: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(220, 38, 38, 0.15)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.3)',
    },
    errorText: {
        color: '#FCA5A5',
        fontSize: 14,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 48,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
    },
});

