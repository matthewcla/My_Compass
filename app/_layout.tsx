import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

import { AccountDrawer } from '@/components/AccountDrawer';
import { SessionProvider } from '@/lib/ctx';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import { storage } from '@/services/storage';
import { useUIStore } from '@/store/useUIStore';
import { View } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(hub)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* shielding */
});

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Track splash state to prevent double-hide race conditions
  const isSplashHidden = useRef(false);

  const isAccountDrawerOpen = useUIStore((state) => state.isAccountDrawerOpen);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    storage.init()
      .then(() => setDbInitialized(true))
      .catch((e) => {
        console.error('Failed to initialize database:', e);
        // On web, or if DB fails, we still might want to show the UI for testing/audit purposes
        setDbInitialized(true);
      });
  }, []);

  const hideSplash = useCallback(async () => {
    if (isSplashHidden.current) return;
    isSplashHidden.current = true;

    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      // "No native splash screen registered" is common if it auto-hid or was forced.
    }
  }, []);

  // Safety Timeout: Force hide splash if app hangs for 2 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isSplashHidden.current) {
        console.warn('Splash Screen Force Hide: Safety Timeout Triggered (2000ms)');
        hideSplash();
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [hideSplash]);

  // Orchestration: Hide Splash only when EVERYTHING is ready
  useEffect(() => {
    if (fontsLoaded && dbInitialized && isLayoutReady) {
      hideSplash();
      registerForPushNotificationsAsync();
    }
  }, [fontsLoaded, dbInitialized, isLayoutReady, hideSplash]);

  const onLayoutRootView = useCallback(async () => {
    setIsLayoutReady(true);
  }, []);

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="auto" />
        <View
          className="flex-1 bg-white dark:bg-black"
          onLayout={onLayoutRootView}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(hub)" />
            <Stack.Screen name="(assignment)" />
            <Stack.Screen name="(pcs)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(profile)" />
            <Stack.Screen name="sign-in" options={{ gestureEnabled: false }} />
            <Stack.Screen name="leave" />
          </Stack>
          {/* AccountDrawer is rendered AFTER Stack to ensure navigation context is available */}
          <AccountDrawer
            visible={isAccountDrawerOpen}
            onClose={() => useUIStore.getState().closeAccountDrawer()}
          />
        </View>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
