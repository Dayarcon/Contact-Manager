import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="add-contact" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="edit-contact" options={{ headerShown: false }} />
        <Stack.Screen name="scan-card" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="manage-contacts" options={{ headerShown: false }} />
        <Stack.Screen name="quick-actions" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
