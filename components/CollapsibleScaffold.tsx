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
    useScrollContext(); // Ensure context is available; metrics read via constants

    // Mobile Web Strategy: Disable DiffClamp animation and use position: sticky
    const isMobileWebEnv = useMemo(() => Platform.OS === 'web', []);
    const diffClampEnabled = !isMobileWebEnv;

    // The scrollable distance is the total header height minus the part that should remain visible (sticky)
    // We clamp minTopBarHeight against measured height to avoid impossible ranges.
    const clampedMinTopBarHeight = Math.min(Math.max(minTopBarHeight, 0), animatedHeaderHeight);
    const scrollableHeaderHeight = Math.max(animatedHeaderHeight - clampedMinTopBarHeight, 0);
    const headerCollapseDistance = useSharedValue(0);
    const prevHeaderScrollY = useSharedValue(0);
    const isSnapping = useSharedValue(false);
    const isDraggingLayout = useSharedValue(false);

    const { onScroll: scrollControlHandler, forceSnapTabBar } = useScrollControl();

    // Tightly tuned spring configuration for a crisp, cinematic 
    // UI response that feels premium and massless
    const SPRING_CONFIG = { mass: 0.5, damping: 25, stiffness: 300 };

    const headerScrollHandler = useAnimatedScrollHandler({
        onBeginDrag: (event) => {
            isSnapping.value = false;
            isDraggingLayout.value = true;
            prevHeaderScrollY.value = event.contentOffset.y;
        },
        onEndDrag: (event) => {
            isDraggingLayout.value = false;
            if (!diffClampEnabled) return;
            isSnapping.value = true;

            const velocity = event.velocity?.y ?? 0;
            let isHidden = headerCollapseDistance.value > scrollableHeaderHeight / 2;

            // Flicks override distance thresholds
            if (velocity > 0.5) {
                isHidden = true;
            } else if (velocity < -0.5) {
                isHidden = false;
            }

            const targetDistance = isHidden ? scrollableHeaderHeight : 0;

            headerCollapseDistance.value = withSpring(targetDistance, { ...SPRING_CONFIG, velocity }, (finished) => {
                if (finished) isSnapping.value = false;
            });

            if (forceSnapTabBar) {
                forceSnapTabBar(isHidden, velocity);
            }
        },
        onMomentumEnd: (event) => {
            if (!diffClampEnabled || isSnapping.value) return;
            isSnapping.value = true;

            const velocity = event.velocity?.y ?? 0;
            const isHidden = headerCollapseDistance.value > scrollableHeaderHeight / 2;
            const targetDistance = isHidden ? scrollableHeaderHeight : 0;

            headerCollapseDistance.value = withSpring(targetDistance, { ...SPRING_CONFIG, velocity }, (finished) => {
                if (finished) isSnapping.value = false;
            });

            if (forceSnapTabBar) {
                forceSnapTabBar(isHidden, velocity);
            }
        },
        onScroll: (event) => {
            if (!diffClampEnabled || isSnapping.value) {
                // Keep keeping track of real scroll Y even if ignoring delta
                const currentY = event.contentOffset.y;
                if (Number.isFinite(currentY) && currentY > 0) {
                    prevHeaderScrollY.value = currentY;
                }
                return;
            }

            const currentY = event.contentOffset.y;
            if (!Number.isFinite(currentY) || currentY <= 0) {
                headerCollapseDistance.value = 0;
                prevHeaderScrollY.value = Math.max(currentY, 0);
                return;
            }

            // Delta-based: direction-aware header collapse
            const delta = currentY - prevHeaderScrollY.value;
            prevHeaderScrollY.value = currentY;

            // During momentum (not actively dragging), detect bottom bounce
            // to prevent iOS from undoing collapse
            const contentHeight = event.contentSize.height;
            const viewHeight = event.layoutMeasurement.height;
            const isAtBottomBounce = currentY >= (contentHeight - viewHeight - 20);

            if (delta < 0 && !isDraggingLayout.value && isAtBottomBounce) {
                return;
            }

            headerCollapseDistance.value = clamp(
                headerCollapseDistance.value + delta,
                0,
                scrollableHeaderHeight,
            );
        },
    }, [diffClampEnabled, headerCollapseDistance, prevHeaderScrollY, scrollableHeaderHeight, forceSnapTabBar, isDraggingLayout]);

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
            scrollableHeaderHeight
        );
        return {
            transform: [{ translateY: -clampedDistance }],
        };
    }, [diffClampEnabled, headerCollapseDistance, scrollableHeaderHeight]);

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

        if (isMobileWebEnv) {
            return [
                {
                    paddingBottom,
                },
                contentContainerStyle,
            ];
        }

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
                    { position: 'sticky', top: 0, zIndex: 100 } as any
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

                    <View style={styles.animatedHeader}>
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
