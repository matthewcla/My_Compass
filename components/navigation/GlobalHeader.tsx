import { ScreenHeader } from '@/components/ScreenHeader';
import { useHeaderStore } from '@/store/useHeaderStore';
import { usePathname, useSegments } from 'expo-router';
import React from 'react';

export default function GlobalHeader() {
    const segments = useSegments();
    const segmentList = segments as string[];
    const title = useHeaderStore((state) => state.title);
    const subtitle = useHeaderStore((state) => state.subtitle);
    const rightAction = useHeaderStore((state) => state.rightAction);
    const isVisible = useHeaderStore((state) => state.isVisible);
    const variant = useHeaderStore((state) => state.variant);
    const searchConfig = useHeaderStore((state) => state.searchConfig);
    const pathname = usePathname();
    const isMenuModalRoute = segmentList.includes('MenuHubModal') || pathname.includes('MenuHubModal');

    // Hide on Sign In
    if (segments[0] === 'sign-in') return null;

    // Hide on Menu modal route (full-screen modal uses its own local header fallback)
    if (isMenuModalRoute) return null;

    // Check if there is any content to show
    const hasContent = title || subtitle || rightAction || (searchConfig && searchConfig.visible);

    // Explicit visibility check and content check
    if (!isVisible || !hasContent) return null;

    return (
        <ScreenHeader
            title={title}
            subtitle={subtitle}
            rightAction={rightAction}
            withSafeArea={true}
            variant={variant}
            searchConfig={searchConfig}
        />
    );
}
