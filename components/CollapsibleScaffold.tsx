import { useDiffClampScroll } from '@/hooks/useDiffClampScroll';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
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

type ScrollEventHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

export interface CollapsibleScaffoldListProps {
    onScroll: ScrollEventHandler;
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
    initialTopBarHeight?: number;
    initialBottomBarHeight?: number;
    testID?: string;
}

/**
 * Usage (event wiring):
 *
 * <CollapsibleScaffold topBar={<TopBar />} bottomBar={<BottomBar />}>
 *   {({ onScroll, scrollEventThrottle, clipToPadding, contentContainerStyle }) => (
 *     <Animated.FlatList
 *       data={items}
 *       renderItem={renderItem}
 *       onScroll={onScroll}
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
    initialTopBarHeight = 0,
    initialBottomBarHeight = 0,
    testID,
}: CollapsibleScaffoldProps) {
    const [topBarHeight, setTopBarHeight] = useState(initialTopBarHeight);
    const [bottomBarHeight, setBottomBarHeight] = useState(initialBottomBarHeight);

    const clampRange = Math.max(topBarHeight, bottomBarHeight, 1);
    const { clampedScrollValue, onScroll } = useDiffClampScroll({ headerHeight: clampRange });

    useEffect(() => {
        if (clampedScrollValue.value > clampRange) {
            clampedScrollValue.value = clampRange;
        }
    }, [clampRange, clampedScrollValue]);

    const topTranslateY = useDerivedValue(() => {
        return interpolate(
            clampedScrollValue.value,
            [0, clampRange],
            [0, -topBarHeight],
            Extrapolation.CLAMP
        );
    });

    const bottomTranslateY = useDerivedValue(() => {
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

    const handleTopBarLayout = useCallback((event: LayoutChangeEvent) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        if (nextHeight !== topBarHeight) {
            setTopBarHeight(nextHeight);
        }
    }, [topBarHeight]);

    const handleBottomBarLayout = useCallback((event: LayoutChangeEvent) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        if (nextHeight !== bottomBarHeight) {
            setBottomBarHeight(nextHeight);
        }
    }, [bottomBarHeight]);

    const paddedContentContainerStyle = useMemo(() => {
        return [
            {
                paddingTop: topBarHeight,
                paddingBottom: bottomBarHeight,
            },
            contentContainerStyle,
        ];
    }, [bottomBarHeight, contentContainerStyle, topBarHeight]);

    const listProps = useMemo<CollapsibleScaffoldListProps>(() => {
        return {
            onScroll,
            scrollEventThrottle: 16,
            clipToPadding: false,
            contentContainerStyle: paddedContentContainerStyle,
        };
    }, [onScroll, paddedContentContainerStyle]);

    return (
        <View style={[styles.container, containerStyle]} testID={testID}>
            {children(listProps)}

            <Animated.View style={[styles.topBarContainer, topBarAnimatedStyle]}>
                <View onLayout={handleTopBarLayout}>
                    {topBar}
                </View>
            </Animated.View>

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
        zIndex: 10,
        elevation: 10,
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
