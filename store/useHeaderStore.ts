import { create } from 'zustand';

interface HeaderState {
    title: string;
    subtitle: string | React.ReactNode;
    rightAction?: { icon: any; onPress: () => void } | null;
    isVisible: boolean;
    setHeader: (title: string, subtitle: string | React.ReactNode, rightAction?: { icon: any; onPress: () => void } | null) => void;
    setVisible: (visible: boolean) => void;
    resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    title: '',
    subtitle: '',
    rightAction: null,
    isVisible: true,
    setHeader: (title, subtitle, rightAction = null) => set({ title, subtitle, rightAction, isVisible: true }),
    setVisible: (visible) => set({ isVisible: visible }),
    resetHeader: () => set({ title: '', subtitle: '', rightAction: null, isVisible: true }),
}));
