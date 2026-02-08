import type { SnapBehavior } from '@/hooks/useDiffClampScroll';
import { useDiffClampScroll } from '@/hooks/useDiffClampScroll';
import { isMobileWeb } from '@/utils/platform';
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
    onScroll: ScrollEventHandler;
    onLayout: (event: LayoutChangeEvent) => void;
    onContentSizeChange: (width: number, height: number) => void;
    scrollEnabled: boolean;
    scrollEventThrottle: number;
    clipToPadding: false;
    contentContainerStyle: StyleProp<ViewStyle>;
}

interface CollapsibleScaffoldProps {
    topBar: React.ReactNode;
    bottomBar: React.ReactNode;
    children: (props: CollapsibleScaffoldListProps) => React.ReactElement;
    containerStyle?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    statusBarShimBackgroundColor?: string;
    initialTopBarHeight?: number;
    initialBottomBarHeight?: number;
    snapBehavior?: SnapBehavior;
    testID?: string;
}

/**
 * Usage (event wiring):
 *
 * <CollapsibleScaffold topBar={<TopBar />} bottomBar={<BottomBar />}>
 *   {({
 *     onScroll,
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
    bottomBar,
    children,
    containerStyle,
    contentContainerStyle,
    statusBarShimBackgroundColor = '#ffffff',
    initialTopBarHeight = 0,
    initialBottomBarHeight = 0,
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
    const [bottomBarHeight, setBottomBarHeight] = useState(initialBottomBarHeight);
    const [viewportHeight, setViewportHeight] = useState<number | null>(null);
    const [contentHeight, setContentHeight] = useState<number | null>(null);

    // Mobile Web Strategy: Disable DiffClamp animation and use position: sticky
    const isMobileWebEnv = useMemo(() => isMobileWeb(), []);
    const diffClampEnabled = !isMobileWebEnv;

    // The scrollable distance is the total header height minus the part that should remain visible (sticky)
    // We max at 1 to avoid division by zero or invalid ranges if height is 0
    const scrollableHeaderHeight = Math.max(animatedHeaderHeight - minTopBarHeight, 0);
    const clampRange = Math.max(scrollableHeaderHeight, bottomBarHeight, 1);

    const { clampedScrollValue, onScroll } = useDiffClampScroll({
        headerHeight: clampRange,
        enabled: diffClampEnabled,
        snapBehavior
    });
    const noopScrollHandler = useCallback<ScrollEventHandler>(() => { }, []);

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

    const bottomTranslateY = useDerivedValue(() => {
        if (!diffClampEnabled) return 0;
        return interpolate(
            clampedScrollValue.value,
            [0, clampRange],
            [0, bottomBarHeight],
            Extrapolation.CLAMP
        );
    });

    const topBarAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: topTranslateY.value }],
        };
    });

    const bottomBarAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: bottomTranslateY.value }],
        };
    });

    const handleAnimatedHeaderLayout = useCallback((event: LayoutChangeEvent) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        if (nextHeight <= 0 || nextHeight === animatedHeaderHeight) {
            return;
        }

        setAnimatedHeaderHeight(nextHeight);
    }, [animatedHeaderHeight]);

    const handleBottomBarLayout = useCallback((event: LayoutChangeEvent) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        if (nextHeight !== bottomBarHeight) {
            setBottomBarHeight(nextHeight);
        }
    }, [bottomBarHeight]);

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
        const totalTopBarHeight = statusBarShimHeight + animatedHeaderHeight;
        return [
            {
                paddingTop: totalTopBarHeight,
                paddingBottom: bottomBarHeight,
            },
            contentContainerStyle,
        ];
    }, [animatedHeaderHeight, bottomBarHeight, contentContainerStyle, statusBarShimHeight]);

    const listProps = useMemo<CollapsibleScaffoldListProps>(() => {
        return {
            onScroll: shouldDisableScrollListener ? noopScrollHandler : onScroll,
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
        noopScrollHandler,
        onScroll,
        paddedContentContainerStyle,
        shouldDisableScrollListener
    ]);

    return (
        <View style={[styles.container, containerStyle]} testID={testID}>
            {children(listProps)}

            <View style={[
                styles.topBarContainer,
                isMobileWebEnv && { position: 'sticky', top: 0 } as any
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

            <Animated.View style={[styles.bottomBarContainer, bottomBarAnimatedStyle]}>
                <View onLayout={handleBottomBarLayout}>
                    {bottomBar}
                </View>
            </Animated.View>
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
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        elevation: 10,
    },
});
