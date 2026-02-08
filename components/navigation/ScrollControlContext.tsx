import {
    clamp,
    COLLAPSE_ACTIVATION_OFFSET,
    COLLAPSE_SCROLL_MULTIPLIER,
    COLLAPSED_EPSILON,
    computeCollapseDistanceFromScrollY,
    computeProgressiveReservedBottomInset,
    INSET_UPDATE_THRESHOLD,
    isCollapsedAtThreshold,
} from '@/components/navigation/collapseMath';
import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import {
    Easing,
    runOnJS,
    SharedValue,
    useAnimatedScrollHandler,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const DEFAULT_TAB_BAR_HEIGHT = 72;

interface ScrollControlContextType {
    translateY: SharedValue<number>;
    tabBarMaxHeight: SharedValue<number>;
    tabBarCollapsedInset: SharedValue<number>;
    tabBarMaxHeightPx: number;
    tabBarCollapsedInsetPx: number;
    isTabBarCollapsed: SharedValue<boolean>;
    reservedBottomInset: number;
    setTabBarMetrics: (maxHeight: number, collapsedInset: number) => void;
    setReservedBottomInset: (value: number) => void;
    resetBar: () => void;
}

const ScrollControlContext = createContext<ScrollControlContextType | undefined>(undefined);

interface ScrollControlProviderProps {
    children: ReactNode;
}

const normalizeHeight = (value: number): number => {
    if (!Number.isFinite(value) || value < 0) {
        return 0;
    }

    return Math.round(value);
};

export function ScrollControlProvider({ children }: ScrollControlProviderProps) {
    const translateY = useSharedValue(0);
    const tabBarMaxHeight = useSharedValue(DEFAULT_TAB_BAR_HEIGHT);
    const tabBarCollapsedInset = useSharedValue(0);
    const isTabBarCollapsed = useSharedValue(false);

    const [tabBarMaxHeightPx, setTabBarMaxHeightPx] = useState(DEFAULT_TAB_BAR_HEIGHT);
    const [tabBarCollapsedInsetPx, setTabBarCollapsedInsetPx] = useState(0);
    const [reservedBottomInset, setReservedBottomInsetState] = useState(DEFAULT_TAB_BAR_HEIGHT);

    const setReservedBottomInset = useCallback((value: number) => {
        const nextValue = normalizeHeight(value);
        setReservedBottomInsetState((previousValue) => {
            if (Math.abs(previousValue - nextValue) < 1) {
                return previousValue;
            }

            return nextValue;
        });
    }, []);

    const setTabBarMetrics = useCallback((maxHeight: number, collapsedInset: number) => {
        const normalizedMaxHeight = normalizeHeight(maxHeight);
        const normalizedCollapsedInset = clamp(normalizeHeight(collapsedInset), 0, normalizedMaxHeight);

        setTabBarMaxHeightPx((previousValue) =>
            previousValue === normalizedMaxHeight ? previousValue : normalizedMaxHeight
        );
        setTabBarCollapsedInsetPx((previousValue) =>
            previousValue === normalizedCollapsedInset ? previousValue : normalizedCollapsedInset
        );

        tabBarMaxHeight.value = normalizedMaxHeight;
        tabBarCollapsedInset.value = normalizedCollapsedInset;
        translateY.value = clamp(translateY.value, 0, normalizedMaxHeight);

        const collapsed = isCollapsedAtThreshold(translateY.value, normalizedMaxHeight);
        isTabBarCollapsed.value = collapsed;
        setReservedBottomInset(
            computeProgressiveReservedBottomInset({
                translateY: translateY.value,
                maxHeight: normalizedMaxHeight,
                collapsedInset: normalizedCollapsedInset,
            })
        );
    }, [isTabBarCollapsed, setReservedBottomInset, tabBarCollapsedInset, tabBarMaxHeight, translateY]);

    const resetBar = useCallback(() => {
        translateY.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.quad),
        });

        isTabBarCollapsed.value = false;
        setReservedBottomInset(tabBarMaxHeight.value);
    }, [isTabBarCollapsed, setReservedBottomInset, tabBarMaxHeight, translateY]);

    const contextValue = useMemo<ScrollControlContextType>(() => {
        return {
            translateY,
            tabBarMaxHeight,
            tabBarCollapsedInset,
            tabBarMaxHeightPx,
            tabBarCollapsedInsetPx,
            isTabBarCollapsed,
            reservedBottomInset,
            setTabBarMetrics,
            setReservedBottomInset,
            resetBar,
        };
    }, [
        isTabBarCollapsed,
        reservedBottomInset,
        resetBar,
        setReservedBottomInset,
        setTabBarMetrics,
        tabBarCollapsedInset,
        tabBarCollapsedInsetPx,
        tabBarMaxHeight,
        tabBarMaxHeightPx,
        translateY,
    ]);

    return (
        <ScrollControlContext.Provider value={contextValue}>
            {children}
        </ScrollControlContext.Provider>
    );
}

