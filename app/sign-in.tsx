import { Anchor } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useSession } from '@/lib/ctx';

/**
 * Okta Login Screen
 * 
 * A professional, Navy-branded landing page for authentication.
 * On button press, initiates mock Okta OIDC flow via SessionProvider.
 */
export default function SignInScreen() {
    const { signInWithOkta, isSigningIn } = useSession();
    const [error, setError] = useState<string | null>(null);

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
            {/* Background gradient overlay */}
            <View style={styles.backgroundOverlay} />

            {/* Content container */}
            <View style={styles.content}>
                {/* Logo / App Identity */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Anchor size={64} color="#FFFFFF" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.appName}>My Compass</Text>
                    <Text style={styles.tagline}>Navy Career Navigation System</Text>
                </View>

                {/* Spacer */}
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
                            <ActivityIndicator size="small" color="#FFFFFF" />
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
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A1628', // Navy dark blue
    },
    backgroundOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        // In a real app, you might add an SVG background or gradient here
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1E3A5F', // Lighter navy blue
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 3,
        borderColor: '#C9A227', // Gold accent
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    appName: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: '#8BA3C7', // Muted blue-grey
        letterSpacing: 0.5,
    },
    spacer: {
        height: 80,
    },
    signInButton: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#0066CC', // Primary blue
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        // Shadow
        shadowColor: '#0066CC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    signInButtonPressed: {
        backgroundColor: '#0052A3', // Darker blue on press
        transform: [{ scale: 0.98 }],
    },
    signInButtonDisabled: {
        backgroundColor: '#4A5568', // Grey when disabled
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
        color: '#FFFFFF',
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
        position: 'absolute',
        bottom: 48,
        left: 32,
        right: 32,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
    },
});
