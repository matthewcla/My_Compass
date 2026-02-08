import { TAB_BAR_HEIGHT, useScrollControl } from '@/components/navigation/ScrollControlContext';
import type { SnapBehavior } from '@/hooks/useDiffClampScroll';
import { useDiffClampScroll } from '@/hooks/useDiffClampScroll';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useDerivedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScrollEventHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

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
    snapBehavior = 'threshold',
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
    const [contentHeight, setContentHeight] = useState<number | null>(null);

    // Mobile Web Strategy: Disable DiffClamp animation and use position: sticky
    const isMobileWebEnv = useMemo(() => Platform.OS === 'web', []);
    const diffClampEnabled = !isMobileWebEnv;

    // The scrollable distance is the total header height minus the part that should remain visible (sticky)
    // We max at 1 to avoid division by zero or invalid ranges if height is 0
    const scrollableHeaderHeight = Math.max(animatedHeaderHeight - minTopBarHeight, 0);
    const clampRange = Math.max(scrollableHeaderHeight, 1); // Clamp range no longer depends on bottomBarHeight

    const { clampedScrollValue, onScroll: diffClampOnScroll, updateFromScrollY } = useDiffClampScroll({
        headerHeight: clampRange,
        enabled: diffClampEnabled,
        snapBehavior
    });

    const { onScroll: scrollControlHandler } = useScrollControl({
        onScroll: (event) => {
            const e = event as any;
            if (e.nativeEvent?.contentOffset?.y !== undefined) {
                updateFromScrollY(e.nativeEvent.contentOffset.y);
            }
        }
    });

    useEffect(() => {
        if (clampedScrollValue.value > clampRange) {
            clampedScrollValue.value = clampRange;
        }
    }, [clampRange, clampedScrollValue]);

    const topTranslateY = useDerivedValue(() => {
        if (!diffClampEnabled) return 0;
        return interpolate(
            clampedScrollValue.value,
            [0, clampRange],
            [0, -scrollableHeaderHeight],
            Extrapolation.CLAMP
        );
    });

    const topBarAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: topTranslateY.value }],
        };
    });

    const handleAnimatedHeaderLayout = useCallback((event: LayoutChangeEvent) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        if (nextHeight <= 0 || nextHeight === animatedHeaderHeight) {
            return;
        }

        setAnimatedHeaderHeight(nextHeight);
    }, [animatedHeaderHeight]);

    const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        setViewportHeight((prevHeight) => (prevHeight === nextHeight ? prevHeight : nextHeight));
    }, []);

    const handleContentSizeChange = useCallback((_width: number, height: number) => {
        const nextHeight = Math.round(height);
        setContentHeight((prevHeight) => (prevHeight === nextHeight ? prevHeight : nextHeight));
    }, []);

    const shouldDisableScrollListener = useMemo(() => {
        if (viewportHeight === null || contentHeight === null) {
            return false;
        }

        return contentHeight < viewportHeight;
    }, [contentHeight, viewportHeight]);

    useEffect(() => {
        if (shouldDisableScrollListener && clampedScrollValue.value !== 0) {
            clampedScrollValue.value = 0;
        }
    }, [clampedScrollValue, shouldDisableScrollListener]);

    const paddedContentContainerStyle = useMemo(() => {
        const paddingBottom = TAB_BAR_HEIGHT + insets.bottom;

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
            },
            contentContainerStyle,
        ];
    }, [animatedHeaderHeight, contentContainerStyle, isMobileWebEnv, statusBarShimHeight, insets.bottom]);

    const listProps = useMemo<CollapsibleScaffoldListProps>(() => {
        return {
            onScroll: (shouldDisableScrollListener || isMobileWebEnv) ? undefined : scrollControlHandler,
            onScrollBeginDrag: (shouldDisableScrollListener || isMobileWebEnv) ? undefined : diffClampOnScroll,
            onScrollEndDrag: (shouldDisableScrollListener || isMobileWebEnv) ? undefined : diffClampOnScroll,
            onLayout: handleViewportLayout,
            onContentSizeChange: handleContentSizeChange,
            scrollEnabled: !shouldDisableScrollListener,
            scrollEventThrottle: 16,
            clipToPadding: false,
            contentContainerStyle: paddedContentContainerStyle,
        };
    }, [
        handleContentSizeChange,
        handleViewportLayout,
        isMobileWebEnv,
        scrollControlHandler,
        diffClampOnScroll,
        paddedContentContainerStyle,
        shouldDisableScrollListener
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
