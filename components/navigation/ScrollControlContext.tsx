import {
    clamp,
    COLLAPSED_EPSILON,
    computeProgressiveReservedBottomInset,
    isCollapsedAtThreshold
} from '@/components/navigation/collapseMath';
import React, { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import {
    SharedValue,
    useAnimatedScrollHandler,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const DEFAULT_TAB_BAR_HEIGHT = 72;
const CRITICAL_SPRING = { mass: 0.8, damping: 20, stiffness: 200 };

interface ScrollControlContextType {
    translateY: SharedValue<number>;
    tabBarMaxHeight: SharedValue<number>;
    tabBarCollapsedInset: SharedValue<number>;
    isTabBarCollapsed: SharedValue<boolean>;
    reservedBottomInset: SharedValue<number>;
    setTabBarMetrics: (maxHeight: number, collapsedInset: number) => void;
    resetBar: () => void;
    forceSnapTabBar: (isHidden: boolean) => void;
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
    const reservedBottomInset = useSharedValue(DEFAULT_TAB_BAR_HEIGHT);

    const setTabBarMetrics = useCallback((maxHeight: number, collapsedInset: number) => {
        const normalizedMaxHeight = normalizeHeight(maxHeight);
        const normalizedCollapsedInset = clamp(normalizeHeight(collapsedInset), 0, normalizedMaxHeight);

        tabBarMaxHeight.value = normalizedMaxHeight;
        tabBarCollapsedInset.value = normalizedCollapsedInset;
        translateY.value = clamp(translateY.value, 0, normalizedMaxHeight);

        const collapsed = isCollapsedAtThreshold(translateY.value, normalizedMaxHeight);
        isTabBarCollapsed.value = collapsed;
        reservedBottomInset.value = computeProgressiveReservedBottomInset({
            translateY: translateY.value,
            maxHeight: normalizedMaxHeight,
            collapsedInset: normalizedCollapsedInset,
        });
    }, [isTabBarCollapsed, reservedBottomInset, tabBarCollapsedInset, tabBarMaxHeight, translateY]);

    const resetBar = useCallback(() => {
        translateY.value = withSpring(0, CRITICAL_SPRING);

        isTabBarCollapsed.value = false;
        reservedBottomInset.value = tabBarMaxHeight.value;
    }, [isTabBarCollapsed, reservedBottomInset, tabBarMaxHeight, translateY]);

    const forceSnapTabBar = useCallback((isHidden: boolean) => {
        'worklet';
        const targetHeight = isHidden ? tabBarMaxHeight.value : 0;
        translateY.value = withSpring(targetHeight, CRITICAL_SPRING);
        isTabBarCollapsed.value = isHidden;
    }, [isTabBarCollapsed, tabBarMaxHeight, translateY]);

    const contextValue = useMemo<ScrollControlContextType>(() => {
        return {
            translateY,
            tabBarMaxHeight,
            tabBarCollapsedInset,
            isTabBarCollapsed,
            reservedBottomInset,
            setTabBarMetrics,
            resetBar,
            forceSnapTabBar,
        };
    }, [
        isTabBarCollapsed,
        reservedBottomInset,
        resetBar,
        forceSnapTabBar,
        setTabBarMetrics,
        tabBarCollapsedInset,
        tabBarMaxHeight,
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
        reservedBottomInset,
        forceSnapTabBar,
    } = context;

    const prevScrollY = useSharedValue(0);
    const isDragging = useSharedValue(false);

    const onScroll = useAnimatedScrollHandler({
        onBeginDrag: (event) => {
            prevScrollY.value = event.contentOffset.y;
            isDragging.value = true;
        },
        onEndDrag: (event) => {
            isDragging.value = false;
            // Snapping is now driven entirely by the top bar in CollapsibleScaffold
            // to ensure massive header vs small tabbar stay perfectly in sync.
        },
        onMomentumEnd: () => {
            // Snapping driven entirely by CollapsibleScaffold.
        },
        onScroll: (event) => {
            const currentScrollY = event.contentOffset.y;

            const maxHeight = tabBarMaxHeight.value;
            const collapsedInset = clamp(tabBarCollapsedInset.value, 0, maxHeight);
            if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
                translateY.value = 0;
                isTabBarCollapsed.value = false;
                reservedBottomInset.value = Math.round(Math.max(collapsedInset, 0));
                prevScrollY.value = 0;
                return;
            }

            if (!Number.isFinite(currentScrollY) || currentScrollY <= 0) {
                translateY.value = 0;
                if (isTabBarCollapsed.value) {
                    isTabBarCollapsed.value = false;
                }
                reservedBottomInset.value = Math.round(maxHeight);
                prevScrollY.value = Math.max(currentScrollY, 0);
                return;
            }

            // Delta-based: direction-aware collapse
            const delta = currentScrollY - prevScrollY.value;
            prevScrollY.value = currentScrollY;

            // During momentum (not actively dragging), detect bottom bounce
            // to prevent iOS from undoing collapse
            const contentHeight = event.contentSize.height;
            const viewHeight = event.layoutMeasurement.height;
            const isAtBottomBounce = currentScrollY >= (contentHeight - viewHeight - 20);

            if (delta < 0 && !isDragging.value && isAtBottomBounce) {
                return;
            }

            const collapseTarget = clamp(translateY.value + delta, 0, maxHeight);

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
            reservedBottomInset.value = Math.round(nextReservedInset);
        },
    }, [isDragging, isTabBarCollapsed, prevScrollY, reservedBottomInset, tabBarCollapsedInset, tabBarMaxHeight, translateY]);

    return {
        onScroll,
        forceSnapTabBar,
    };
}

export function useScrollContext() {
    const context = useContext(ScrollControlContext);
    if (!context) {
        throw new Error('useScrollContext must be used within a ScrollControlProvider');
    }
    return context;
}

/**
 * Safe variant that returns a static fallback when outside ScrollControlProvider.
 * Used by PCSDevPanel so it can render on any screen (not just CollapsibleScaffold).
 */
export function useScrollContextSafe() {
    return useContext(ScrollControlContext);
}
