import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { DefaultTheme as PaperDefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { ContactsProvider } from '../context/ContactsContext';
import GeoLocationService from '../services/GeoLocationService';
import NotificationService from '../services/NotificationService';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Initialize services when app starts
    const initializeServices = async () => {
      try {
        // Initialize location service
        const geoLocationService = GeoLocationService.getInstance();
        await geoLocationService.initialize();

        // Initialize notification service
        const notificationService = NotificationService.getInstance();
        console.log('Services initialized successfully');
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      const geoLocationService = GeoLocationService.getInstance();
      geoLocationService.cleanup();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <PaperProvider theme={PaperDefaultTheme}>
      <NavigationThemeProvider value={DefaultTheme}>
        <ContactsProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-contact" options={{ headerShown: false }} />
            <Stack.Screen name="contact-details" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="vip-settings" options={{ headerShown: false }} />
            <Stack.Screen name="automation-settings" options={{ headerShown: false }} />
            <Stack.Screen name="duplicates" options={{ headerShown: false }} />
            <Stack.Screen name="location-settings" options={{ headerShown: false }} />
            <Stack.Screen name="nearby-contacts" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
        </ContactsProvider>
      </NavigationThemeProvider>
    </PaperProvider>
  );
}
