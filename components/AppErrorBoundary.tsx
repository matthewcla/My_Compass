import type { ErrorBoundaryProps } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * SI-11: Global application error boundary.
 *
 * Exported as `ErrorBoundary` from `app/_layout.tsx` so Expo Router
 * intercepts all unhandled errors in the navigation tree.
 *
 * Security requirements:
 * - NEVER display raw error messages or stack traces to the user.
 * - NEVER log PII from the error object.
 * - Show only a safe, generic message with a support reference code.
 *
 * The `error` prop is intentionally not shown in the UI. It is available
 * here only for future integration with a crash reporting service.
 */
export function AppErrorBoundary({ retry }: ErrorBoundaryProps) {
    const insets = useSafeAreaInsets();

    // Generate a short, non-sensitive reference code for support triage.
    // This is time-based only — no user data, no error content.
    const refCode = `MC-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    return (
        <View
            className="flex-1 bg-[#0A1628] justify-center items-center px-8"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            {/* Icon */}
            <AlertTriangle size={48} color="#f59e0b" strokeWidth={1.5} />

            {/* Title */}
            <Text className="text-white font-bold text-xl mt-6 text-center">
                System Error
            </Text>

            {/* Safe, generic message — no raw error content */}
            <Text className="text-white/60 text-sm text-center mt-3 leading-6 max-w-xs">
                An unexpected error occurred. Your session data has been preserved.
                If this issue persists, contact your system administrator.
            </Text>

            {/* Support reference code — time-based only, no PII */}
            <View className="mt-5 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <Text className="text-white/40 text-xs text-center font-mono tracking-widest">
                    Ref: {refCode}
                </Text>
            </View>

            {/* Retry */}
            <Pressable
                onPress={retry}
                accessibilityRole="button"
                accessibilityLabel="Retry"
                className="mt-8 bg-amber-400 rounded-2xl py-4 px-12 active:bg-amber-500"
            >
                <Text className="text-[#0A1628] font-bold text-base tracking-wide">
                    Retry
                </Text>
            </Pressable>

            {/* Footer */}
            <Text className="text-white/20 text-xs text-center mt-6">
                My Compass — U.S. Navy Personnel Management
            </Text>
        </View>
    );
}
