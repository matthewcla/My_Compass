import { useHeaderStore } from '@/store/useHeaderStore';
import { NavigationContext } from '@react-navigation/native';
import { useContext, useEffect, useRef } from 'react';

import { SearchConfig } from '@/store/useHeaderStore';

export function useScreenHeader(
    title: string,
    subtitle: string | React.ReactNode,
    rightAction?: { icon: any; onPress: () => void },
    searchConfig?: SearchConfig | null,
    leftAction?: { icon: any; onPress: () => void } | null
) {
    const setHeader = useHeaderStore((state) => state.setHeader);
    const navigation = useContext(NavigationContext);
    const navigationRef = useRef(navigation);
    navigationRef.current = navigation;

    useEffect(() => {
        let frame: number | null = null;
        let unsubscribeFocus: (() => void) | undefined;

        const applyHeader = () => {
            if (frame !== null) {
                cancelAnimationFrame(frame);
            }

            frame = requestAnimationFrame(() => {
                setHeader(title, subtitle, rightAction, 'large', searchConfig, leftAction);
                frame = null;
            });
        };

        // Always apply once on mount/update.
        applyHeader();

        // Best-effort re-apply on focus when a navigation object is present.
        if (navigationRef.current?.addListener) {
            try {
                unsubscribeFocus = navigationRef.current.addListener('focus', applyHeader);
            } catch {
                // Ignore navigation-context timing issues and keep non-focus behavior.
            }
        }

        return () => {
            unsubscribeFocus?.();
            if (frame !== null) {
                cancelAnimationFrame(frame);
            }
        };
    }, [title, subtitle, rightAction, searchConfig, leftAction, setHeader]);
}
