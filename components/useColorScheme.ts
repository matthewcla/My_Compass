import { useUIStore } from '@/store/useUIStore';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
    const systemColorScheme = useNativeColorScheme();
    const themeMode = useUIStore((state) => state.themeMode);

    const effectiveScheme = themeMode === 'system' ? (systemColorScheme ?? 'light') : themeMode;

    useEffect(() => {
        try {
            // NativeWind v4: Use the global colorScheme object rather than the hook for reliable Web execution
            nativewindColorScheme.set(effectiveScheme);
        } catch (e) {
            console.warn('[Theme] nativewindColorScheme.set error:', e);
        }

        // Web fallback: Ensure the dark class is forcefully applied to the HTML element
        if (typeof document !== 'undefined' && document.documentElement) {
            if (effectiveScheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [effectiveScheme]);

    return effectiveScheme;
}

