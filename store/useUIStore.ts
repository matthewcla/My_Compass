import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
    activeSpoke: string | null;
    themeMode: ThemeMode;
    setActiveSpoke: (spoke: string | null) => void;
    setThemeMode: (mode: ThemeMode) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            activeSpoke: null,
            themeMode: 'system',
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
