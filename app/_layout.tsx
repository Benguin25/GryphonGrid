import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { loadOnboarded } from '../lib/db';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

/** Redirect unauthenticated users to login; redirect authenticated users through onboarding if needed. */
function AuthGuard() {
  const { user, loading, onboardingDone, markOnboardingDone } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Load onboarding flag from Firestore once when the user signs in.
  // onboarding.tsx calls markOnboardingDone() synchronously before navigating
  // so there is no race condition on first completion.
  useEffect(() => {
    if (!user) {
      setOnboardingChecked(false);
      return;
    }
    setOnboardingChecked(false);
    loadOnboarded(user.uid).then((done) => {
      if (done) markOnboardingDone();
      setOnboardingChecked(true);
    });
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading) return;

    const inAuthGroup  = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    // 1. Not logged in → force login
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    // 2. Logged in but still checking → wait
    if (user && !onboardingChecked) return;

    // 3. Logged in, onboarding not complete → go to onboarding
    if (user && !onboardingDone && !inOnboarding) {
      router.replace("/onboarding");
      return;
    }

    // 4. Logged in, onboarding done, but stuck on auth/onboarding → go to app
    if (user && onboardingDone && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments, onboardingChecked, onboardingDone]);

  return null;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGuard />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
