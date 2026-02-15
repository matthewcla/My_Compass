import type { CollapsibleScaffoldListProps } from '@/components/CollapsibleScaffold';
import { ArchiveSearchBar } from '@/components/pcs/archive/ArchiveSearchBar';
import { PCSMoveGrid } from '@/components/pcs/archive/PCSMoveGrid';
import { useAvailableFiscalYears, useFilteredHistoricalOrders, usePCSArchiveStore } from '@/store/usePCSArchiveStore';
import { useUserStore } from '@/store/useUserStore';
import { Anchor, Archive, Ship } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * PCS Archive State — "Digital Sea Bag"
 *
 * Shown when no active PCS orders exist.
 * Displays a dormant/ready state with a prompt.
 *
 * This component has NO internal scroll — scroll is
 * delegated to the parent CollapsibleScaffold.
 */
interface PCSArchiveStateProps {
    listProps?: CollapsibleScaffoldListProps;
    footer?: React.ReactElement | null;
}

function EmptyArchiveState() {
    return (
        <View className="px-4 pt-8 pb-12">
            <View className="items-center mb-8">
                <View className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4 border-2 border-slate-200 dark:border-slate-700">
                    <Anchor size={36} className="text-slate-400 dark:text-slate-500" />
                </View>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
                    Digital Sea Bag
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400 text-center leading-5 max-w-[280px]">
                    Your archived PCS history will appear here after your first completed move.
                </Text>
            </View>

            <View className="gap-4">
                <View className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
                            <Ship size={20} className="text-blue-600 dark:text-blue-400" />
                        </View>
                        <Text className="text-base font-bold text-slate-900 dark:text-white">Ready to Move</Text>
                    </View>
                    <Text className="text-sm text-slate-600 dark:text-slate-300 leading-5">
                        Once your orders are issued, we&apos;ll build your checklist, calculate entitlements, and guide every
                        relocation milestone.
                    </Text>
                </View>

                <View className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 items-center justify-center">
                            <Archive size={20} className="text-amber-600 dark:text-amber-400" />
                        </View>
                        <Text className="text-base font-bold text-slate-900 dark:text-white">Past Moves</Text>
                    </View>
                    <Text className="text-sm text-slate-600 dark:text-slate-300 leading-5">
                        Every completed PCS move and document set is saved here for quick retrieval.
                    </Text>
                </View>
            </View>
        </View>
    );
}

export function PCSArchiveState({ listProps, footer = null }: PCSArchiveStateProps) {
    const userId = useUserStore((state) => state.user?.id);
    const historicalOrders = usePCSArchiveStore((state) => state.historicalOrders);
    const filterYear = usePCSArchiveStore((state) => state.filterYear);
    const fetchHistoricalOrders = usePCSArchiveStore((state) => state.fetchHistoricalOrders);
    const setSearchQuery = usePCSArchiveStore((state) => state.setSearchQuery);
    const setFilterYear = usePCSArchiveStore((state) => state.setFilterYear);
    const selectOrder = usePCSArchiveStore((state) => state.selectOrder);

    const filteredOrders = useFilteredHistoricalOrders();
    const availableYears = useAvailableFiscalYears();
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        if (!userId) return;
        void fetchHistoricalOrders(userId);
    }, [fetchHistoricalOrders, userId]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchInput, setSearchQuery]);

    const listHeader = useMemo(
        () => (
            <View>
                <View className="px-4 pt-8 pb-2">
                    <Text className="text-2xl font-bold text-slate-900 dark:text-white">Digital Sea Bag</Text>
                    <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Search archived PCS moves by command, location, or fiscal year.
                    </Text>
                </View>
                <ArchiveSearchBar
                    value={searchInput}
                    onChangeText={setSearchInput}
                    filterYear={filterYear}
                    years={availableYears}
                    onSelectYear={setFilterYear}
                    resultCount={filteredOrders.length}
                    totalCount={historicalOrders.length}
                />
            </View>
        ),
        [availableYears, filterYear, filteredOrders.length, historicalOrders.length, searchInput, setFilterYear]
    );

    if (historicalOrders.length === 0) {
        return (
            <Animated.ScrollView
                entering={FadeIn.duration(400)}
                exiting={FadeOut.duration(200)}
                onScroll={listProps?.onScroll}
                onScrollBeginDrag={listProps?.onScrollBeginDrag}
                onScrollEndDrag={listProps?.onScrollEndDrag}
                onLayout={listProps?.onLayout}
                onContentSizeChange={listProps?.onContentSizeChange}
                scrollEnabled={listProps?.scrollEnabled ?? true}
                scrollEventThrottle={listProps?.scrollEventThrottle ?? 16}
                contentContainerStyle={listProps?.contentContainerStyle}
                showsVerticalScrollIndicator={false}
            >
                <EmptyArchiveState />
                {footer}
            </Animated.ScrollView>
        );
    }

    return (
        <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={{ flex: 1 }}>
            <PCSMoveGrid
                orders={filteredOrders}
                onSelectOrder={selectOrder}
                listHeader={listHeader}
                listFooter={footer}
                listProps={listProps}
                emptyTitle="No archived moves match your filters"
                emptySubtitle="Try a different command, location, or fiscal year."
            />
        </Animated.View>
    );
}
