import { JobCard } from '@/components/JobCard';
import { JobCardSkeleton } from '@/components/JobCardSkeleton';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Billet } from '@/types/schema';
import React, { useEffect } from 'react';
import { Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEST_USER_ID = 'test-user-001';

export default function AssignmentsScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;

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
    // Find if we have an application for this billet
    const app = Object.values(applications).find(
      (a) => a.billetId === billetId && a.userId === TEST_USER_ID
    );
    return app?.status;
  };

  const billetList = Object.values(billets);

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingTop: Platform.OS !== 'web' ? insets.top + 60 : 16
        }}
      >
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            Available Assignments
          </Text>
          <Text className="text-gray-500">
            Real-time marketplace based on your profile
          </Text>
        </View>


        {isSyncingBillets ? (
          <View className="flex-row flex-wrap gap-4">
            <View style={{ width: isDesktop ? '32%' : isTablet ? '48%' : '100%' }}>
              <JobCardSkeleton />
            </View>
            <View style={{ width: isDesktop ? '32%' : isTablet ? '48%' : '100%' }}>
              <JobCardSkeleton />
            </View>
            <View style={{ width: isDesktop ? '32%' : isTablet ? '48%' : '100%' }}>
              <JobCardSkeleton />
            </View>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-4">
            {billetList.map((billet: Billet) => (
              <View
                key={billet.id}
                style={{ width: isDesktop ? '32%' : isTablet ? '48%' : '100%' }}
              >
                <JobCard
                  billet={billet}
                  onBuyPress={handleBuyPress}
                  isProcessing={isSyncingApplications}
                  applicationStatus={getApplicationStatus(billet.id)}
                />
              </View>
            ))}
          </View>
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
