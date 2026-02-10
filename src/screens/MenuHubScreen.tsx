import OnboardingCard from '@/components/onboarding/OnboardingCard';
import { ScreenGradient } from '@/components/ScreenGradient';
import { useSession } from '@/lib/ctx';
import { DEMO_USERS, DemoPhase } from '@/constants/DemoData';
import { useDemoStore } from '@/store/useDemoStore';
import { useSpotlightStore } from '@/store/useSpotlightStore';

import { usePathname, useSegments } from 'expo-router';
import {
  ChevronRight,
  LogOut,
  Settings
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
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

  // Demo Store
  const isDemoMode = useDemoStore((state) => state.isDemoMode);
  const selectedUser = useDemoStore((state) => state.selectedUser);
  const selectedPhase = useDemoStore((state) => state.selectedPhase);
  const toggleDemoMode = useDemoStore((state) => state.toggleDemoMode);
  const setSelectedUser = useDemoStore((state) => state.setSelectedUser);
  const setSelectedPhase = useDemoStore((state) => state.setSelectedPhase);

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

        {/* Developer Settings */}
        {__DEV__ && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
            style={{ marginTop: 32, paddingBottom: 20 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ color: theme.subText }} className="font-semibold uppercase text-xs tracking-widest">
                Developer Settings
              </Text>
              <Switch
                value={isDemoMode}
                onValueChange={toggleDemoMode}
                trackColor={{ false: theme.border, true: '#F59E0B' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isDemoMode && (
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FCD34D',
                }}
                className="rounded-2xl p-4 border border-dashed"
              >
                <Text className="text-amber-500 font-bold text-xs uppercase tracking-wider mb-4 text-center">
                  Simulation Active
                </Text>

                {/* User Selector */}
                <View className="mb-4">
                  <Text style={{ color: theme.text }} className="font-medium mb-2 text-sm">Select Persona</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {DEMO_USERS.map((u) => (
                      <TouchableOpacity
                        key={u.id}
                        onPress={() => setSelectedUser(u)}
                        className={`px-3 py-2 rounded-lg border mr-2 ${selectedUser.id === u.id ? 'bg-amber-500 border-amber-600' : 'bg-transparent border-gray-200'}`}
                        style={{ borderColor: selectedUser.id === u.id ? '#D97706' : theme.border }}
                      >
                        <Text
                          style={{ color: selectedUser.id === u.id ? '#FFFFFF' : theme.subText }}
                          className="text-xs font-semibold"
                        >
                          {u.displayName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Phase Selector */}
                <View className="mb-4">
                  <Text style={{ color: theme.text }} className="font-medium mb-2 text-sm">Select Phase</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {Object.values(DemoPhase).map((phase) => (
                      <TouchableOpacity
                        key={phase}
                        onPress={() => setSelectedPhase(phase)}
                        className={`px-3 py-2 rounded-lg border ${selectedPhase === phase ? 'bg-amber-500 border-amber-600' : 'bg-transparent border-gray-200'}`}
                        style={{ borderColor: selectedPhase === phase ? '#D97706' : theme.border }}
                      >
                        <Text
                          style={{ color: selectedPhase === phase ? '#FFFFFF' : theme.subText }}
                          className="text-xs font-semibold"
                        >
                          {phase}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Text style={{ color: theme.subText }} className="text-center text-xs mt-2">
                  Simulating: <Text style={{ color: theme.text }} className="font-bold">{selectedUser.displayName} ({selectedUser.rank})</Text>
                </Text>
              </View>
            )}
          </MotiView>
        )}

      </ScrollView>


    </ScreenGradient>
  );
}
