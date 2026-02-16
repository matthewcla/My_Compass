import OnboardingCard from '@/components/onboarding/OnboardingCard';
import { ScreenGradient } from '@/components/ScreenGradient';
import { useSession } from '@/lib/ctx';
import { useSpotlightStore } from '@/store/useSpotlightStore';

import { usePathname, useSegments } from 'expo-router';
import {
  ChevronRight,
  LogOut,
  Settings
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



export default function MenuHubScreen() {
  const { signOut } = useSession();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const segments = useSegments();
  const segmentList = segments as string[];
  const isDark = colorScheme === 'dark';
  const isMenuModalRoute = segmentList.includes('MenuHubModal') || pathname.includes('MenuHubModal');


  // Dynamic Theme Colors
  const theme = {
    background: isDark ? '#000000' : '#F2F2F7',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0F172A',
    subText: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? '#27272A' : '#F1F5F9',
    inputBg: isDark ? '#27272A' : '#F8FAFC',
    icon: isDark ? '#94A3B8' : '#94A3B8',
  };


  const openSpotlight = useSpotlightStore((state) => state.open);
  const spotlightQuery = useSpotlightStore((state) => state.query);
  const setSpotlightQuery = useSpotlightStore((state) => state.setQuery);

  const ensureModalSpotlightOpen = React.useCallback(() => {
    if (!useSpotlightStore.getState().isOpen) {
      openSpotlight({ source: 'shortcut', preserveQuery: true });
    }
  }, [openSpotlight]);



  return (
    <ScreenGradient>
      <View style={{ height: insets.top }} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: isMenuModalRoute ? 20 : 18,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 24
        }}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingCard />

        {/* Distinct Settings Tile (Full Width) */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }} // Hero Card slide up delay
        >
          <TouchableOpacity
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border
            }}
            className="rounded-3xl p-5 flex-row items-center justify-between shadow-sm border mb-8"
            onPress={() => console.log('Navigate to: /(profile)/settings')}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View style={{ backgroundColor: isDark ? '#27272A' : '#F1F5F9' }} className="p-3 rounded-full mr-4">
                <Settings size={24} color={isDark ? '#E2E8F0' : '#64748B'} />
              </View>
              <Text style={{ color: theme.text }} className="font-bold text-[17px]">Settings</Text>
            </View>
            <View style={{ backgroundColor: isDark ? '#27272A' : '#F8FAFC' }} className="p-2 rounded-full">
              <ChevronRight size={20} color={theme.icon} />
            </View>
          </TouchableOpacity>
        </MotiView>

        {/* Footer Action */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2'
            }}
            className="flex-row items-center justify-center py-4 rounded-3xl border"
            onPress={() => signOut()}
          >
            <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
            <Text className="text-red-600 font-bold text-[17px] ml-3">Log Out</Text>
          </TouchableOpacity>
        </MotiView>




      </ScrollView>


    </ScreenGradient>
  );
}
