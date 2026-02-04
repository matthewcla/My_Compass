import { useSession } from '@/lib/ctx';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export function AuthGuard() {
    const { session, isLoading: isSessionLoading } = useSession();
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

        // 1. If Unauthenticated and trying to access protected content -> Redirect to Sign In
        if (!session && inAuthGroup) {
            router.replace('/sign-in');
        }
        // 2. If Authenticated and trying to access Sign In -> Redirect to Hub
        else if (session && inPublicGroup) {
            router.replace('/(hub)');
        }
    }, [session, isSessionLoading, segments]);

    return null; // This component renders nothing
}
