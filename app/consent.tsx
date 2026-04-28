import { useEffect } from 'react';
import { useSession } from '@/lib/ctx';
import { View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * AC-8: DoD Notice and Consent Banner
 *
 * STUBBED OUT FOR DEVELOPMENT:
 * Automatically acknowledges consent to bypass the legal banner.
 */
export default function ConsentScreen() {
    const { acknowledgeConsent } = useSession();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        // Auto-acknowledge to bypass the consent screen
        const timer = setTimeout(() => {
            acknowledgeConsent();
        }, 100);
        return () => clearTimeout(timer);
    }, [acknowledgeConsent]);

    return (
        <View
            className="flex-1 bg-[#0A1628] justify-center items-center"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <ActivityIndicator color="#fbbf24" size="large" />
        </View>
    );
}
