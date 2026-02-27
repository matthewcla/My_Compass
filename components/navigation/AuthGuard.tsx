import { useSession } from '@/lib/ctx';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export function AuthGuard() {
    const { session, isLoading: isSessionLoading, consentAcknowledged } = useSession();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isSessionLoading) return;

        // Check if the current segment is in a protected group
        // We check the first segment to determine the context
        const currentGroup = segments[0];

        // List of protected top-level routes/groups
        const protectedGroups = [
            '(hub)',
            '(assignment)',
            '(career)',
            '(pcs)',
            '(admin)',
            '(profile)',
            '(calendar)',
            'inbox',
            'leave',
            'menu'
        ];

        const inAuthGroup = protectedGroups.includes(currentGroup);
        const inPublicGroup = currentGroup === 'sign-in';
        const inConsentScreen = currentGroup === 'consent';

        // 1. If Unauthenticated and trying to access protected content -> Redirect to Sign In
        if (!session && inAuthGroup) {
            router.replace('/sign-in');
        }
        // 2. If Authenticated but consent not yet acknowledged -> Redirect to Consent (AC-8)
        else if (session && !consentAcknowledged && (inPublicGroup || inAuthGroup)) {
            router.replace('/consent');
        }
        // 3. If Authenticated, consent acknowledged, and on sign-in or consent screen -> Redirect to Hub
        else if (session && consentAcknowledged && (inPublicGroup || inConsentScreen)) {
            router.replace('/(tabs)' as any);
        }
    }, [session, isSessionLoading, consentAcknowledged, segments]);

    return null; // This component renders nothing
}