export function useScrollControl() {
    const context = useContext(ScrollControlContext);

    if (!context) {
        throw new Error('useScrollControl must be used within a ScrollControlProvider');
    }

    const {
        translateY,
        tabBarCollapsedInset,
        tabBarMaxHeight,
        isTabBarCollapsed,
        setReservedBottomInset,
    } = context;
    const lastNotifiedReservedInset = useSharedValue(DEFAULT_TAB_BAR_HEIGHT);
    const scrollOriginY = useSharedValue(0);
    const hasCapturedScrollOrigin = useSharedValue(false);

    const onScroll = useAnimatedScrollHandler({
        onBeginDrag: (event) => {
            const currentY = event.contentOffset.y;
            if (!Number.isFinite(currentY) || currentY <= 0) {
                return;
            }
            // Reverse-compute origin that would produce the current translateY,
            // so the tab bar continues smoothly from its current visual state.
            const currentCollapse = translateY.value;
            const maxHeight = tabBarMaxHeight.value;
            if (currentCollapse > 0 && maxHeight > 0) {
                const effectiveScroll = currentCollapse / COLLAPSE_SCROLL_MULTIPLIER + COLLAPSE_ACTIVATION_OFFSET;
                scrollOriginY.value = currentY - effectiveScroll;
            } else {
                scrollOriginY.value = currentY;
            }
            hasCapturedScrollOrigin.value = true;
        },
        onScroll: (event) => {
            const currentScrollY = event.contentOffset.y;

            const maxHeight = tabBarMaxHeight.value;
            const collapsedInset = clamp(tabBarCollapsedInset.value, 0, maxHeight);
            if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
                translateY.value = 0;
                isTabBarCollapsed.value = false;
                const roundedCollapsedInset = Math.round(Math.max(collapsedInset, 0));
                if (Math.abs(lastNotifiedReservedInset.value - roundedCollapsedInset) >= INSET_UPDATE_THRESHOLD) {
                    lastNotifiedReservedInset.value = roundedCollapsedInset;
                    runOnJS(setReservedBottomInset)(roundedCollapsedInset);
                }
                return;
            }

            if (currentScrollY <= COLLAPSE_ACTIVATION_OFFSET) {
                hasCapturedScrollOrigin.value = false;
                scrollOriginY.value = 0;
                translateY.value = 0;
                if (isTabBarCollapsed.value) {
                    isTabBarCollapsed.value = false;
                }
            }

            if (!hasCapturedScrollOrigin.value) {
                scrollOriginY.value = currentScrollY;
                hasCapturedScrollOrigin.value = true;
            }

            const relativeScrollY = Math.max(0, currentScrollY - scrollOriginY.value);
            const collapseTarget = computeCollapseDistanceFromScrollY({
                currentScrollY: relativeScrollY,
                maxDistance: maxHeight,
                activationOffset: COLLAPSE_ACTIVATION_OFFSET,
            });

            translateY.value = collapseTarget;

            const collapsed = collapseTarget >= maxHeight - COLLAPSED_EPSILON;
            if (collapsed !== isTabBarCollapsed.value) {
                isTabBarCollapsed.value = collapsed;
            }

            const nextReservedInset = computeProgressiveReservedBottomInset({
                translateY: collapseTarget,
                maxHeight,
                collapsedInset,
            });
            const roundedReservedInset = Math.round(nextReservedInset);
            const roundedCollapsedInset = Math.round(collapsedInset);
            const roundedMaxHeight = Math.round(maxHeight);
            const reachedBoundary =
                roundedReservedInset === roundedCollapsedInset ||
                roundedReservedInset === roundedMaxHeight;
            const shouldNotifyInset =
                Math.abs(roundedReservedInset - lastNotifiedReservedInset.value) >= INSET_UPDATE_THRESHOLD ||
                (reachedBoundary && roundedReservedInset !== lastNotifiedReservedInset.value);

            if (shouldNotifyInset) {
                lastNotifiedReservedInset.value = roundedReservedInset;
                runOnJS(setReservedBottomInset)(roundedReservedInset);
            }
        },
    }, [hasCapturedScrollOrigin, isTabBarCollapsed, lastNotifiedReservedInset, scrollOriginY, setReservedBottomInset, tabBarCollapsedInset, tabBarMaxHeight, translateY]);

    return {
        onScroll,
    };
}

export function useScrollContext() {
    const context = useContext(ScrollControlContext);
    if (!context) {
        throw new Error('useScrollContext must be used within a ScrollControlProvider');
    }
    return context;
}
