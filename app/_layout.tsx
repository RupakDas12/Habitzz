import SplashScreen from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { HabitProvider, useHabits } from '@/context/HabitContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

// Handle notifications when app is in foreground
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true, // Required for iOS
      shouldShowList: true,   // Required for iOS
    }),
  });
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { session, isLoading: authLoading } = useAuth();
  const { isOnboardingCompleted, isLoading: habitLoading } = useHabits();
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  const isLoading = authLoading || habitLoading;

  useEffect(() => {
    if (isLoading || showSplash) return;

    const inAuth = (segments[0] as string) === 'auth';
    const inOnboarding = (segments[0] as string) === 'onboarding';

    if (!session) {
      if (!inAuth) router.replace('/auth' as any);
    } else if (!isOnboardingCompleted) {
      if (!inOnboarding) router.replace('/onboarding' as any);
    } else {
      if (inAuth || inOnboarding) router.replace('/(tabs)' as any);
    }
  }, [session, isOnboardingCompleted, isLoading, showSplash, segments]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) return <Slot />;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'New Habit', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <HabitProvider>
        <RootLayoutNav />
      </HabitProvider>
    </AuthProvider>
  );
}
