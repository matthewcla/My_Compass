import { BilletSwipeCard } from '@/components/BilletSwipeCard';
import { SwipeDirection, useAssignmentStore } from '@/store/useAssignmentStore';
import { Tabs } from 'expo-router';
import { RotateCcw } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEST_USER_ID = 'test-user-001';

export default function AssignmentsScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const {
    billets,
    billetStack,
    cursor,
    fetchBillets,
    swipe,
    isSyncingBillets,
  } = useAssignmentStore();

  useEffect(() => {
    fetchBillets();
  }, []);

  const handleSwipe = (direction: SwipeDirection) => {
    // Determine which billet is being swiped
    // The cursor points to the current active card in the stack
    const currentBilletId = billetStack[cursor];
    if (currentBilletId) {
      swipe(currentBilletId, direction, TEST_USER_ID);
    }
  };

  const currentBilletId = billetStack[cursor];
  const nextBilletId = billetStack[cursor + 1];

  const renderDeck = () => {
    if (isSyncingBillets) {
      return (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Loading Billets...</Text>
        </View>
      );
    }

    if (cursor >= billetStack.length) {
      return (
        <View className="flex-1 justify-center items-center p-8">
          <View className="bg-white dark:bg-slate-800 p-8 rounded-3xl items-center shadow-lg w-full max-w-sm">
            <View className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-full mb-4">
              <RotateCcw size={40} className="text-blue-600 dark:text-blue-400" color="#2563EB" />
            </View>
            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase">
              Deck Cleared
            </Text>
            <Text className="text-center text-slate-500 dark:text-slate-400 mb-6">
              You've reviewed all available assignments. Check back later for new billets.
            </Text>
            <TouchableOpacity
              onPress={() => fetchBillets()}
              className="bg-navyBlue py-4 px-8 rounded-xl w-full"
            >
              <Text className="text-white text-center font-bold uppercase tracking-widest">
                Refresh List
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Calculate available height for the card deck
    // Header: ~80px (insets.top + 20 + title heights ~40)
    // Footer: Needs to be large to clear Tab Bar (80px) + Visual spacing
    const HEADER_HEIGHT = insets.top + 80;
    const FOOTER_HEIGHT = insets.bottom + 120; // Increased significantly to clear tab bar
    const TAB_BAR_HEIGHT = 80;
    const cardHeight = height - HEADER_HEIGHT - FOOTER_HEIGHT - TAB_BAR_HEIGHT;

    return (
      <View className="flex-1 justify-center items-center relative pt-8">
        {/* Changed pb-8 to pt-8 to push card DOWN away from header, balancing the top-heavy feel */}
        {/* Maximum Width Constraint for iPad/Web */}
        <View style={{ width: Math.min(width - 32, 400), height: Math.max(cardHeight, 400) }}>

          {/* Background Card (Next) */}
          {nextBilletId && billets[nextBilletId] && (
            <View style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}>
              <BilletSwipeCard
                key={nextBilletId}
                billet={billets[nextBilletId]}
                onSwipe={() => { }} // Background card shouldn't fire
                active={false}
                index={1}
              />
            </View>
          )}

          {/* Active Card (Current) */}
          {currentBilletId && billets[currentBilletId] && (
            <View style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 10 }}>
              <BilletSwipeCard
                key={currentBilletId} // Key is crucial for Reanimated to treat as new instance
                billet={billets[currentBilletId]}
                onSwipe={handleSwipe}
                active={true}
                index={0}
              />
            </View>
          )}

        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-gray-100 dark:bg-black">
        {/* Header */}
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20 }} className="z-50">
          <Text className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            DISCOVER
          </Text>
          <Text className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs">
            A World of Opportunity
          </Text>
        </View>

        {renderDeck()}

        {/* Temporary Footer / Controls hint */}
        <View style={{ paddingBottom: insets.bottom + 120 }} className="items-center">
          {/* Increased padding to 120 to ensure text sits ABOVE the floating tab bar */}
          <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            Swipe Right to LIKE • Up to LOVE • Left to PASS
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

