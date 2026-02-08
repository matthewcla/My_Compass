import { useCallback, useEffect } from 'react';
import {
    COLLAPSE_ACTIVATION_OFFSET,
    computeCollapseDelta,
    computeCollapseDistanceFromScrollY,
} from '@/components/navigation/collapseMath';
import { NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions } from 'react-native';
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
    snapBehavior?: SnapBehavior;
}

export type SnapBehavior = 'threshold' | 'velocity' | 'none';
const SNAP_VELOCITY_THRESHOLD = 1400;
const MIN_HIDE_SNAP_DISTANCE = 24;

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
    onScrollBeginDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
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
    snapBehavior = 'threshold',
}: UseDiffClampScrollProps & { enabled?: boolean }): UseDiffClampScrollResult {
    const scrollY = useSharedValue(initialScrollY);
    const previousY = useSharedValue(initialScrollY);
    const clampedScrollValue = useSharedValue(0);
    const headerHeightSV = useSharedValue(Math.max(Number.isFinite(headerHeight) ? headerHeight : 0, 0));
    const enabledSV = useSharedValue(enabled);
    const scrollOriginY = useSharedValue(0);
    const hasCapturedScrollOrigin = useSharedValue(false);

    const { width } = useWindowDimensions();
    const isMobileBreakpoint = width <= 768;
    const isMobileSV = useSharedValue(isMobileBreakpoint);

    useEffect(() => {
        headerHeightSV.value = Math.max(Number.isFinite(headerHeight) ? headerHeight : 0, 0);
    }, [headerHeight, headerHeightSV]);

    useEffect(() => {
        enabledSV.value = enabled;
    }, [enabled, enabledSV]);

    useEffect(() => {
        isMobileSV.value = isMobileBreakpoint;
        if (!isMobileBreakpoint) {
            clampedScrollValue.value = 0;
        }
    }, [clampedScrollValue, isMobileBreakpoint, isMobileSV]);

    const resolveHeaderHeight = useCallback(() => {
        const nextHeaderHeight = headerHeightSV.value;
        if (!Number.isFinite(nextHeaderHeight) || nextHeaderHeight <= 0) {
            return 0;
        }

        return nextHeaderHeight;
    }, [headerHeightSV]);

    const clampAndApplyDelta = useCallback((deltaY: number) => {
        if (!enabledSV.value || !Number.isFinite(deltaY)) {
            return;
        }

        const maxHeaderHeight = resolveHeaderHeight();
        if (maxHeaderHeight <= 0) {
            clampedScrollValue.value = 0;
            return;
        }

        const boundedDeltaY = computeCollapseDelta(deltaY);
        const next = clampedScrollValue.value + boundedDeltaY;
        if (next < 0) {
            clampedScrollValue.value = 0;
            return;
        }

        if (next > maxHeaderHeight) {
            clampedScrollValue.value = maxHeaderHeight;
            return;
        }

        clampedScrollValue.value = next;
    }, [clampedScrollValue, enabledSV, resolveHeaderHeight]);

    const updateFromScrollY = useCallback((currentY: number) => {
        if (!Number.isFinite(currentY)) {
            return;
        }

        previousY.value = currentY;
        scrollY.value = currentY;

        if (!enabledSV.value) {
            return;
        }

        if (currentY <= 0) {
            hasCapturedScrollOrigin.value = false;
            scrollOriginY.value = 0;
            clampedScrollValue.value = 0;
            return;
        }

        if (!hasCapturedScrollOrigin.value) {
            scrollOriginY.value = currentY;
            hasCapturedScrollOrigin.value = true;
        }

        const relativeScrollY = Math.max(0, currentY - scrollOriginY.value);

        const maxHeaderHeight = resolveHeaderHeight();
        const collapseTarget = computeCollapseDistanceFromScrollY({
            currentScrollY: relativeScrollY,
            maxDistance: maxHeaderHeight,
        });
        clampedScrollValue.value = collapseTarget;
    }, [clampedScrollValue, enabledSV, hasCapturedScrollOrigin, previousY, resolveHeaderHeight, scrollOriginY, scrollY]);

    const updateFromDeltaY = useCallback((deltaY: number) => {
        if (!Number.isFinite(deltaY) || deltaY === 0) {
            return;
        }

        const nextScrollY = Math.max(0, scrollY.value + deltaY);
        scrollY.value = nextScrollY;
        previousY.value = nextScrollY;

        if (!enabledSV.value) {
            return;
        }

        if (nextScrollY <= 0 && deltaY < 0) {
            clampedScrollValue.value = 0;
            return;
        }

        clampAndApplyDelta(deltaY);
    }, [clampAndApplyDelta, clampedScrollValue, enabledSV, previousY, scrollY]);

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

    const onScrollBeginDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentY = event.nativeEvent.contentOffset.y;
        if (!Number.isFinite(currentY)) {
            return;
        }

        previousY.value = currentY;
        scrollY.value = currentY;
    }, [previousY, scrollY]);

    const onScrollEndDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!enabledSV.value || !isMobileSV.value || snapBehavior === 'none') {
            return;
        }

        const maxHeaderHeight = resolveHeaderHeight();
        if (maxHeaderHeight <= 0) {
            clampedScrollValue.value = 0;
            return;
        }

        const velocityY = event.nativeEvent.velocity?.y ?? 0;
        const currentHidden = clampedScrollValue.value;
        const hideSnapMin = Math.min(
            Math.max(maxHeaderHeight * 0.15, MIN_HIDE_SNAP_DISTANCE),
            maxHeaderHeight
        );
        const showSnapMax = Math.max(maxHeaderHeight - hideSnapMin, 0);

        if (snapBehavior === 'velocity') {
            if (velocityY > SNAP_VELOCITY_THRESHOLD && currentHidden >= hideSnapMin) {
                clampedScrollValue.value = withTiming(maxHeaderHeight, {
                    duration: 250,
                    easing: Easing.out(Easing.cubic),
                });
                return;
            }

            if (velocityY < -SNAP_VELOCITY_THRESHOLD && currentHidden <= showSnapMax) {
                clampedScrollValue.value = withTiming(0, {
                    duration: 250,
                    easing: Easing.out(Easing.cubic),
                });
            }
            return;
        }

        if (velocityY > SNAP_VELOCITY_THRESHOLD && currentHidden >= hideSnapMin) {
            clampedScrollValue.value = withTiming(maxHeaderHeight, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            });
            return;
        }

        if (velocityY < -SNAP_VELOCITY_THRESHOLD && currentHidden <= showSnapMax) {
            clampedScrollValue.value = withTiming(0, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            });
            return;
        }

        clampedScrollValue.value = withTiming(
            currentHidden > maxHeaderHeight / 2 ? maxHeaderHeight : 0,
            {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            }
        );
    }, [clampedScrollValue, enabledSV, isMobileSV, resolveHeaderHeight, snapBehavior]);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event, ctx: { prevX?: number, prevY?: number, isScrollingHorizontally?: boolean }) => {
            const currentY = event.contentOffset.y;
            const currentX = event.contentOffset.x;

            if (ctx.prevY === undefined) {
                ctx.prevY = currentY;
                ctx.prevX = currentX;
                ctx.isScrollingHorizontally = false;
            }

            const dy = currentY - ctx.prevY;
            const dx = currentX - (ctx.prevX ?? 0);

            ctx.prevY = currentY;
            ctx.prevX = currentX;
            scrollY.value = currentY;
            previousY.value = currentY;

            // Scroll Lock: Ignore vertical updates if horizontal change is significantly larger
            if (ctx.isScrollingHorizontally) {
                return;
            }

            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                ctx.isScrollingHorizontally = true;
                return;
            }

            if (currentY <= COLLAPSE_ACTIVATION_OFFSET) {
                hasCapturedScrollOrigin.value = false;
                scrollOriginY.value = 0;
                clampedScrollValue.value = 0;
                return;
            }

            if (!enabledSV.value || !isMobileSV.value) {
                return;
            }

            const maxHeaderHeight = headerHeightSV.value;
            if (!Number.isFinite(maxHeaderHeight) || maxHeaderHeight <= 0) {
                clampedScrollValue.value = 0;
                return;
            }

            if (!hasCapturedScrollOrigin.value) {
                scrollOriginY.value = currentY;
                hasCapturedScrollOrigin.value = true;
            }

            const relativeScrollY = Math.max(0, currentY - scrollOriginY.value);

            const collapseTarget = computeCollapseDistanceFromScrollY({
                currentScrollY: relativeScrollY,
                maxDistance: maxHeaderHeight,
            });
            clampedScrollValue.value = collapseTarget;
        },
        onBeginDrag: (event, ctx: { prevX?: number, prevY?: number, isScrollingHorizontally?: boolean }) => {
            ctx.prevY = event.contentOffset.y;
            ctx.prevX = event.contentOffset.x;
            ctx.isScrollingHorizontally = false;
            previousY.value = ctx.prevY;
        },
        onEndDrag: (event) => {
            if (snapBehavior === 'none') {
                return;
            }

            const maxHeaderHeight = headerHeightSV.value;
            if (!Number.isFinite(maxHeaderHeight) || maxHeaderHeight <= 0) {
                clampedScrollValue.value = 0;
                return;
            }

            const velocityY = event.velocity?.y ?? 0;
            const currentHidden = clampedScrollValue.value;
            const hideSnapMin = Math.min(
                Math.max(maxHeaderHeight * 0.15, MIN_HIDE_SNAP_DISTANCE),
                maxHeaderHeight
            );
            const showSnapMax = Math.max(maxHeaderHeight - hideSnapMin, 0);

            if (snapBehavior === 'velocity') {
                if (velocityY > SNAP_VELOCITY_THRESHOLD && currentHidden >= hideSnapMin) {
                    snapTo(maxHeaderHeight);
                    return;
                }

                if (velocityY < -SNAP_VELOCITY_THRESHOLD && currentHidden <= showSnapMax) {
                    snapTo(0);
                }
                return;
            }

            if (velocityY > SNAP_VELOCITY_THRESHOLD && currentHidden >= hideSnapMin) {
                snapTo(maxHeaderHeight);
                return;
            }

            if (velocityY < -SNAP_VELOCITY_THRESHOLD && currentHidden <= showSnapMax) {
                snapTo(0);
                return;
            }

            if (currentHidden > maxHeaderHeight / 2) {
                snapTo(maxHeaderHeight);
            } else {
                snapTo(0);
            }
        },
    }, [clampedScrollValue, enabledSV, hasCapturedScrollOrigin, headerHeightSV, isMobileSV, previousY, scrollOriginY, scrollY, snapBehavior]);

    const headerTranslateY = useDerivedValue(() => {
        if (!isMobileSV.value) {
            return 0;
        }
        const maxHeaderHeight = headerHeightSV.value;
        if (!Number.isFinite(maxHeaderHeight) || maxHeaderHeight <= 0) {
            return 0;
        }
        return interpolate(
            clampedScrollValue.value,
            [0, maxHeaderHeight],
            [0, -maxHeaderHeight],
            Extrapolation.CLAMP
        );
    }, [clampedScrollValue, headerHeightSV, isMobileSV]);

    const footerTranslateY = useDerivedValue(() => {
        const maxHeaderHeight = headerHeightSV.value;
        if (!Number.isFinite(maxHeaderHeight) || maxHeaderHeight <= 0) {
            return 0;
        }
        return interpolate(
            clampedScrollValue.value,
            [0, maxHeaderHeight],
            [0, maxHeaderHeight],
            Extrapolation.CLAMP
        );
    }, [clampedScrollValue, headerHeightSV]);

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
        onScrollBeginDrag,
        onScrollEndDrag,
        updateFromScrollY,
        updateFromDeltaY,
        update,
        reset,
    };
}
