import { SearchConfig } from '@/store/useHeaderStore';
import { useSpotlightStore } from '@/store/useSpotlightStore';
import { SpotlightOpenSource } from '@/types/spotlight';
import { useCallback, useMemo } from 'react';

interface UseGlobalSpotlightHeaderSearchOptions {
    source?: SpotlightOpenSource;
    placeholder?: string;
    visible?: boolean;
}

export function useGlobalSpotlightHeaderSearch(
    options: UseGlobalSpotlightHeaderSearchOptions = {}
): SearchConfig {
    const {
        source = 'primary',
        placeholder = 'Search all app functions...',
        visible = true,
    } = options;

    const openSpotlight = useSpotlightStore((state) => state.open);
    const spotlightQuery = useSpotlightStore((state) => state.query);
    const setSpotlightQuery = useSpotlightStore((state) => state.setQuery);

    const ensureSpotlightOpen = useCallback(() => {
        if (!useSpotlightStore.getState().isOpen) {
            openSpotlight({ source, preserveQuery: true });
        }
    }, [openSpotlight, source]);

    const handleGlobalSearchChange = useCallback(
        (text: string) => {
            ensureSpotlightOpen();
            setSpotlightQuery(text);
        },
        [ensureSpotlightOpen, setSpotlightQuery]
    );

    return useMemo(
        () => ({
            visible,
            mode: 'global' as const,
            onPress: ensureSpotlightOpen,
            onChangeText: handleGlobalSearchChange,
            placeholder,
            value: spotlightQuery,
        }),
        [
            ensureSpotlightOpen,
            handleGlobalSearchChange,
            placeholder,
            spotlightQuery,
            visible,
        ]
    );
}
