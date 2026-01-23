import { JobCard } from '@/components/JobCard';
import { JobCardSkeleton } from '@/components/JobCardSkeleton';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Billet } from '@/types/schema';
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';

const TEST_USER_ID = 'test-user-001';

export default function AssignmentsScreen() {
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
      <ScrollView className="flex-1 p-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            Available Assignments
          </Text>
          <Text className="text-gray-500">
            Real-time marketplace based on your profile
          </Text>
        </View>

        {isSyncingBillets ? (
          <>
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </>
        ) : (
          billetList.map((billet: Billet) => (
            <JobCard
              key={billet.id}
              billet={billet}
              onBuyPress={handleBuyPress}
              isProcessing={isSyncingApplications}
              applicationStatus={getApplicationStatus(billet.id)}
            />
          ))
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
