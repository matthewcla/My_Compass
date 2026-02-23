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
        // Sync our derived effective scheme with NativeWind so tailwind updates
        setColorScheme(effectiveScheme);
    }, [effectiveScheme, setColorScheme]);

    return effectiveScheme;
}
