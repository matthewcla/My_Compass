/**
 * useSpotlightAnimations — Spring-physics animation engine for Spotlight Search.
 *
 * Runs entirely on the UI thread via Reanimated 4.
 * All styles are GPU-composited (transform + opacity only).
 *
 * Key design decisions:
 *  - Open spring: moderate stiffness with subtle overshoot for "alive" feel
 *  - Close spring: higher stiffness + overshootClamping for crisp dismissal
 *  - panelProgress (0→1) drives all derived values, so retargeting mid-flight
 *    causes a single spring reversal — no dead zones, no promise chains
 */
import { useCallback } from 'react';
import { type ViewStyle } from 'react-native';
import {
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
    type SharedValue,
    type WithSpringConfig,
} from 'react-native-reanimated';

// ─── Spring Configs ────────────────────────────────────────────────
const SPRING_OPEN: WithSpringConfig = {
    mass: 1,
    damping: 28,
    stiffness: 340,
    overshootClamping: false,   // subtle overshoot = "alive" settle
};

const SPRING_CLOSE: WithSpringConfig = {
    mass: 1,
    damping: 32,
    stiffness: 400,
    overshootClamping: true,    // crisp snap-shut, no bounce
};

// ─── Hook ──────────────────────────────────────────────────────────

export interface SpotlightAnimationAPI {
    /** 0 → 1 shared value driving all spotlight motion */
    panelProgress: SharedValue<number>;

    /** Animated style for the backdrop overlay (opacity) */
    animatedBackdropStyle: { opacity: number };

    /** Animated style for the panel body (maxHeight + opacity). */
    animatedPanelStyle: { height: number; opacity: number };

    /** Call this each render to update the target expanded height. */
    setExpandedHeight: (h: number) => void;

    /** Animated style for the panel content (opacity, slight translateY) */
    animatedContentStyle: { opacity: number; transform: { translateY: number }[] };

    /** Spring-open the panel. Fully interruptible — safe to call mid-close. */
    openPanel: () => void;

    /** Spring-close the panel. `onComplete` fires on the JS thread once settled. */
    closePanel: (onComplete?: () => void) => void;
}

export function useSpotlightAnimations(): SpotlightAnimationAPI {
    const panelProgress = useSharedValue(0);
    const expandedHeight = useSharedValue(0);

    // ── Derived values ──────────────────────────────────────────────

    const backdropOpacity = useDerivedValue(() => {
        // Backdrop fades in slightly faster than panel expands
        return Math.min(panelProgress.value * 1.3, 1);
    });

    const contentOpacity = useDerivedValue(() => {
        // Content fades in after panel is ~25% open
        const t = (panelProgress.value - 0.2) / 0.5;
        return Math.max(0, Math.min(t, 1));
    });

    const contentTranslateY = useDerivedValue(() => {
        // Subtle upward drift as content fades in
        return (1 - panelProgress.value) * 6;
    });

    // ── Animated styles (UI thread, all called at top-level) ────────

    const animatedBackdropStyle = useAnimatedStyle((): ViewStyle => ({
        opacity: backdropOpacity.value,
    }));

    const animatedPanelStyle = useAnimatedStyle((): ViewStyle => {
        const progress = panelProgress.value;
        return {
            height: progress * expandedHeight.value,
            opacity: Math.min(progress * 3, 1),   // quick fade-in at start
        };
    });

    const animatedContentStyle = useAnimatedStyle((): ViewStyle => ({
        opacity: contentOpacity.value,
        transform: [{ translateY: contentTranslateY.value }],
    }));

    // ── Setter for expanded height (called during render) ───────────

    const setExpandedHeight = useCallback(
        (h: number) => {
            expandedHeight.value = h;
        },
        [expandedHeight]
    );

    // ── Commands ─────────────────────────────────────────────────────

    const openPanel = useCallback(() => {
        panelProgress.value = withSpring(1, SPRING_OPEN);
    }, [panelProgress]);

    const closePanel = useCallback(
        (onComplete?: () => void) => {
            const fireDone = () => {
                onComplete?.();
            };
            panelProgress.value = withSpring(0, SPRING_CLOSE, (finished) => {
                'worklet';
                if (finished) {
                    runOnJS(fireDone)();
                }
            });
        },
        [panelProgress]
    );

    return {
        panelProgress,
        animatedBackdropStyle,
        animatedPanelStyle,
        animatedContentStyle,
        setExpandedHeight,
        openPanel,
        closePanel,
    } as SpotlightAnimationAPI;
}
