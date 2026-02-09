/**
 * useSpotlightAnimations — Spring-physics animation engine for Spotlight Search.
 *
 * Runs entirely on the UI thread via Reanimated 4.
 * All animated styles use GPU-composited properties ONLY (transform + opacity).
 * Zero layout thrashing — no height/width animation.
 *
 * Key design decisions:
 *  - Open spring: moderate stiffness with subtle overshoot for "alive" feel
 *  - Close spring: higher stiffness + overshootClamping for crisp dismissal
 *  - panelProgress (0→1) drives all derived values, so retargeting mid-flight
 *    causes a single spring reversal — no dead zones, no promise chains
 *  - PanGesture enables continuous interruptibility: grab mid-flight, throw back
 *  - Rubber banding: friction increases non-linearly past drag bounds
 *  - Haptics fire at spring settle for tactile confirmation
 */
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import { Gesture, type GestureType } from 'react-native-gesture-handler';
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

// ─── Gesture Thresholds ────────────────────────────────────────────
const FLING_VELOCITY_THRESHOLD = 500;   // px/s — fling overrides position
const SNAP_POSITION_THRESHOLD = 0.5;    // 50% — position-based snap
const RUBBER_BAND_COEFFICIENT = 0.35;   // iOS-grade rubber band friction

// ─── Haptic Helpers (fire on JS thread) ────────────────────────────
const fireOpenHaptic = () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
};

const fireCloseHaptic = () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
};

// ─── Rubber Band Math ──────────────────────────────────────────────
function rubberBandClamp(offset: number, dimension: number): number {
    'worklet';
    // iOS UIScrollView rubber band formula
    const c = RUBBER_BAND_COEFFICIENT;
    return (1 - (1 / ((Math.abs(offset) * c / dimension) + 1))) * dimension * (offset < 0 ? -1 : 1);
}

// ─── Hook ──────────────────────────────────────────────────────────

export interface SpotlightAnimationAPI {
    /** 0 → 1 shared value driving all spotlight motion */
    panelProgress: SharedValue<number>;

    /** Animated style for the backdrop overlay (opacity) */
    animatedBackdropStyle: ViewStyle;

    /** Animated style for the clipping container (animated height, overflow hidden) */
    animatedClipStyle: ViewStyle;

    /** Animated style for the panel body (translateY slides content into view) */
    animatedPanelStyle: ViewStyle;

    /** Animated style for the panel content (opacity, slight translateY drift) */
    animatedContentStyle: ViewStyle;

    /** Call this each render to update the target expanded height. */
    setExpandedHeight: (h: number) => void;

    /** Pan gesture for drag-to-dismiss / interruptible catch */
    panGesture: GestureType;

    /** Spring-open the panel. Fully interruptible — safe to call mid-close. */
    openPanel: () => void;

    /** Spring-close the panel. `onComplete` fires on the JS thread once settled. */
    closePanel: (onComplete?: () => void) => void;
}

