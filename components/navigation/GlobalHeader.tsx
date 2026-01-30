import { ScreenHeader } from '@/components/ScreenHeader';
import { useHeaderStore } from '@/store/useHeaderStore';
import { usePathname, useSegments } from 'expo-router';
import React from 'react';

export default function GlobalHeader() {
    const segments = useSegments();
    const title = useHeaderStore((state) => state.title);
    const subtitle = useHeaderStore((state) => state.subtitle);
    const rightAction = useHeaderStore((state) => state.rightAction);
    const isVisible = useHeaderStore((state) => state.isVisible);
    const variant = useHeaderStore((state) => state.variant);
    const pathname = usePathname();

    // Hide on Sign In
    // Also check if we are on the root index (splash) if needed, currently just sign-in
    if (segments[0] === 'sign-in') return null;

    // Explicit visibility check
    if (!isVisible) return null;

    // Also hide if no title is set (optional safety)
    if (!title) return null;

    return (
        <ScreenHeader
            title={title}
            subtitle={subtitle}
            rightAction={rightAction}
            withSafeArea={true}
            variant={variant}
        />
    );
}
