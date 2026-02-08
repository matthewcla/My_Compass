import React, { createContext, ReactNode, useContext } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
    Easing,
    runOnJS,
    SharedValue,
    useAnimatedScrollHandler,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

// --- Constants ---
// Define the height of the tab bar that we want to potentially hide.
// This should match the visual height of your TabBar component including safe area/bottom inset.
// You might want to make this dynamic or pass it in via props if it varies.
const TAB_BAR_HEIGHT = 100; // Adjust: e.g. 60 + bottom inset

// --- Types ---

interface ScrollControlContextType {
    /**
     * The shared value driven by scroll events.
     * Ranges from 0 (fully visible) to TAB_BAR_HEIGHT (fully hidden, translated down).
     */
    translateY: SharedValue<number>;

    /**
     * Function to force the tab bar to become visible.
     * Useful when navigating between tabs to ensure the user lands on a screen with the bar shown.
     */
    resetBar: () => void;
}

// --- Context ---

const ScrollControlContext = createContext<ScrollControlContextType | undefined>(undefined);

// --- Provider ---

interface ScrollControlProviderProps {
    children: ReactNode;
}

export function ScrollControlProvider({ children }: ScrollControlProviderProps) {
    const translateY = useSharedValue(0);

    const resetBar = () => {
        'worklet';
        translateY.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.quad),
        });
    };

    // JS-friendly wrapper for resetBar
    const resetBarJS = () => {
        translateY.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.quad),
        });
    };

    return (
        <ScrollControlContext.Provider value={{ translateY, resetBar: resetBarJS }}>
            {children}
        </ScrollControlContext.Provider>
    );
}

// --- Hook: useScrollControl ---

/**
 * Hook to be used in ScrollViews / FlatLists to drive the collapsible tab bar.
 */
export function useScrollControl(args?: {
    onScroll?: (event: unknown) => void;
}) {
    const context = useContext(ScrollControlContext);

    if (!context) {
        throw new Error('useScrollControl must be used within a ScrollControlProvider');
    }

    const { translateY } = context;

    // track the *previous* scroll offset
    const lastScrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            // 1. Calculate the diff
            const currentScrollY = event.contentOffset.y;
            const diff = currentScrollY - lastScrollY.value;

            // 2. Diff-Clamp Logic (for Bottom Bar)
            // Scroll Down (diff > 0) -> Hide (increase translateY)
            // Scroll Up (diff < 0) -> Show (decrease translateY)
            let nextValue = translateY.value + diff;

            // Clamp between 0 (Visible) and TAB_BAR_HEIGHT (Hidden)
            if (nextValue < 0) {
                nextValue = 0;
            } else if (nextValue > TAB_BAR_HEIGHT) {
                nextValue = TAB_BAR_HEIGHT;
            }

            // 3. Overscroll at Top Logic
            // If we are at the very top (scrollY < 0 on iOS), force visible.
            if (currentScrollY < 0) {
                nextValue = 0;
            }

            // Update shared value
            translateY.value = nextValue;

            // Update legacy tracker
            lastScrollY.value = currentScrollY;

            // 4. Call external onScroll
            if (args?.onScroll) {
                runOnJS(args.onScroll)(event);
            }
        },
    });

    return {
        /**
         * Pass this to your ScrollView / FlatList `onScroll` prop.
         * IMPORTANT: Ensure `scrollEventThrottle={16}` is set on the ScrollView.
         */
        onScroll: scrollHandler,
    };
}

// --- Hook: useScrollContext ---

/**
 * Helper to access the raw context values (e.g. for the TabBar component itself).
 */
export function useScrollContext() {
    const context = useContext(ScrollControlContext);
    if (!context) {
        throw new Error('useScrollContext must be used within a ScrollControlProvider');
    }
    return context;
}
