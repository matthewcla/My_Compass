import { create } from 'zustand';

export interface LocalSearchConfig {
    visible: boolean;
    mode?: 'local';
    onChangeText: (text: string) => void;
    onPress?: () => void;
    placeholder?: string;
    value?: string;
}

export interface GlobalSearchConfig {
    visible: boolean;
    mode: 'global';
    onPress: () => void;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    value?: string;
}

export type SearchConfig = LocalSearchConfig | GlobalSearchConfig;

let globalSearchBlurHandler: (() => void) | null = null;

interface HeaderState {
    title: string;
    subtitle: string | React.ReactNode;
    rightAction?: { icon: any; onPress: () => void } | null;
    searchConfig?: SearchConfig | null;
    globalSearchBottomY: number | null;
    isVisible: boolean;
    variant: 'large' | 'inline';
    setHeader: (
        title: string,
        subtitle: string | React.ReactNode,
        rightAction?: { icon: any; onPress: () => void } | null,
        variant?: 'large' | 'inline',
        searchConfig?: SearchConfig | null
    ) => void;
    setSearchConfig: (config: SearchConfig | null) => void;
    setGlobalSearchBottomY: (value: number | null) => void;
    setVisible: (visible: boolean) => void;
    registerGlobalSearchBlur: (fn: (() => void) | null) => void;
    blurGlobalSearchInput: () => void;
    resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    title: '',
    subtitle: '',
    rightAction: null,
    searchConfig: null,
    globalSearchBottomY: null,
    isVisible: true,
    variant: 'large',
    setHeader: (title, subtitle, rightAction = null, variant = 'large', searchConfig = null) =>
        set((state) => {
            const isSame =
                state.title === title &&
                state.subtitle === subtitle &&
                state.rightAction === rightAction &&
                state.variant === variant &&
                state.searchConfig === searchConfig &&
                state.isVisible === true;

            if (isSame) {
                return state;
            }

            return { title, subtitle, rightAction, isVisible: true, variant, searchConfig };
        }),
    setSearchConfig: (searchConfig) => set({ searchConfig }),
    setGlobalSearchBottomY: (globalSearchBottomY) => set({ globalSearchBottomY }),
    setVisible: (visible) => set({ isVisible: visible }),
    registerGlobalSearchBlur: (fn) => {
        globalSearchBlurHandler = fn;
    },
    blurGlobalSearchInput: () => {
        globalSearchBlurHandler?.();
    },
    resetHeader: () =>
        set({
            title: '',
            subtitle: '',
            rightAction: null,
            isVisible: true,
            variant: 'large',
            searchConfig: null,
            globalSearchBottomY: null,
        }),
}));
