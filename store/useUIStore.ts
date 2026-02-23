import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
    activeSpoke: string | null;
    themeMode: ThemeMode;
    themeTransitionImage: string | null;
    themeTransitionColor: string | null;
    setActiveSpoke: (spoke: string | null) => void;
    setThemeMode: (mode: ThemeMode) => void;
    setThemeTransitionImage: (uri: string | null) => void;
    setThemeTransitionColor: (color: string | null) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            activeSpoke: null,
            themeMode: 'system',
            themeTransitionImage: null,
            themeTransitionColor: null,
            setActiveSpoke: (spoke) => set({ activeSpoke: spoke }),
            setThemeMode: (mode) => set({ themeMode: mode }),
            setThemeTransitionImage: (uri) => set({ themeTransitionImage: uri }),
            setThemeTransitionColor: (color) => set({ themeTransitionColor: color }),
        }),
        {
            name: 'ui-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ themeMode: state.themeMode }), // Only persist themeMode
        }
    )
);
