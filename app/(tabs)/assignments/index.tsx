import { JobCard } from '@/components/JobCard';
import { JobCardSkeleton } from '@/components/JobCardSkeleton';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Billet } from '@/types/schema';
import React, { useEffect, useMemo } from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEST_USER_ID = 'test-user-001';

export default function AssignmentsScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Layout Constants
  const SIDEBAR_WIDTH = 280;
  const CONTAINER_PADDING = 32; // 16px left + 16px right from ScrollView padding
  const GAP = 16;

  // Determine effective content width
  // On Desktop Web (>=768px), the sidebar is present via _layout.web.tsx
  const isWebDesktop = Platform.OS === 'web' && width >= 768;
  const availableWidth = isWebDesktop
    ? width - SIDEBAR_WIDTH - CONTAINER_PADDING
    : width - CONTAINER_PADDING;

  // Determine Column Count based on available width
  let numColumns = 1;
  if (availableWidth >= 900) {
    numColumns = 3;
  } else if (availableWidth >= 550) {
    numColumns = 2;
  }

  // Calculate Exact Item Width: (TotalWidth - TotalGapWidth) / NumCols
  const totalGapWidth = (numColumns - 1) * GAP;
  const itemWidth = Math.floor((availableWidth - totalGapWidth) / numColumns);

  const {
    billets,
    applications,
    fetchBillets,
    buyItNow,
    isSyncingApplications,
    isSyncingBillets,
  } = useAssignmentStore();

  useEffect(() => {
    fetchBillets();
  }, []);

  const handleBuyPress = (billetId: string) => {
    buyItNow(billetId, TEST_USER_ID);
  };

  const applicationStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.values(applications).forEach((a) => {
      if (a.userId === TEST_USER_ID) {
        map[a.billetId] = a.status;
      }
    });
    return map;
  }, [applications]);

  const getApplicationStatus = (billetId: string) => {
    return applicationStatusMap[billetId];
  };

  const billetList = useMemo(() => Object.values(billets), [billets]);

  const renderHeader = () => (
    <View className="mb-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
        Available Assignments
      </Text>
      <Text className="text-gray-500 dark:text-gray-400">
        Real-time marketplace based on your profile
      </Text>
    </View>
  );

  const renderFooter = () => <View className="h-8" />;

  const renderItem = ({ item }: { item: Billet | number }) => {
    if (isSyncingBillets) {
      return (
        <View style={{ width: itemWidth, marginBottom: 16 }}>
          <JobCardSkeleton />
        </View>
      );
    }

    const billet = item as Billet;
    return (
      <View style={{ width: itemWidth, marginBottom: 16 }}>
        <JobCard
          billet={billet}
          onBuyPress={handleBuyPress}
          isProcessing={isSyncingApplications}
          applicationStatus={getApplicationStatus(billet.id)}
        />
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-100 dark:bg-black">
      <Animated.FlatList
        key={numColumns} // Force re-render when columns change
        data={isSyncingBillets ? [1, 2, 3] : billetList}
        renderItem={renderItem}
        keyExtractor={(item) => (isSyncingBillets ? item.toString() : (item as Billet).id)}
        numColumns={numColumns}
        contentContainerStyle={{
          padding: 16,
          paddingTop: Platform.OS !== 'web' ? insets.top + 60 : 16
        }}
        columnWrapperStyle={numColumns > 1 ? { gap: GAP } : undefined}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        itemLayoutAnimation={LinearTransition}
      />

      {/* Temporary User Context Indicator */}
      <View className="bg-gray-200 p-2 items-center">
        <Text className="text-xs text-gray-500">
          Acting as: {TEST_USER_ID}
        </Text>
      </View>
    </View>
  );
}
