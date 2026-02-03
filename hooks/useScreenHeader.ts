import { useHeaderStore } from '@/store/useHeaderStore';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export function useScreenHeader(
    title: string,
    subtitle: string | React.ReactNode,
    rightAction?: { icon: any; onPress: () => void },
    variant: 'large' | 'inline' = 'large'
) {
    const setHeader = useHeaderStore((state) => state.setHeader);

    useFocusEffect(
        useCallback(() => {
            // When screen comes into focus, set the header
            // Use requestAnimationFrame to avoid "update on unmounted component" or race conditions
            // during initial mount if the screen is immediately focused.
            requestAnimationFrame(() => {
                setHeader(title, subtitle, rightAction, variant);
            });
        }, [title, subtitle, rightAction, variant, setHeader])
    );
}
