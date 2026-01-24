import { JobCard } from '@/components/JobCard';
import { JobCardSkeleton } from '@/components/JobCardSkeleton';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Billet } from '@/types/schema';
import React, { useEffect } from 'react';
import { Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
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

  const getApplicationStatus = (billetId: string) => {
    const app = Object.values(applications).find(
      (a) => a.billetId === billetId && a.userId === TEST_USER_ID
    );
    return app?.status;
  };

  const billetList = Object.values(billets);

  return (
    <View className="flex-1 bg-gray-100 dark:bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingTop: Platform.OS !== 'web' ? insets.top + 60 : 16
        }}
      >
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Available Assignments
          </Text>
          <Text className="text-gray-500 dark:text-gray-400">
            Real-time marketplace based on your profile
          </Text>
        </View>

        {isSyncingBillets ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ width: itemWidth, marginBottom: 16 }}>
                <JobCardSkeleton />
              </View>
            ))}
          </View>
        ) : (
          <Animated.View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}
            layout={LinearTransition}
          >
            {billetList.map((billet: Billet) => (
              <View
                key={billet.id}
                style={{ width: itemWidth, marginBottom: 16 }}
              >
                <JobCard
                  billet={billet}
                  onBuyPress={handleBuyPress}
                  isProcessing={isSyncingApplications}
                  applicationStatus={getApplicationStatus(billet.id)}
                />
              </View>
            ))}
          </Animated.View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Temporary User Context Indicator */}
      <View className="bg-gray-200 p-2 items-center">
        <Text className="text-xs text-gray-500">
          Acting as: {TEST_USER_ID}
        </Text>
      </View>
    </View>
  );
}
