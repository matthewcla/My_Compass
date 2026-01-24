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
                        entering={FadeInDown.duration(600).springify().damping(15)}
                    >
                        {/* Spacer to push buttons down relative to the moved-up logo */}
                        {/* 
                            StartupAnimation moves up by approx 25% of screen height.
                            We need enough space so the logo doesn't overlap the buttons.
                            The logo is 140px, moves up. 
                            Let's increase spacer to ensure clearance.
                        */}
                        <View style={styles.spacer} />

                        {/* Sign In Button - Glass Cockpit Style (Option B) */}
                        <Pressable
                            className={`
                                w-full max-w-xs h-14 rounded-2xl self-center
                                bg-white/10 border border-white/20
                                items-center justify-center
                                active:bg-white/20 active:scale-95
                                ${isSigningIn ? 'opacity-50' : ''}
                            `}
                            onPress={handleSignIn}
                            disabled={isSigningIn}
                            accessibilityRole="button"
                            accessibilityLabel="Sign in with Okta"
                            accessibilityState={{ disabled: isSigningIn }}
                        >
                            {isSigningIn ? (
                                <View className="flex-row items-center gap-3">
                                    <ActivityIndicator size="small" color="white" />
                                    <Text className="text-white font-semibold text-lg">Redirecting to Okta...</Text>
                                </View>
                            ) : (
                                <Text className="text-white font-semibold text-lg tracking-wide">Sign In with Okta</Text>
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
    container: {
        flex: 1,
        backgroundColor: '#0A1628', // Navy Abyss
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
        paddingHorizontal: 32, // Apply padding at this level for proper centering
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

