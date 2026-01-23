import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { SessionProvider, useSession } from '@/lib/ctx';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import { initDatabase } from '@/services/storage';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
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
      router.replace('/(tabs)');
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
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          console.log('Push Token:', token);
        }
      });
    }
  }, [loaded, dbInitialized]);

  if (!loaded || !dbInitialized) {
    return null;
  }

  return (
    <SessionProvider>
      <AuthGuard>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="leave" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </AuthGuard>
    </SessionProvider>
  );
}
