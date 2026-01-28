import { create } from 'zustand';

interface HeaderState {
    title: string;
    subtitle: string | React.ReactNode;
    rightAction?: { icon: any; onPress: () => void } | null;
    setHeader: (title: string, subtitle: string | React.ReactNode, rightAction?: { icon: any; onPress: () => void } | null) => void;
    resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    title: '',
    subtitle: '',
    rightAction: null,
    setHeader: (title, subtitle, rightAction = null) => set({ title, subtitle, rightAction }),
    resetHeader: () => set({ title: '', subtitle: '', rightAction: null }),
}));
