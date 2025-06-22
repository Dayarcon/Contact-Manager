import { router, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Appbar, Text } from 'react-native-paper';

export default function ScanCardScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Scan Business Card" />
      </Appbar.Header>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Business Card Scanner Coming Soon!</Text>
      </View>
    </View>
  );
} 