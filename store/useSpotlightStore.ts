import { SpotlightOpenSource, SpotlightScope } from '@/types/spotlight';
import { create } from 'zustand';

const MAX_RECENT_ITEMS = 8;

interface SpotlightOpenOptions {
    seedQuery?: string;
    source?: SpotlightOpenSource;
    preserveQuery?: boolean;
}

interface SpotlightState {
    isOpen: boolean;
    query: string;
    scope: SpotlightScope;
    source: SpotlightOpenSource;
    activeIndex: number;
    recentItemIds: string[];
    open: (options?: SpotlightOpenOptions) => void;
    close: () => void;
    setQuery: (value: string) => void;
    setScope: (scope: SpotlightScope) => void;
    setActiveIndex: (index: number) => void;
    registerRecent: (itemId: string) => void;
}

export const useSpotlightStore = create<SpotlightState>((set) => ({
    isOpen: false,
    query: '',
    scope: 'all',
    source: 'shortcut',
    activeIndex: 0,
    recentItemIds: [],

    open: (options = {}) =>
        set((state) => ({
            isOpen: true,
            query: options.preserveQuery ? state.query : (options.seedQuery ?? ''),
            scope: 'all',
            source: options.source ?? 'shortcut',
            activeIndex: 0,
        })),

    close: () =>
        set({
            isOpen: false,
            query: '',
            scope: 'all',
            source: 'shortcut',
            activeIndex: 0,
        }),

    setQuery: (query) => set({ query }),

    setScope: (scope) =>
        set({
            scope,
            activeIndex: 0,
        }),

    setActiveIndex: (activeIndex) => set({ activeIndex }),

    registerRecent: (itemId) =>
        set((state) => ({
            recentItemIds: [itemId, ...state.recentItemIds.filter((id) => id !== itemId)].slice(0, MAX_RECENT_ITEMS),
        })),
}));
