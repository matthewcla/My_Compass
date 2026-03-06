import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import '../ignoreWarnings';

// Suppress strict-mode warnings from Layout animations reading shared values during render
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });
SecureLogger.patchGlobalConsole();

import { AuthGuard } from '@/components/navigation/AuthGuard';
import { FloatingSpotlightPill } from '@/components/navigation/FloatingSpotlightPill';
import { SessionTimeoutOverlay } from '@/components/SessionTimeoutOverlay';
import { SpotlightOverlay } from '@/components/spotlight/SpotlightOverlay';
import { ThemeTransitionOverlay } from '@/components/ThemeTransitionOverlay';
import { KeyboardActionToolbar } from '@/components/ui/KeyboardActionToolbar';
import { useColorScheme } from '@/components/useColorScheme';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { SessionProvider, useSession } from '@/lib/ctx';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import { storage } from '@/services/storage';
import { syncQueue } from '@/services/syncQueue';
import { usePCSStore } from '@/store/usePCSStore';
import { SecureLogger } from '@/utils/logger';
import { View } from 'react-native';

// SI-11: Custom error boundary — safe messaging, no raw error/stack trace exposed
export { AppErrorBoundary as ErrorBoundary } from '@/components/AppErrorBoundary';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

const safeSplashHide = async () => {
  try {
    await SplashScreen.hideAsync();
  } catch (e) {
    // Explicitly swallow all errors
  }
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore error - splash screen is already hidden */
});

// Extracted inner layout to consume Session context
function InnerLayout() {
  const [fontsLoaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const { session, signOut, isLoading: isSessionLoading, consentAcknowledged } = useSession();

  // IA-11: Idle timeout — only active when authenticated AND past consent banner
  const { showWarning, remainingSeconds, resetTimer } = useIdleTimeout(
    signOut,
    !!session && consentAcknowledged,
  );

  // Track splash state to prevent double-hide race conditions
  const isSplashHidden = useRef(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    let cancelled = false;

    const initStorage = async () => {
      try {
        await storage.init();
        await syncQueue.init();
        if (!cancelled) {
          setDbInitialized(true);
        }
      } catch (e) {
        SecureLogger.error('[Layout] Failed to initialize database:', e);
        if (!cancelled) {
          setDbInitialized(true);
        }
      }
    };

    void initStorage();
    usePCSStore.getState().initializeOrdersCache();

    return () => {
      cancelled = true;
    };
  }, []);

  const hideSplash = useCallback(async () => {
    if (isSplashHidden.current) return;
    isSplashHidden.current = true;
    await safeSplashHide();
  }, []);

  // Safety Timeout: Force hide splash if app hangs for 5 seconds (increased from 2)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isSplashHidden.current) {
        SecureLogger.warn('[Layout] Splash Screen Force Hide: Safety Timeout Triggered (5000ms)');
        hideSplash().catch(e => SecureLogger.warn('[Layout] hideSplash failed in timeout:', e));
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [hideSplash]);

  // Orchestration: Hide Splash only when EVERYTHING is ready (including auth session)
  useEffect(() => {
    if (fontsLoaded && dbInitialized && isLayoutReady && !isSessionLoading) {
      hideSplash().catch(e => SecureLogger.warn('[Layout] hideSplash failed in orchestration:', e));
      registerForPushNotificationsAsync();
    }
  }, [fontsLoaded, dbInitialized, isLayoutReady, isSessionLoading, hideSplash]);

  const onLayoutRootView = useCallback(async () => {
    setIsLayoutReady(true);
  }, []);

  const colorScheme = useColorScheme();

  if (!fontsLoaded || !dbInitialized) {
    return null;
  }

  return (
    <>
      <AuthGuard />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} translucent />
      <View
        className="flex-1 bg-white dark:bg-black"
        onLayout={onLayoutRootView}
        style={{ position: 'relative' }}
        onStartShouldSetResponderCapture={() => { resetTimer(); return false; }}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="sign-in" options={{ gestureEnabled: false }} />
          <Stack.Screen name="consent" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="leave" />
        </Stack>
        <ThemeTransitionOverlay />
        <SessionTimeoutOverlay
          visible={showWarning}
          remainingSeconds={remainingSeconds}
          onExtend={resetTimer}
        />
        {session && <FloatingSpotlightPill />}
        {session && <SpotlightOverlay />}
        <KeyboardActionToolbar />
      </View>
    </>
  );
}


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <InnerLayout />
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
