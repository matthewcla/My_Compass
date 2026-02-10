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

export interface GlobalSearchFrame {
    x: number;
    y: number;
    width: number;
    height: number;
    bottom: number;
    borderRadius: number;
    measuredAt: number;
}

let globalSearchBlurHandler: (() => void) | null = null;
let globalSearchSubmitHandler: (() => void) | null = null;
let globalSearchDismissHandler: (() => void) | null = null;

interface HeaderState {
    title: string;
    subtitle: string | React.ReactNode;
    leftAction?: { icon: any; onPress: () => void } | null;
    rightAction?: { icon: any; onPress: () => void } | null;
    searchConfig?: SearchConfig | null;
    globalSearchBottomY: number | null;
    globalSearchFrame: GlobalSearchFrame | null;
    isVisible: boolean;
    variant: 'large' | 'inline';
    setHeader: (
        title: string,
        subtitle: string | React.ReactNode,
        rightAction?: { icon: any; onPress: () => void } | null,
        variant?: 'large' | 'inline',
        searchConfig?: SearchConfig | null,
        leftAction?: { icon: any; onPress: () => void } | null
    ) => void;
    setSearchConfig: (config: SearchConfig | null) => void;
    setGlobalSearchBottomY: (value: number | null) => void;
    setGlobalSearchFrame: (frame: GlobalSearchFrame | null) => void;
    setVisible: (visible: boolean) => void;
    registerGlobalSearchBlur: (fn: (() => void) | null) => void;
    blurGlobalSearchInput: () => void;
    registerGlobalSearchSubmit: (fn: (() => void) | null) => void;
    triggerGlobalSearchSubmit: () => void;
    registerGlobalSearchDismiss: (fn: (() => void) | null) => void;
    triggerGlobalSearchDismiss: () => void;
    resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    title: '',
    subtitle: '',
    leftAction: null,
    rightAction: null,
    searchConfig: null,
    globalSearchBottomY: null,
    globalSearchFrame: null,
    isVisible: true,
    variant: 'large',
    setHeader: (title, subtitle, rightAction = null, variant = 'large', searchConfig = null, leftAction = null) =>
        set((state) => {
            const isSame =
                state.title === title &&
                state.subtitle === subtitle &&
                state.leftAction === leftAction &&
                state.rightAction === rightAction &&
                state.variant === variant &&
                state.searchConfig === searchConfig &&
                state.isVisible === true;

            if (isSame) {
                return state;
            }

            return { title, subtitle, leftAction, rightAction, isVisible: true, variant, searchConfig };
        }),
    setSearchConfig: (searchConfig) => set({ searchConfig }),
    setGlobalSearchBottomY: (globalSearchBottomY) => set({ globalSearchBottomY }),
    setGlobalSearchFrame: (globalSearchFrame) =>
        set({
            globalSearchFrame,
            globalSearchBottomY: globalSearchFrame?.bottom ?? null,
        }),
    setVisible: (visible) => set({ isVisible: visible }),
    registerGlobalSearchBlur: (fn) => {
        globalSearchBlurHandler = fn;
    },
    blurGlobalSearchInput: () => {
        globalSearchBlurHandler?.();
    },
    registerGlobalSearchSubmit: (fn) => {
        globalSearchSubmitHandler = fn;
    },
    triggerGlobalSearchSubmit: () => {
        globalSearchSubmitHandler?.();
    },
    registerGlobalSearchDismiss: (fn) => {
        globalSearchDismissHandler = fn;
    },
    triggerGlobalSearchDismiss: () => {
        globalSearchDismissHandler?.();
    },
    resetHeader: () =>
        set({
            title: '',
            subtitle: '',
            leftAction: null,
            rightAction: null,
            isVisible: true,
            variant: 'large',
            searchConfig: null,
            globalSearchBottomY: null,
            globalSearchFrame: null,
        }),
}));
