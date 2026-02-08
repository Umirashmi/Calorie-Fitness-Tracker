import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AppProviders } from '../providers/AppProviders';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { lightTheme } from '@/theme/paperTheme';

// Suppress timeout errors during development
if (__DEV__) {
  // Suppress LogBox warnings for timeout errors
  LogBox.ignoreLogs([
    '6000ms timeout exceeded',
    'setTimeout',
    'setTimeoutArgument_0',
    'flipper',
    'Flipper',
    'node_modules/flipperserver',
    'Request timeout',
    'Network request failed'
  ]);

  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Suppress React Native timeout and flipper errors
    const message = args[0];
    if (
      typeof message === 'string' && 
      (message.includes('6000ms timeout exceeded') ||
       message.includes('flipper') ||
       message.includes('Flipper') ||
       message.includes('setTimeoutArgument_0') ||
       message.includes('Request timeout'))
    ) {
      // Log to console instead of showing error overlay
      console.log('Suppressed timeout error:', message);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProviders>
          <ThemeProvider 
            value={{
              ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
              colors: {
                ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
                background: colorScheme === 'dark' 
                  ? 'rgb(16, 20, 18)' 
                  : 'rgb(251, 253, 252)',
              },
            }}
          >
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen 
                name="(auth)/login" 
                options={{ 
                  title: 'Sign In',
                  headerShown: false,
                  presentation: 'modal'
                }} 
              />
              <Stack.Screen 
                name="(auth)/register" 
                options={{ 
                  title: 'Sign Up',
                  headerShown: false,
                  presentation: 'modal'
                }} 
              />
              <Stack.Screen 
                name="goal-setting" 
                options={{ 
                  title: 'Nutrition Goals',
                  presentation: 'modal',
                  headerShown: true
                }} 
              />
              <Stack.Screen 
                name="food-search" 
                options={{ 
                  title: 'Log Food',
                  headerShown: true
                }} 
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AppProviders>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
