import { Href, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback } from 'react';

/**
 * Reusable hook that supplies the leftAction prop for ScreenHeader.
 * It provides a consistent back chevron and handles routing:
 * - If there is navigation history, it pops the stack `router.back()`.
 * - If there is no history (e.g., deep link or push notification),
 *   it falls back to a provided default route.
 *
 * @param fallbackRoute The route to fallback to if `canGoBack()` is false. Defaults to the Home hub.
 * @returns Component props for the `leftAction` in `ScreenHeader`.
 */
export function useGlobalBackAction(fallbackRoute: Href = '/(tabs)/(hub)') {
    const router = useRouter();

    const handlePress = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace(fallbackRoute);
        }
    }, [router, fallbackRoute]);

    return {
        icon: ChevronLeft,
        onPress: handlePress,
    };
}
