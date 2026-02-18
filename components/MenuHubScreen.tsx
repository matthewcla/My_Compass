import OnboardingCard from '@/components/onboarding/OnboardingCard';
import { ScreenGradient } from '@/components/ScreenGradient';
import { useSession } from '@/lib/ctx';
import { useDemoStore } from '@/store/useDemoStore';
import { useSpotlightStore } from '@/store/useSpotlightStore';
import { useUserStore } from '@/store/useUserStore';

import Constants from 'expo-constants';
import { usePathname, useSegments } from 'expo-router';
import {
  ChevronDown,
  LogOut,
  Settings,
  Shield
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useState } from 'react';
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
  const enableDevSettings = Constants.expoConfig?.extra?.enableDevSettings ?? __DEV__;
  const showDevFloatingIcons = useDemoStore((s) => s.showDevFloatingIcons);
  const toggleDevFloatingIcons = useDemoStore((s) => s.toggleDevFloatingIcons);
  const [settingsOpen, setSettingsOpen] = useState(false);


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

        {/* Settings Section (Expandable) */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderBottomLeftRadius: settingsOpen ? 0 : 24,
              borderBottomRightRadius: settingsOpen ? 0 : 24,
            }}
            className="rounded-t-3xl p-5 flex-row items-center justify-between shadow-sm border border-b-0"
            onPress={() => setSettingsOpen((v: boolean) => !v)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View style={{ backgroundColor: isDark ? '#27272A' : '#F1F5F9' }} className="p-3 rounded-full mr-4">
                <Settings size={24} color={isDark ? '#E2E8F0' : '#64748B'} />
              </View>
              <Text style={{ color: theme.text }} className="font-bold text-[17px]">Settings</Text>
            </View>
            <View style={{ backgroundColor: isDark ? '#27272A' : '#F8FAFC', transform: [{ rotate: settingsOpen ? '180deg' : '0deg' }] }} className="p-2 rounded-full">
              <ChevronDown size={20} color={theme.icon} />
            </View>
          </TouchableOpacity>

          {settingsOpen && (
            <MotiView
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 250 }}
            >
              <View
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }}
                className="rounded-b-3xl px-5 pb-5 pt-3 border border-t-0 mb-8"
              >
                {/* Privacy Mode Toggle */}
                <View className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center gap-3 flex-1 mr-4">
                    <Shield size={18} color={isDark ? '#60A5FA' : '#2563EB'} />
                    <View className="flex-1">
                      <Text style={{ color: theme.text }} className="font-semibold text-[15px]">Privacy Mode</Text>
                      <Text style={{ color: theme.subText }} className="text-xs mt-0.5">Hide rank and name from dashboard greeting</Text>
                    </View>
                  </View>
                  <Switch
                    value={useUserStore.getState().user?.privacyMode ?? false}
                    onValueChange={(val) => useUserStore.getState().updateUser({ privacyMode: val })}
                    trackColor={{ false: isDark ? '#3f3f46' : '#d1d5db', true: '#2563EB' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </MotiView>
          )}

          {!settingsOpen && <View className="mb-8" />}
        </MotiView>

        {/* Dev Tools Toggle — only in dev builds */}
        {__DEV__ && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
          >
            <View
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
              className="rounded-3xl p-5 flex-row items-center justify-between shadow-sm border mb-8"
            >
              <View className="flex-row items-center">
                <View style={{ backgroundColor: isDark ? '#27272A' : '#F1F5F9' }} className="p-3 rounded-full mr-4">
                  <Text style={{ fontSize: 20 }}>🧪</Text>
                </View>
                <Text style={{ color: theme.text }} className="font-bold text-[17px]">Dev Tools</Text>
              </View>
              <Switch
                value={showDevFloatingIcons}
                onValueChange={toggleDevFloatingIcons}
                trackColor={{ false: isDark ? '#3f3f46' : '#d1d5db', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </MotiView>
        )}

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
