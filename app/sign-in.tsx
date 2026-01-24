import React, { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import StartupAnimation from '@/components/StartupAnimation';
import Colors from '@/constants/Colors';
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

    return (
        <View style={styles.container}>
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
                        entering={FadeInDown.duration(800).springify()}
                    >
                        {/* Spacer to push buttons down relative to the moved-up logo */}
                        <View style={styles.spacer} />

                        {/* Sign In Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.signInButton,
                                pressed && styles.signInButtonPressed,
                                isSigningIn && styles.signInButtonDisabled,
                            ]}
                            onPress={handleSignIn}
                            disabled={isSigningIn}
                            accessibilityRole="button"
                            accessibilityLabel="Sign in with Okta"
                            accessibilityState={{ disabled: isSigningIn }}
                        >
                            {isSigningIn ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="white" />
                                    <Text style={styles.buttonText}>Redirecting to Okta...</Text>
                                </View>
                            ) : (
                                <Text style={styles.buttonText}>Sign In with Okta</Text>
                            )}
                        </Pressable>

                        {/* Error message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Authorized personnel only. Use of this system constitutes consent to monitoring.
                            </Text>
                        </View>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A1628', // Navy Abyss
    },
    content: {
        flex: 1,
        justifyContent: 'center', // Center vertically initially
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
    },
    spacer: {
        height: 60, // Adjust based on where component lands
    },
    signInButton: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: Colors.light.systemBlue,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.light.systemBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    signInButtonPressed: {
        backgroundColor: '#0052A3',
        transform: [{ scale: 0.98 }],
    },
    signInButtonDisabled: {
        backgroundColor: '#4A5568',
        shadowOpacity: 0.1,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        letterSpacing: 0.5,
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
        marginTop: 48,
        paddingHorizontal: 16,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
    },
});

