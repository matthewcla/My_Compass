import { create } from 'zustand';

export interface SearchConfig {
    visible: boolean;
    mode?: 'local' | 'global';
    onChangeText?: (text: string) => void;
    onPress?: () => void;
    placeholder?: string;
    value?: string;
}

interface HeaderState {
    title: string;
    subtitle: string | React.ReactNode;
    rightAction?: { icon: any; onPress: () => void } | null;
    searchConfig?: SearchConfig | null;
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
    setVisible: (visible: boolean) => void;
    resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    title: '',
    subtitle: '',
    rightAction: null,
    searchConfig: null,
    isVisible: true,
    variant: 'large',
    setHeader: (title, subtitle, rightAction = null, variant = 'large', searchConfig = null) =>
        set({ title, subtitle, rightAction, isVisible: true, variant, searchConfig }),
    setSearchConfig: (searchConfig) => set({ searchConfig }),
    setVisible: (visible) => set({ isVisible: visible }),
    resetHeader: () => set({ title: '', subtitle: '', rightAction: null, isVisible: true, variant: 'large', searchConfig: null }),
}));
