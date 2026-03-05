import { useSession } from '@/lib/ctx';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';

export default function AdminLayout() {
    const { session, isLoading } = useSession();
    const segments = useSegments();
    const router = useRouter();

    // Auth redirect logic
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'sign-in';

        if (!session && !inAuthGroup) {
            router.replace('/sign-in');
        } else if (session && inAuthGroup) {
            router.replace('/(admin)' as any);
        }
    }, [session, isLoading, segments]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
        </Stack>
    );
}
