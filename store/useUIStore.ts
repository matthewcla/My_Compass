import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
    isAccountDrawerOpen: boolean;
    activeSpoke: string | null;
    themeMode: ThemeMode;
    openAccountDrawer: () => void;
    closeAccountDrawer: () => void;
    toggleAccountDrawer: () => void;
    setActiveSpoke: (spoke: string | null) => void;
    setThemeMode: (mode: ThemeMode) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isAccountDrawerOpen: false,
            activeSpoke: null,
            themeMode: 'system',
            openAccountDrawer: () => set({ isAccountDrawerOpen: true }),
            closeAccountDrawer: () => set({ isAccountDrawerOpen: false }),
            toggleAccountDrawer: () => set((state) => ({ isAccountDrawerOpen: !state.isAccountDrawerOpen })),
            setActiveSpoke: (spoke) => set({ activeSpoke: spoke }),
            setThemeMode: (mode) => set({ themeMode: mode }),
        }),
        {
            name: 'ui-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ themeMode: state.themeMode }), // Only persist themeMode
        }
    )
);
