import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { useRouter, useSegments } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

import { AccountDrawer } from '@/components/AccountDrawer';
import AppDrawerContent from '@/components/navigation/AppDrawerContent';
import { SessionProvider, useSession } from '@/lib/ctx';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import { initDatabase } from '@/services/storage';
import { useUIStore } from '@/store/useUIStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(hub)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Auth Guard Component
 * 
 * Watches the session state and handles navigation:
 * - If session is valid → redirect to /(tabs)
 * - If session is null → ensure user stays on /sign-in
 * - Prevents back navigation to login after successful authentication
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Don't navigate while auth state is loading
    if (isLoading) return;

    // Check if user is on an auth route (sign-in page)
    const inAuthGroup = segments[0] === 'sign-in';

    if (!session && !inAuthGroup) {
      // User is not authenticated and not on sign-in page
      // Redirect to sign-in and replace history to prevent back navigation
      router.replace('/sign-in');
    } else if (session && inAuthGroup) {
      // User is authenticated but still on sign-in page
      // Redirect to main app and replace history to prevent back navigation to login
      router.replace('/(hub)/dashboard');
    }
  }, [session, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbInitialized, setDbInitialized] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    initDatabase()
      .then(() => setDbInitialized(true))
      .catch((e) => {
        console.error('Failed to initialize database:', e);
        // On web, or if DB fails, we still might want to show the UI for testing/audit purposes
        // specially if we are just verifying UI components.
        setDbInitialized(true);
      });
  }, []);

  useEffect(() => {
    if (loaded && dbInitialized) {
      SplashScreen.hideAsync();
      registerForPushNotificationsAsync();
    }
  }, [loaded, dbInitialized]);

  if (!loaded || !dbInitialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="auto" />
        <AccountDrawer
          visible={useUIStore((state) => state.isAccountDrawerOpen)}
          onClose={() => useUIStore.getState().closeAccountDrawer()}
        />
        <AuthGuard>
          <Drawer
            drawerContent={(props) => <AppDrawerContent {...props} />}
            screenOptions={{ headerShown: false }}
          >
            <Drawer.Screen name="(hub)" options={{ headerShown: false }} />
            <Drawer.Screen name="(assignment)" options={{ headerShown: false }} />
            <Drawer.Screen name="(pcs)" options={{ headerShown: false }} />
            <Drawer.Screen name="(admin)" options={{ headerShown: false }} />
            <Drawer.Screen name="(profile)" options={{ headerShown: false }} />
            <Drawer.Screen
              name="sign-in"
              options={{
                headerShown: false,
                drawerItemStyle: { display: 'none' },
                swipeEnabled: false,
              }}
            />
            <Drawer.Screen
              name="leave"
              options={{
                headerShown: false,
                drawerItemStyle: { display: 'none' },
              }}
            />
          </Drawer>
        </AuthGuard>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
