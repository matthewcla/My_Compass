import type { CollapsibleScaffoldListProps } from '@/components/CollapsibleScaffold';
import { HistoricalPCSOrder } from '@/types/pcs';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import React, { useCallback, useMemo } from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { PCSMoveCard } from './PCSMoveCard';

const AnimatedFlashList = (Platform.OS === 'web'
  ? FlashList
  : Animated.createAnimatedComponent(FlashList)) as React.ComponentType<any>;

interface PCSMoveGridProps {
  orders: HistoricalPCSOrder[];
  onSelectOrder?: (orderId: string) => void;
  emptyTitle: string;
  emptySubtitle: string;
  listHeader?: React.ReactElement | null;
  listFooter?: React.ReactElement | null;
  listProps?: CollapsibleScaffoldListProps;
}

export function PCSMoveGrid({
  orders,
  onSelectOrder,
  emptyTitle,
  emptySubtitle,
  listHeader,
  listFooter,
  listProps,
}: PCSMoveGridProps) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 1024 ? 3 : width >= 680 ? 2 : 1;

  const key = useMemo(() => `archive-grid-${numColumns}`, [numColumns]);

  const contentContainerStyle = useMemo(
    () => [
      listProps?.contentContainerStyle,
      { paddingHorizontal: 12, paddingBottom: 120 },
      orders.length === 0 ? { flexGrow: 1 } : null,
    ],
    [listProps?.contentContainerStyle, orders.length]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<HistoricalPCSOrder>) => (
      <View
        style={{
          flex: 1 / numColumns,
          paddingHorizontal: numColumns === 1 ? 4 : 6,
          marginBottom: 12,
          maxWidth: `${100 / numColumns}%`,
        }}
      >
        <PCSMoveCard order={item} onPress={onSelectOrder} />
      </View>
    ),
    [numColumns, onSelectOrder]
  );

  const keyExtractor = useCallback((item: HistoricalPCSOrder) => item.id, []);

  const emptyComponent = useMemo(
    () => (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-lg font-bold text-slate-700 dark:text-slate-200 text-center">{emptyTitle}</Text>
        <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center leading-5">
          {emptySubtitle}
        </Text>
      </View>
    ),
    [emptySubtitle, emptyTitle]
  );

  return (
    <AnimatedFlashList
      key={key}
      data={orders}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      ListEmptyComponent={emptyComponent}
      onScroll={listProps?.onScroll}
      onScrollBeginDrag={listProps?.onScrollBeginDrag}
      onScrollEndDrag={listProps?.onScrollEndDrag}
      onLayout={listProps?.onLayout}
      onContentSizeChange={listProps?.onContentSizeChange}
      scrollEnabled={listProps?.scrollEnabled ?? true}
      scrollEventThrottle={listProps?.scrollEventThrottle ?? 16}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={210}
      drawDistance={620}
      removeClippedSubviews
      maintainVisibleContentPosition={{
        autoscrollToTopThreshold: 0,
        startRenderingFromBottom: false,
      }}
    />
  );
}
