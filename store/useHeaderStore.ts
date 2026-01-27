import { create } from 'zustand';

interface HeaderState {
    title: string;
    subtitle: string | React.ReactNode;
    setHeader: (title: string, subtitle: string | React.ReactNode) => void;
    resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    title: '',
    subtitle: '',
    setHeader: (title, subtitle) => set({ title, subtitle }),
    resetHeader: () => set({ title: '', subtitle: '' }),
}));
