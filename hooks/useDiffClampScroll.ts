import { useCallback } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
    Easing,
    Extrapolation,
    SharedValue,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

interface UseDiffClampScrollProps {
    headerHeight: number;
    initialScrollY?: number;
}

type DiffClampInput = { scrollY: number } | { deltaY: number };

interface UseDiffClampScrollResult {
    scrollY: SharedValue<number>;
    clampedScrollValue: SharedValue<number>;
    diffClamp: SharedValue<number>;
    headerTranslateY: SharedValue<number>;
    footerTranslateY: SharedValue<number>;
    headerStyle: { transform: { translateY: number }[] };
    footerStyle: { transform: { translateY: number }[] };
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    updateFromScrollY: (currentY: number) => void;
    updateFromDeltaY: (deltaY: number) => void;
    update: (input: DiffClampInput) => void;
    reset: () => void;
}

/**
 * Diff-clamp engine (Phase 1):
 * diff = currentY - previousY
 * clampedScrollValue = clamp(clampedScrollValue + diff, 0, headerHeight)
 *
 * Test cases for direction-change reset:
 * 1) scrollY: 0 -> 90 -> 40
 *    diff: +90, -50 => clamped: 0 -> 90 -> 40 (reveal starts immediately on upward direction)
 * 2) deltaY stream with clamped at 70: -25 -> -60
 *    clamped: 70 -> 45 -> 0 (resets fully when direction flips upward past top bound)
 * 3) scrollY: 20 -> 100 -> 50 -> 110
 *    diff: +80, -50, +60 => clamped: 0 -> 80 -> 30 -> 90 (each direction switch re-anchors correctly)
 */
export function useDiffClampScroll({
    headerHeight,
    initialScrollY = 0,
    enabled = true,
}: UseDiffClampScrollProps & { enabled?: boolean }): UseDiffClampScrollResult {
    const scrollY = useSharedValue(initialScrollY);
    const previousY = useSharedValue(initialScrollY);
    const clampedScrollValue = useSharedValue(0);

    const clampAndApplyDelta = useCallback((deltaY: number) => {
        if (!enabled || !Number.isFinite(deltaY)) {
            return;
        }

        const next = clampedScrollValue.value + deltaY;
        clampedScrollValue.value = Math.min(Math.max(next, 0), headerHeight);
    }, [clampedScrollValue, enabled, headerHeight]);

    const updateFromScrollY = useCallback((currentY: number) => {
        if (!Number.isFinite(currentY)) {
            return;
        }

        const diff = currentY - previousY.value;
        previousY.value = currentY;
        scrollY.value = currentY;

        if (!enabled) {
            return;
        }

        if (currentY <= 0) {
            clampedScrollValue.value = 0;
            return;
        }

        clampAndApplyDelta(diff);
    }, [clampAndApplyDelta, clampedScrollValue, enabled, previousY, scrollY]);

    const updateFromDeltaY = useCallback((deltaY: number) => {
        if (!Number.isFinite(deltaY) || deltaY === 0) {
            return;
        }

        const nextScrollY = Math.max(0, scrollY.value + deltaY);
        scrollY.value = nextScrollY;
        previousY.value = nextScrollY;

        if (!enabled) {
            return;
        }

        if (nextScrollY <= 0 && deltaY < 0) {
            clampedScrollValue.value = 0;
            return;
        }

        clampAndApplyDelta(deltaY);
    }, [clampAndApplyDelta, clampedScrollValue, enabled, previousY, scrollY]);

    const update = useCallback((input: DiffClampInput) => {
        if ('scrollY' in input) {
            updateFromScrollY(input.scrollY);
            return;
        }

        updateFromDeltaY(input.deltaY);
    }, [updateFromDeltaY, updateFromScrollY]);

    const reset = useCallback(() => {
        scrollY.value = 0;
        previousY.value = 0;
        clampedScrollValue.value = 0;
    }, [clampedScrollValue, previousY, scrollY]);

    const snapTo = (target: number) => {
        'worklet';
        clampedScrollValue.value = withTiming(target, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
        });
    };

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event, ctx: { prevY?: number }) => {
            const currentY = event.contentOffset.y;

            if (ctx.prevY === undefined) {
                ctx.prevY = currentY;
            }

            const dy = currentY - ctx.prevY;
            ctx.prevY = currentY;
            scrollY.value = currentY;
            previousY.value = currentY;

            if (currentY <= 0) {
                clampedScrollValue.value = 0;
                return;
            }

            if (!enabled) return;

            const next = clampedScrollValue.value + dy;
            clampedScrollValue.value = Math.min(Math.max(next, 0), headerHeight);
        },
        onBeginDrag: (event, ctx: { prevY?: number }) => {
            ctx.prevY = event.contentOffset.y;
            previousY.value = ctx.prevY;
        },
        onEndDrag: (event) => {
            // Snapping Hysteresis & Velocity Override
            const velocityY = event.velocity?.y ?? 0;
            const currentHidden = clampedScrollValue.value;

            // Velocity Override
            if (velocityY > 500) {
                // Fling Down -> Hide Header
                snapTo(headerHeight);
            } else if (velocityY < -500) {
                // Fling Up -> Show Header
                snapTo(0);
            } else {
                // Threshold Snapping
                if (currentHidden > headerHeight / 2) {
                    snapTo(headerHeight); // Snap Hidden
                } else {
                    snapTo(0); // Snap Visible
                }
            }
        },
    });

    const headerTranslateY = useDerivedValue(() => {
        return interpolate(
            clampedScrollValue.value,
            [0, headerHeight],
            [0, -headerHeight],
            Extrapolation.CLAMP
        );
    });

    const footerTranslateY = useDerivedValue(() => {
        return interpolate(
            clampedScrollValue.value,
            [0, headerHeight],
            [0, headerHeight],
            Extrapolation.CLAMP
        );
    });

    const headerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: headerTranslateY.value,
                },
            ],
        };
    });

    const footerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: footerTranslateY.value,
                },
            ],
        };
    });

    return {
        scrollY,
        clampedScrollValue,
        diffClamp: clampedScrollValue,
        headerTranslateY,
        footerTranslateY,
        headerStyle,
        footerStyle,
        onScroll,
        updateFromScrollY,
        updateFromDeltaY,
        update,
        reset,
    };
}
