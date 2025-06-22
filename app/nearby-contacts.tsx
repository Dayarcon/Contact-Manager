import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import NearbyContacts from '../components/NearbyContacts';
import { Contact } from '../context/ContactsContext';

export default function NearbyContactsScreen() {
  const router = useRouter();

  const handleContactPress = (contact: Contact) => {
    router.push({
      pathname: '/contact-details',
      params: { id: contact.id }
    });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Nearby Contacts" />
      </Appbar.Header>
      
      <NearbyContacts onContactPress={handleContactPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 