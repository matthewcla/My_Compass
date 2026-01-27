import { useHeaderStore } from '@/store/useHeaderStore';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export function useScreenHeader(title: string, subtitle: string | React.ReactNode) {
    const setHeader = useHeaderStore((state) => state.setHeader);

    useFocusEffect(
        useCallback(() => {
            // When screen comes into focus, set the header
            setHeader(title, subtitle);
        }, [title, subtitle, setHeader])
    );
}
