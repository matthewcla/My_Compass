import { useUIStore } from '@/store/useUIStore';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
    const systemColorScheme = useNativeColorScheme();
    const themeMode = useUIStore((state) => state.themeMode);
    const { setColorScheme } = useNativeWindColorScheme();

    const effectiveScheme = themeMode === 'system' ? (systemColorScheme ?? 'light') : themeMode;

    useEffect(() => {
        // Sync our derived effective scheme with NativeWind so tailwind updates.
        // Guard against race condition: the NativeWind CSS (with darkMode flag)
        // may not have been injected into the runtime yet on first render.
        try {
            setColorScheme(effectiveScheme);
        } catch {
            // darkMode flag not yet available — will succeed on next render cycle
        }
    }, [effectiveScheme, setColorScheme]);

    return effectiveScheme;
}

