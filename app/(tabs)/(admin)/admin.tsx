// app/(tabs)/(admin)/admin.tsx
// My Admin Hub — Unified Admin Landing Page
// Aggregates all request types into a single status feed.

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminFilterChips } from '@/components/admin/AdminFilterChips';
import { AdminHealthBar } from '@/components/admin/AdminHealthBar';
import { AdminRequestCard } from '@/components/admin/AdminRequestCard';
import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AdminRequest, useAdminStore } from '@/store/useAdminStore';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronUp, Plus } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // ── Store (individual selectors for stable references) ─────────────────
    const requests = useAdminStore(state => state.requests);
    const activeStatusFilter = useAdminStore(state => state.activeStatusFilter);
    const activeTypeFilter = useAdminStore(state => state.activeTypeFilter);
    const lastSyncedAt = useAdminStore(state => state.lastSyncedAt);

    // Derive filtered requests in component (avoids selector infinite loop)
    const filteredRequests = useMemo(() => {
        let filtered = [...requests];
        if (activeStatusFilter) {
            filtered = filtered.filter(r => r.status === activeStatusFilter);
        }
        if (activeTypeFilter === 'MY_ACTION') {
            filtered = filtered.filter(r => r.status === 'action_required');
        } else if (activeTypeFilter !== 'ALL') {
            filtered = filtered.filter(r => r.type === activeTypeFilter);
        }
        // Sort by urgency
        const statusPri: Record<string, number> = { action_required: 0, in_progress: 1, completed: 2 };
        const slaPri: Record<string, number> = { red: 0, amber: 1, green: 2 };
        return filtered.sort((a, b) => {
            const sd = (statusPri[a.status] ?? 2) - (statusPri[b.status] ?? 2);
            if (sd !== 0) return sd;
            const sla = (slaPri[a.slaStatus] ?? 2) - (slaPri[b.slaStatus] ?? 2);
            if (sla !== 0) return sla;
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        });
    }, [requests, activeStatusFilter, activeTypeFilter]);

    // ── Hydrate on mount (one-shot, no deps to avoid loops) ──────────────
    useEffect(() => {
        useAdminStore.getState().hydrateFromLeaveStore();
    }, []);

    // ── Completed accordion ──────────────────────────────────────────────────
    const [completedExpanded, setCompletedExpanded] = useState(false);

    const activeRequests = useMemo(
        () => filteredRequests.filter(r => r.status !== 'completed'),
        [filteredRequests]
    );
    const completedRequests = useMemo(
        () => filteredRequests.filter(r => r.status === 'completed'),
        [filteredRequests]
    );

    // ── Last synced label ────────────────────────────────────────────────────
    const lastSyncedLabel = useMemo(() => {
        try {
            const diff = Date.now() - new Date(lastSyncedAt).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'Just now';
            if (mins < 60) return `${mins} min ago`;
            return `${Math.floor(mins / 60)}h ago`;
        } catch {
            return 'Unknown';
        }
    }, [lastSyncedAt]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleCardPress = useCallback((request: AdminRequest) => {
        if (request.sourceId && request.type === 'LEAVE') {
            router.push(`/leave/${request.sourceId}` as any);
        } else {
            Alert.alert(request.label, `Status: ${request.currentStepLabel}\n\nDetailed view coming in a future update.`);
        }
    }, [router]);

    // ── New Request dropdown ─────────────────────────────────────────────────
    const showNewRequestMenu = useCallback(() => {
        const options = ['New Leave Request', 'Admin Request', 'Special Request', 'Cancel'];
        const cancelIdx = options.length - 1;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options, cancelButtonIndex: cancelIdx, title: 'New Request' },
                (idx) => {
                    if (idx === 0) router.push('/leave/request' as any);
                    else if (idx !== cancelIdx) Alert.alert('Coming Soon', 'This request type will be available in a future update.');
                }
            );
        } else {
            Alert.alert('New Request', undefined, [
                { text: 'Leave', onPress: () => router.push('/leave/request' as any) },
                { text: 'Admin', onPress: () => Alert.alert('Coming Soon') },
                { text: 'Special', onPress: () => Alert.alert('Coming Soon') },
                { text: 'Cancel', style: 'cancel' },
            ]);
        }
    }, [router]);

    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? Colors.gradient.dark[0] : Colors.gradient.light[0]}
                minTopBarHeight={70}
                topBar={
                    <View>
                        <ScreenHeader
                            title="MY ADMIN"
                            subtitle="Requests & Status"
                            withSafeArea={false}
                            variant="large"
                            leftAction={{
                                icon: ChevronLeft,
                                onPress: () => router.back(),
                            }}
                            rightAction={{
                                icon: Plus,
                                onPress: showNewRequestMenu,
                            }}
                        />
                        <View className="px-4 pb-2">
                            <AdminHealthBar lastSyncedLabel={lastSyncedLabel} />
                        </View>
                    </View>
                }
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
                    contentContainerStyle,
                }) => (
                    <Animated.ScrollView
                        onScroll={onScroll}
                        onScrollBeginDrag={onScrollBeginDrag}
                        onScrollEndDrag={onScrollEndDrag}
                        onLayout={onLayout}
                        onContentSizeChange={onContentSizeChange}
                        scrollEnabled={scrollEnabled}
                        scrollEventThrottle={scrollEventThrottle}
                        contentContainerStyle={[
                            contentContainerStyle,
                            { paddingBottom: 40 },
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Filter Chips — with breathing room */}
                        <View className="pt-3 pb-4">
                            <AdminFilterChips />
                        </View>

                        {/* Active Requests Feed */}
                        {activeRequests.length === 0 && completedRequests.length === 0 ? (
                            <AdminEmptyState />
                        ) : (
                            <>
                                {/* Active Request Cards */}
                                {activeRequests.map((request) => (
                                    <View key={request.id} className="mb-3">
                                        <AdminRequestCard
                                            request={request}
                                            onPress={() => handleCardPress(request)}
                                            onAction={() => {
                                                if (request.actionRoute) router.push(request.actionRoute as any);
                                                else Alert.alert(request.actionLabel || 'Action Needed', 'This action will be available in a future update.');
                                            }}
                                        />
                                    </View>
                                ))}

                                {/* Active empty state (when only filter hides actives) */}
                                {activeRequests.length === 0 && completedRequests.length > 0 && (
                                    <View className="items-center py-8">
                                        <Text className="text-sm text-slate-400 dark:text-slate-500">
                                            No active requests match this filter
                                        </Text>
                                    </View>
                                )}

                                {/* Completed Accordion */}
                                {completedRequests.length > 0 && (
                                    <View className="mt-4">
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => setCompletedExpanded(!completedExpanded)}
                                            className="flex-row items-center justify-between py-3 px-1"
                                        >
                                            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                                {completedRequests.length} Completed Request{completedRequests.length !== 1 ? 's' : ''}
                                            </Text>
                                            {completedExpanded ? (
                                                <ChevronUp size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2} />
                                            ) : (
                                                <ChevronDown size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2} />
                                            )}
                                        </TouchableOpacity>

                                        {completedExpanded && (
                                            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
                                                {completedRequests.map((request) => (
                                                    <View key={request.id} className="mb-3">
                                                        <AdminRequestCard
                                                            request={request}
                                                            onPress={() => handleCardPress(request)}
                                                        />
                                                        {/* Resolution Note */}
                                                        {request.resolutionNote && (
                                                            <View className="px-4 pt-1.5">
                                                                <Text className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                                                                    {request.resolutionNote}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                ))}
                                            </Animated.View>
                                        )}
                                    </View>
                                )}
                            </>
                        )}
                    </Animated.ScrollView>
                )}
            </CollapsibleScaffold>
        </ScreenGradient>
    );
}
