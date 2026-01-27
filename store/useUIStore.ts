import { create } from 'zustand';

interface UIState {
    isAccountDrawerOpen: boolean;
    openAccountDrawer: () => void;
    closeAccountDrawer: () => void;
    toggleAccountDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isAccountDrawerOpen: false,
    openAccountDrawer: () => set({ isAccountDrawerOpen: true }),
    closeAccountDrawer: () => set({ isAccountDrawerOpen: false }),
    toggleAccountDrawer: () => set((state) => ({ isAccountDrawerOpen: !state.isAccountDrawerOpen })),
}));
