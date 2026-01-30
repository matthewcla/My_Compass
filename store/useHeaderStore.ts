import { create } from 'zustand';

interface HeaderState {
    title: string;
    subtitle: string | React.ReactNode;
    rightAction?: { icon: any; onPress: () => void } | null;
    isVisible: boolean;
    variant: 'large' | 'inline';
    setHeader: (
        title: string,
        subtitle: string | React.ReactNode,
        rightAction?: { icon: any; onPress: () => void } | null,
        variant?: 'large' | 'inline'
    ) => void;
    setVisible: (visible: boolean) => void;
    resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    title: '',
    subtitle: '',
    rightAction: null,
    isVisible: true,
    variant: 'large',
    setHeader: (title, subtitle, rightAction = null, variant = 'large') =>
        set({ title, subtitle, rightAction, isVisible: true, variant }),
    setVisible: (visible) => set({ isVisible: visible }),
    resetHeader: () => set({ title: '', subtitle: '', rightAction: null, isVisible: true, variant: 'large' }),
}));
