import {
    COLLAPSE_ACTIVATION_OFFSET,
    computeCollapseDistanceFromScrollY,
    computeMinContentHeightForCollapse,
    computeRequiredCollapseTravel,
} from '@/components/navigation/collapseMath';
import { useScrollContext, useScrollControl } from '@/components/navigation/ScrollControlContext';
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
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScrollEventHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
type SnapBehavior = 'threshold' | 'velocity' | 'none';

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
    const { reservedBottomInset, tabBarCollapsedInsetPx, tabBarMaxHeightPx } = useScrollContext();

    // Mobile Web Strategy: Disable DiffClamp animation and use position: sticky
    const isMobileWebEnv = useMemo(() => Platform.OS === 'web', []);
    const diffClampEnabled = !isMobileWebEnv;

    // The scrollable distance is the total header height minus the part that should remain visible (sticky)
    // We clamp minTopBarHeight against measured height to avoid impossible ranges.
    const clampedMinTopBarHeight = Math.min(Math.max(minTopBarHeight, 0), animatedHeaderHeight);
    const scrollableHeaderHeight = Math.max(animatedHeaderHeight - clampedMinTopBarHeight, 0);
    const headerCollapseDistance = useSharedValue(0);

    const { onScroll: scrollControlHandler } = useScrollControl();
    const headerScrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (!diffClampEnabled) {
                return;
            }

            const currentY = event.contentOffset.y;
            if (!Number.isFinite(currentY) || currentY <= 0) {
                headerCollapseDistance.value = 0;
                return;
            }

            headerCollapseDistance.value = computeCollapseDistanceFromScrollY({
                currentScrollY: currentY,
                maxDistance: scrollableHeaderHeight,
                activationOffset: COLLAPSE_ACTIVATION_OFFSET,
            });
        },
    }, [diffClampEnabled, headerCollapseDistance, scrollableHeaderHeight]);

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

            // Prevent transient layout shrink reports during drag from collapsing
            // the range abruptly. We accept growth and first measurement.
            if (previousHeight <= 0) {
                return nextHeight;
            }

            return Math.max(previousHeight, nextHeight);
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

    const requiredCollapseTravel = useMemo(() => {
        return computeRequiredCollapseTravel({
            scrollableHeaderHeight,
            tabBarMaxHeight: tabBarMaxHeightPx,
            tabBarCollapsedInset: tabBarCollapsedInsetPx,
        });
    }, [scrollableHeaderHeight, tabBarCollapsedInsetPx, tabBarMaxHeightPx]);

    const minContentHeight = useMemo(() => {
        return computeMinContentHeightForCollapse({
            viewportHeight,
            requiredCollapseTravel,
        });
    }, [requiredCollapseTravel, viewportHeight]);

    const paddedContentContainerStyle = useMemo(() => {
        const paddingBottom = Math.max(reservedBottomInset, insets.bottom);

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
    }, [animatedHeaderHeight, contentContainerStyle, isMobileWebEnv, minContentHeight, statusBarShimHeight, insets.bottom, reservedBottomInset]);

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
