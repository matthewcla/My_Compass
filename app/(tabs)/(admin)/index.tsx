import AdminFeedWidget from '@/components/admin/AdminFeedWidget';
import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { ScreenGradient } from '@/components/ScreenGradient';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useRef } from 'react';
import { Platform, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const AnimatedFlashList = (Platform.OS === 'web'
    ? FlashList
    : Animated.createAnimatedComponent(FlashList)) as React.ComponentType<any>;

export default function AdminDashboard() {
    const isDark = useColorScheme() === 'dark';
    const listRef = useRef<any>(null);

    const sections = ['adminFeed'];

    const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
        const delay = index * 60;
        switch (item) {
            case 'adminFeed':
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <AdminFeedWidget />
                    </Animated.View>
                );
            default:
                return null;
        }
    }, []);


    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? Colors.gradient.dark[0] : Colors.gradient.light[0]}
                minTopBarHeight={0}
                topBar={null}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                {({
                    onScroll,
                    onScrollBeginDrag,
                    onScrollEndDrag,
                    onLayout,
                    onContentSizeChange,
                    scrollEnabled,
                    scrollEventThrottle,
                    contentContainerStyle
                }) => (
                    <AnimatedFlashList
                        ref={listRef}
                        data={sections}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => (
                            <View style={{ height: 24 }} />
                        )}
                        ListHeaderComponent={<View style={{ height: 24 }} />}
                        ListFooterComponent={<View style={{ height: 250 }} />}
                        estimatedItemSize={250}
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        scrollEventThrottle={scrollEventThrottle}
                        onScroll={onScroll}
                        onScrollBeginDrag={onScrollBeginDrag}
                        onScrollEndDrag={onScrollEndDrag}
                        onLayout={onLayout}
                        onContentSizeChange={onContentSizeChange}
                        scrollEnabled={scrollEnabled}
                        contentContainerStyle={contentContainerStyle}
                    />
                )}
            </CollapsibleScaffold>
        </ScreenGradient>
    );
}