export function useSpotlightAnimations(onGestureClose?: () => void): SpotlightAnimationAPI {
    const panelProgress = useSharedValue(0);
    const expandedHeight = useSharedValue(0);
    const isDragging = useSharedValue(false);
    const dragStartProgress = useSharedValue(0);

    // ── Derived values ──────────────────────────────────────────────

    const backdropOpacity = useDerivedValue(() => {
        // Backdrop fades in slightly faster than panel expands
        return Math.min(Math.max(panelProgress.value, 0) * 1.3, 1);
    });

    const contentOpacity = useDerivedValue(() => {
        // Content fades in after panel is ~25% open
        const clamped = Math.max(0, Math.min(panelProgress.value, 1));
        const t = (clamped - 0.2) / 0.5;
        return Math.max(0, Math.min(t, 1));
    });

    const contentTranslateY = useDerivedValue(() => {
        // Subtle upward drift as content fades in
        const clamped = Math.max(0, Math.min(panelProgress.value, 1));
        return (1 - clamped) * 6;
    });

    // ── Animated styles (UI thread, GPU-composited only) ────────────

    const animatedBackdropStyle = useAnimatedStyle((): ViewStyle => ({
        opacity: backdropOpacity.value,
    }));

    // Clip container: fixed height, overflow hidden — no animation on height itself
    // Height is set synchronously via setExpandedHeight, not spring-animated
    const animatedClipStyle = useAnimatedStyle((): ViewStyle => {
        const progress = Math.max(0, panelProgress.value);
        return {
            height: progress * expandedHeight.value,
            opacity: Math.min(progress * 3, 1),
        };
    });

    // Panel body: translateY slides the full-height content up/down
    // This is a GPU-composited transform — zero layout thrashing
    const animatedPanelStyle = useAnimatedStyle((): ViewStyle => {
        const progress = panelProgress.value;
        const clampedProgress = Math.max(0, Math.min(progress, 1));
        const slideOffset = (1 - clampedProgress) * -expandedHeight.value;

        // Rubber band: if progress > 1, apply elastic overshoot via translateY
        let rubberBandOffset = 0;
        if (progress > 1 && isDragging.value) {
            const overDrag = (progress - 1) * expandedHeight.value;
            rubberBandOffset = rubberBandClamp(overDrag, expandedHeight.value);
        }

        return {
            transform: [{ translateY: slideOffset + rubberBandOffset }],
            opacity: 1,
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
        panelProgress.value = withSpring(1, SPRING_OPEN, (finished) => {
            'worklet';
            if (finished) {
                runOnJS(fireOpenHaptic)();
            }
        });
    }, [panelProgress]);

    const closePanel = useCallback(
        (onComplete?: () => void) => {
            const fireDone = () => {
                fireCloseHaptic();
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

    // ── Pan Gesture: continuous interruptibility ─────────────────────

    const panGesture = useMemo(() =>
        Gesture.Pan()
            .onBegin(() => {
                'worklet';
                isDragging.value = true;
                dragStartProgress.value = panelProgress.value;
            })
            .onUpdate((event) => {
                'worklet';
                if (expandedHeight.value <= 0) return;

                // Map vertical drag delta to progress (negative = drag down = close)
                const dragDelta = -event.translationY / expandedHeight.value;
                let nextProgress = dragStartProgress.value + dragDelta;

                // Clamp with rubber banding
                if (nextProgress < 0) {
                    nextProgress = rubberBandClamp(nextProgress, 1);
                } else if (nextProgress > 1) {
                    // Allow slight overshoot with rubber band feel
                    const overshoot = nextProgress - 1;
                    nextProgress = 1 + rubberBandClamp(overshoot, 1);
                }

                panelProgress.value = nextProgress;
            })
            .onEnd((event) => {
                'worklet';
                isDragging.value = false;
                const vy = event.velocityY;
                const currentProgress = panelProgress.value;

                const fireGestureClose = () => {
                    fireCloseHaptic();
                    onGestureClose?.();
                };

                // Velocity override: fling in drag direction
                if (Math.abs(vy) > FLING_VELOCITY_THRESHOLD) {
                    if (vy > 0) {
                        // Fling down → close
                        panelProgress.value = withSpring(0, SPRING_CLOSE, (finished) => {
                            'worklet';
                            if (finished) runOnJS(fireGestureClose)();
                        });
                    } else {
                        // Fling up → open
                        panelProgress.value = withSpring(1, SPRING_OPEN, (finished) => {
                            'worklet';
                            if (finished) runOnJS(fireOpenHaptic)();
                        });
                    }
                    return;
                }

                // Position-based snap: 50% threshold
                if (currentProgress < SNAP_POSITION_THRESHOLD) {
                    panelProgress.value = withSpring(0, SPRING_CLOSE, (finished) => {
                        'worklet';
                        if (finished) runOnJS(fireGestureClose)();
                    });
                } else {
                    panelProgress.value = withSpring(1, SPRING_OPEN, (finished) => {
                        'worklet';
                        if (finished) runOnJS(fireOpenHaptic)();
                    });
                }
            })
            .onFinalize(() => {
                'worklet';
                isDragging.value = false;
            }),
        [panelProgress, expandedHeight, isDragging, dragStartProgress]
    );

    return {
        panelProgress,
        animatedBackdropStyle,
        animatedClipStyle,
        animatedPanelStyle,
        animatedContentStyle,
        setExpandedHeight,
        panGesture,
        openPanel,
        closePanel,
    };
}
