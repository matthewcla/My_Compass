import {
    clamp,
    computeMinContentHeightForCollapse,
    computeRequiredCollapseTravel
} from '@/components/navigation/collapseMath';
import { useScrollContext, useScrollControl } from '@/components/navigation/ScrollControlContext';
import { useBottomSheetStore } from '@/store/useBottomSheetStore';
import React, { useCallback, useMemo, useState } from 'react';
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    StatusBar as RNStatusBar,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle
} from 'react-native';
import Animated, {
    cancelAnimation,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useComposedEventHandler,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScrollEventHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
type SnapBehavior = 'threshold' | 'velocity' | 'none';

const DEFAULT_TAB_BAR_MAX_HEIGHT = 72;

export interface CollapsibleScaffoldListProps {
    onScroll: ScrollEventHandler | undefined;
    onScrollBeginDrag: ScrollEventHandler | undefined;
    onScrollEndDrag: ScrollEventHandler | undefined;
    onLayout: (event: LayoutChangeEvent) => void;
    onContentSizeChange: (width: number, height: number) => void;
    scrollEnabled: boolean;
    scrollEventThrottle: number;
    clipToPadding: false;
    contentContainerStyle: StyleProp<ViewStyle>;
}

interface CollapsibleScaffoldProps {
    topBar: React.ReactNode;
    children: (props: CollapsibleScaffoldListProps) => React.ReactElement;
    containerStyle?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    statusBarShimBackgroundColor?: string;
    initialTopBarHeight?: number;
    snapBehavior?: SnapBehavior;
    testID?: string;
}

/**
 * Usage (event wiring):
 *
 * <CollapsibleScaffold topBar={<TopBar />}>
 *   {({
 *     onScroll,
 *     onScrollBeginDrag,
 *     onScrollEndDrag,
 *     onLayout,
 *     onContentSizeChange,
 *     scrollEnabled,
 *     scrollEventThrottle,
 *     clipToPadding,
 *     contentContainerStyle
 *   }) => (
 *     <Animated.FlatList
 *       data={items}
 *       renderItem={renderItem}
 *       onScroll={onScroll}
 *       onScrollBeginDrag={onScrollBeginDrag}
 *       onScrollEndDrag={onScrollEndDrag}
 *       onLayout={onLayout}
 *       onContentSizeChange={onContentSizeChange}
 *       scrollEnabled={scrollEnabled}
 *       scrollEventThrottle={scrollEventThrottle}
 *       clipToPadding={clipToPadding}
 *       contentContainerStyle={contentContainerStyle}
 *     />
 *   )}
 * </CollapsibleScaffold>
 */
export function CollapsibleScaffold({
    topBar,
    children,
    containerStyle,
    contentContainerStyle,
    statusBarShimBackgroundColor = '#ffffff',
    initialTopBarHeight = 0,
    snapBehavior: _snapBehavior = 'threshold',
    minTopBarHeight = 0,
    testID,
}: CollapsibleScaffoldProps & { minTopBarHeight?: number }) {
    const insets = useSafeAreaInsets();
    const statusBarShimHeight = useMemo(() => {
        if (insets.top > 0) {
            return insets.top;
        }

        if (Platform.OS === 'android') {
            return RNStatusBar.currentHeight ?? 0;
        }

        return 0;
    }, [insets.top]);
    const initialAnimatedHeaderHeight = Math.max(initialTopBarHeight - statusBarShimHeight, 0);

    const [animatedHeaderHeight, setAnimatedHeaderHeight] = useState(initialAnimatedHeaderHeight);
    const [viewportHeight, setViewportHeight] = useState<number | null>(null);
    const { translateY: tabBarTranslateY, tabBarMaxHeight } = useScrollContext();

    // Mobile Web Strategy: Disable DiffClamp animation and use position: sticky
    const isMobileWebEnv = useMemo(() => Platform.OS === 'web', []);
    const diffClampEnabled = !isMobileWebEnv;

    // The scrollable distance is the total header height minus the part that should remain visible (sticky)
    // We clamp minTopBarHeight against measured height to avoid impossible ranges.
    const clampedMinTopBarHeight = Math.min(Math.max(minTopBarHeight, 0), animatedHeaderHeight);
    const scrollableHeaderHeight = Math.max(animatedHeaderHeight - clampedMinTopBarHeight, 0);

    // P0 FIX #1: Promote scrollableHeaderHeight to a SharedValue so worklets
    // on the UI thread always read the current measured value, never a stale closure.
    const scrollableHeaderHeightSV = useSharedValue(scrollableHeaderHeight);
    // Keep the shared value in sync whenever the JS-side value changes
    React.useEffect(() => {
        scrollableHeaderHeightSV.value = scrollableHeaderHeight;
    }, [scrollableHeaderHeight, scrollableHeaderHeightSV]);

    const headerCollapseDistance = useSharedValue(0);
    const prevHeaderScrollY = useSharedValue(0);
    const isDraggingLayout = useSharedValue(false);

    const { onScroll: scrollControlHandler, forceSnapTabBar } = useScrollControl();

    // Tightly tuned spring configuration for a crisp, cinematic 
    // UI response that feels premium and massless
    const SPRING_CONFIG = { mass: 0.5, damping: 25, stiffness: 300 };

    // ARCHITECTURAL PARITY: This handler now mirrors the tab bar's proven architecture.
    // - onScroll ALWAYS processes deltas (no isSnapping guard)
    // - onEndDrag/onMomentumEnd fire snap springs that are naturally overridden
    //   by the next onScroll frame if momentum continues
    // - Springs only play out uninterrupted AFTER all scroll events have stopped
    const headerScrollHandler = useAnimatedScrollHandler({
        onBeginDrag: (event) => {
            // Cancel any in-flight snap spring so deltas take over immediately
            cancelAnimation(headerCollapseDistance);
            isDraggingLayout.value = true;
            prevHeaderScrollY.value = event.contentOffset.y;
        },
        onEndDrag: (event) => {
            isDraggingLayout.value = false;
            if (!diffClampEnabled) return;

            const maxCollapse = scrollableHeaderHeightSV.value;
            if (maxCollapse <= 0) return;

            // Snap decision: is the header more than halfway collapsed?
            const isHidden = headerCollapseDistance.value > maxCollapse / 2;
            const targetDistance = isHidden ? maxCollapse : 0;

            // Fire snap spring — will be overridden by onScroll if momentum continues
            headerCollapseDistance.value = withSpring(targetDistance, { ...SPRING_CONFIG });

            if (forceSnapTabBar) {
                forceSnapTabBar(isHidden);
            }
        },
        onMomentumEnd: (event) => {
            if (!diffClampEnabled) return;

            const maxCollapse = scrollableHeaderHeightSV.value;
            if (maxCollapse <= 0) return;

            // Final snap after all momentum has settled
            const isHidden = headerCollapseDistance.value > maxCollapse / 2;
            const targetDistance = isHidden ? maxCollapse : 0;

            headerCollapseDistance.value = withSpring(targetDistance, { ...SPRING_CONFIG });

            if (forceSnapTabBar) {
                forceSnapTabBar(isHidden);
            }
        },
        onScroll: (event) => {
            if (!diffClampEnabled) return;

            const currentY = event.contentOffset.y;
            if (!Number.isFinite(currentY) || currentY <= 0) {
                headerCollapseDistance.value = 0;
                prevHeaderScrollY.value = Math.max(currentY, 0);
                return;
            }

            // Delta-based: direction-aware header collapse (always processes, never blocked)
            const delta = currentY - prevHeaderScrollY.value;

            // Bottom bounce protection: ignore negative deltas during iOS rubber-band
            const contentHeight = event.contentSize.height;
            const viewHeight = event.layoutMeasurement.height;
            const maxScroll = Math.max(contentHeight - viewHeight, 0);
            const isAtBottomBounce = currentY >= (maxScroll - 50) || prevHeaderScrollY.value >= maxScroll;

            // Always update tracker so anchor stays accurate
            prevHeaderScrollY.value = currentY;

            if (delta < 0 && !isDraggingLayout.value && isAtBottomBounce) {
                return;
            }

            headerCollapseDistance.value = clamp(
                headerCollapseDistance.value + delta,
                0,
                scrollableHeaderHeightSV.value,
            );
        },
    }, [diffClampEnabled, headerCollapseDistance, prevHeaderScrollY, scrollableHeaderHeightSV, forceSnapTabBar, isDraggingLayout]);

    const composedOnScrollHandler = useComposedEventHandler(
        [headerScrollHandler as any, scrollControlHandler as any]
    ) as unknown as ScrollEventHandler;

    const topBarAnimatedStyle = useAnimatedStyle(() => {
        if (!diffClampEnabled) {
            return {
                transform: [{ translateY: 0 }],
            };
        }

        const clampedDistance = Math.min(
            Math.max(headerCollapseDistance.value, 0),
            scrollableHeaderHeightSV.value
        );
        return {
            transform: [{ translateY: -clampedDistance }],
        };
    }, [diffClampEnabled, headerCollapseDistance, scrollableHeaderHeightSV]);

    const handleAnimatedHeaderLayout = useCallback((event: LayoutChangeEvent) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        if (nextHeight <= 0) {
            return;
        }

        setAnimatedHeaderHeight((previousHeight) => {
            if (nextHeight === previousHeight) {
                return previousHeight;
            }

            // We explicitly allow shrinkage here now because if the StatusCard
            // renders different variants (or shifts after fonts load), locking to 
            // the maximum observed layout height creates unbreakable ghost space
            return nextHeight;
        });
    }, []);

    const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        setViewportHeight((prevHeight) => (prevHeight === nextHeight ? prevHeight : nextHeight));
    }, []);

    const handleContentSizeChange = useCallback((_width: number, _height: number) => {
        // The scaffold keeps handlers wired even for short lists; this callback remains
        // available to list surfaces but does not gate listener attachment.
    }, []);



    // Keep a JS-side min content height for the static style (only updates on header
    // height / viewport changes, not on every scroll frame).
    // Uses the dynamic tab bar height from our global store to ensure accurate layout shifts.
    const { tabBarHeight, sheetState } = useBottomSheetStore();

    // We only need scroll-collapse buffer distance if the drawer is in its resting (tabs) state.
    // If it's expanded, the user is interacting with the drawer, not scrolling the background list.
    const effectiveTabBarHeight = sheetState === 0 ? tabBarHeight : 0;

    const minContentHeight = useMemo(() => {
        return computeMinContentHeightForCollapse({
            viewportHeight,
            requiredCollapseTravel: computeRequiredCollapseTravel({
                scrollableHeaderHeight,
                tabBarMaxHeight: effectiveTabBarHeight,
                tabBarCollapsedInset: 0,
            }),
        });
    }, [scrollableHeaderHeight, viewportHeight, effectiveTabBarHeight]);

    const paddedContentContainerStyle = useMemo(() => {
        // Use only the safe area inset for bottom padding. Content scrolls behind
        // the semi-transparent tab bar (standard pattern for collapsible bottom bars).
        // When the bar collapses, no empty gap remains because content already fills
        // the space behind where the bar was.
        const paddingBottom = insets.bottom;

        const totalTopBarHeight = statusBarShimHeight + animatedHeaderHeight;
        return [
            {
                paddingTop: totalTopBarHeight,
                paddingBottom,
                minHeight: minContentHeight ?? undefined,
            },
            contentContainerStyle,
        ];
    }, [animatedHeaderHeight, contentContainerStyle, isMobileWebEnv, minContentHeight, statusBarShimHeight, insets.bottom]);

    const listProps = useMemo<CollapsibleScaffoldListProps>(() => {
        return {
            onScroll: isMobileWebEnv ? undefined : composedOnScrollHandler,
            onScrollBeginDrag: undefined,
            onScrollEndDrag: undefined,
            onLayout: handleViewportLayout,
            onContentSizeChange: handleContentSizeChange,
            scrollEnabled: true,
            scrollEventThrottle: 16,
            clipToPadding: false,
            contentContainerStyle: paddedContentContainerStyle,
        };
    }, [
        handleContentSizeChange,
        handleViewportLayout,
        isMobileWebEnv,
        composedOnScrollHandler,
        paddedContentContainerStyle,
    ]);

    return (
        <View style={[styles.container, containerStyle]} testID={testID}>
            {isMobileWebEnv && (
                <View style={[
                    styles.topBarContainer,
                    { position: 'absolute', top: 0, zIndex: 100 } as any
                ]}>
                    <View
                        style={[
                            styles.statusBarShim,
                            {
                                height: statusBarShimHeight,
                                backgroundColor: statusBarShimBackgroundColor,
                            }
                        ]}
                    />

                    <View style={styles.animatedHeader} onLayout={handleAnimatedHeaderLayout}>
                        {topBar}
                    </View>
                </View>
            )}

            {children(listProps)}

            {!isMobileWebEnv && (
                <View style={[
                    styles.topBarContainer,
                ]}>
                    <View
                        style={[
                            styles.statusBarShim,
                            {
                                height: statusBarShimHeight,
                                backgroundColor: statusBarShimBackgroundColor,
                            }
                        ]}
                    />

                    <Animated.View style={[styles.animatedHeader, topBarAnimatedStyle]}>
                        <View onLayout={handleAnimatedHeaderLayout}>
                            {topBar}
                        </View>
                    </Animated.View>

                    <View
                        pointerEvents="none"
                        style={[
                            styles.topSafeAreaMask,
                            {
                                height: statusBarShimHeight,
                                backgroundColor: statusBarShimBackgroundColor,
                            }
                        ]}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBarContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        zIndex: 10,
        elevation: 10,
    },
    statusBarShim: {
        width: '100%',
    },
    animatedHeader: {
        width: '100%',
    },
    topSafeAreaMask: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        elevation: 2,
    },
});
