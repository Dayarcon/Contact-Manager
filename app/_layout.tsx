import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme as PaperDefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { ContactsProvider } from '../context/ContactsContext';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

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
            <Stack.Screen name="duplicates" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
        </ContactsProvider>
      </NavigationThemeProvider>
    </PaperProvider>
  );
}
