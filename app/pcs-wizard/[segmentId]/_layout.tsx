import { usePCSStore } from '@/store/usePCSStore';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function PCSWizardLayout() {
  const { segmentId } = useLocalSearchParams<{ segmentId: string }>();
  const [isReady, setIsReady] = useState(false);
  const currentDraft = usePCSStore((state) => state.currentDraft);

  useEffect(() => {
    const init = async () => {
      // Hydrate if needed
      if (usePCSStore.persist && !usePCSStore.persist.hasHydrated()) {
        await usePCSStore.persist.rehydrate();
      }

      const store = usePCSStore.getState();

      // Initialize mock orders if empty
      if (!store.activeOrder) {
        store.initializeOrders();
      }

      // Start planning the segment
      if (segmentId) {
        store.startPlanning(segmentId);
      }

      setIsReady(true);
    };

    init();
  }, [segmentId]);

  if (!isReady || !currentDraft || currentDraft.id !== segmentId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading Segment...</Text>
        <Text>{segmentId}</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="mode" />
      <Stack.Screen name="itinerary" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
