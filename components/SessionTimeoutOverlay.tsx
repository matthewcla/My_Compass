import { Clock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

interface SessionTimeoutOverlayProps {
    visible: boolean;
    remainingSeconds: number;
    onExtend: () => void;
}

/**
 * IA-11: Session timeout warning overlay.
 *
 * Shown when the user has been idle for 5 minutes.
 * Tapping anywhere (backdrop or button) extends the session.
 * Automatically dismissed by the parent when the timer is reset.
 */
export function SessionTimeoutOverlay({ visible, remainingSeconds, onExtend }: SessionTimeoutOverlayProps) {
    if (!visible) return null;

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
    const isUrgent = remainingSeconds <= 60;

    return (
        <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(200)}
            style={StyleSheet.absoluteFill}
            pointerEvents="box-none"
        >
            {/* Backdrop — tap anywhere to extend */}
            <Pressable
                style={[StyleSheet.absoluteFill, styles.backdrop]}
                onPress={onExtend}
                accessibilityLabel="Tap to extend your session"
            />

            {/* Warning card */}
            <Animated.View
                entering={FadeInDown.delay(80).springify()}
                style={styles.cardContainer}
                pointerEvents="box-none"
            >
                <View style={styles.card}>
                    {/* Icon */}
                    <View style={styles.iconRow}>
                        <Clock
                            size={28}
                            color={isUrgent ? '#ef4444' : '#f59e0b'}
                            strokeWidth={1.5}
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Session Expiring</Text>

                    {/* Countdown */}
                    <Text style={[styles.countdown, isUrgent && styles.countdownUrgent]}>
                        {timeStr}
                    </Text>

                    {/* Message */}
                    <Text style={styles.message}>
                        You will be signed out due to inactivity.{'\n'}
                        Tap to continue your session.
                    </Text>

                    {/* Extend button */}
                    <Pressable
                        onPress={onExtend}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.buttonPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Extend session"
                    >
                        <Text style={styles.buttonText}>Extend Session</Text>
                    </Pressable>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.50)',
    },
    cardContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    card: {
        backgroundColor: '#0A1628',
        borderRadius: 0,
        paddingVertical: 32,
        paddingHorizontal: 28,
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
        borderWidth: 2,
        borderColor: '#C9A227',
        // Brutalist hard shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 12,
    },
    iconRow: {
        marginBottom: 12,
    },
    title: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    countdown: {
        color: '#f59e0b',
        fontSize: 48,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        letterSpacing: 2,
        marginBottom: 16,
    },
    countdownUrgent: {
        color: '#ef4444',
    },
    message: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#C9A227',
        borderRadius: 0,
        paddingVertical: 14,
        paddingHorizontal: 40,
        alignItems: 'center',
        width: '100%',
    },
    buttonPressed: {
        backgroundColor: '#d97706',
    },
    buttonText: {
        color: '#0A1628',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
