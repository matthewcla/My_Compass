import { create } from 'zustand';

interface UIState {
    isAccountDrawerOpen: boolean;
    activeSpoke: string | null;
    openAccountDrawer: () => void;
    closeAccountDrawer: () => void;
    toggleAccountDrawer: () => void;
    setActiveSpoke: (spoke: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isAccountDrawerOpen: false,
    activeSpoke: null,
    openAccountDrawer: () => set({ isAccountDrawerOpen: true }),
    closeAccountDrawer: () => set({ isAccountDrawerOpen: false }),
    toggleAccountDrawer: () => set((state) => ({ isAccountDrawerOpen: !state.isAccountDrawerOpen })),
    setActiveSpoke: (spoke) => set({ activeSpoke: spoke }),
}));
