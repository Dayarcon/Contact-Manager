import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, View } from 'react-native';
import { Appbar, Avatar, Button, Card, Text, useTheme } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import styled from 'styled-components/native';
import { useContacts } from '../../context/ContactsContext';

const Container = styled.View`
  flex: 1;
`;

const HeaderGradient = styled(LinearGradient)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
`;

const ContentScroll = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const ActionCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 16px;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 12px;
`;

const ActionButton = styled(Button)`
  margin: 8px;
  border-radius: 12px;
  elevation: 2;
`;

const ContactInfo = styled.View`
  align-items: center;
  padding: 24px;
  margin-bottom: 24px;
  background-color: #f5f5f5;
  border-radius: 16px;
`;

const ContactAvatar = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 8px;
`;

const ContactName = styled(Text)`
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 8px;
  color: #000000;
`;

const ContactSubtitle = styled(Text)`
  font-size: 14px;
  text-align: center;
  color: #666666;
  margin-bottom: 8px;
`;

const SectionHeader = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #6200ee;
`;

const ActionGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 8px;
`;

const GridButton = styled.View`
  width: 48%;
  margin-bottom: 12px;
`;

export default function QuickActionsScreen() {
  const router = useRouter();
  
  // Try to access theme with error handling
  let theme;
  try {
    theme = useTheme();
  } catch (error) {
    console.error('Error accessing theme:', error);
    // Fallback theme object
    theme = {
      colors: {
        primary: '#6200ee',
        primaryContainer: '#e8def8',
        secondary: '#03dac6',
        secondaryContainer: '#ccdbfc',
        tertiary: '#018786',
        tertiaryContainer: '#b8e5d8',
        error: '#b00020',
        errorContainer: '#f9dedc',
        background: '#ffffff',
        surface: '#ffffff',
        surfaceVariant: '#f5f5f5',
        onSurface: '#000000',
        onSurfaceVariant: '#666666',
        outline: '#c1c1c1',
        outlineVariant: '#e0e0e0'
      }
    };
  }

  // Try to access search params with error handling
  let searchParams;
  try {
    searchParams = useLocalSearchParams();
  } catch (error) {
    console.error('Error accessing search params:', error);
    searchParams = {};
  }

  const { id } = searchParams;

  // Try to access context with error handling
  let context;
  try {
    context = useContacts();
  } catch (error) {
    console.error('Error accessing contacts context:', error);
    context = {
      contacts: [],
      isLoading: true,
      addContact: () => console.warn('Context not available'),
      editContact: () => console.warn('Context not available'),
      deleteContact: () => console.warn('Context not available'),
      toggleFavorite: () => console.warn('Context not available'),
      importContacts: () => console.warn('Context not available'),
      setContacts: () => console.warn('Context not available'),
      addHistoryEvent: () => console.warn('Context not available'),
      mergeContacts: () => console.warn('Context not available'),
      findDuplicates: () => [],
      getContactStats: () => ({ total: 0, favorites: 0, groups: {}, recent: 0 }),
      searchContacts: () => [],
      getContactsByGroup: () => [],
      getFavoriteContacts: () => [],
      getRecentContacts: () => []
    };
  }

  const { contacts, isLoading } = context || {
    contacts: [],
    isLoading: true
  };

  const contact = contacts?.find(c => c.id === id);

  if (isLoading) {
    return (
      <Container style={{ backgroundColor: theme.colors.background }}>
        <HeaderGradient
          colors={[theme.colors.primary, theme.colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.BackAction onPress={() => router.back()} iconColor="white" />
          <Appbar.Content 
            title="Quick Actions" 
            titleStyle={{ color: 'white', fontWeight: 'bold' }}
          />
        </Appbar.Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </Container>
    );
  }

  if (!id) {
    return (
      <Container style={{ backgroundColor: theme.colors.background }}>
        <HeaderGradient
          colors={[theme.colors.primary, theme.colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.BackAction onPress={() => router.back()} iconColor="white" />
          <Appbar.Content 
            title="Quick Actions" 
            titleStyle={{ color: 'white', fontWeight: 'bold' }}
          />
        </Appbar.Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No contact ID provided.</Text>
        </View>
      </Container>
    );
  }

  if (!contact) {
    return (
      <Container style={{ backgroundColor: theme.colors.background }}>
        <HeaderGradient
          colors={[theme.colors.primary, theme.colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.BackAction onPress={() => router.back()} iconColor="white" />
          <Appbar.Content 
            title="Quick Actions" 
            titleStyle={{ color: 'white', fontWeight: 'bold' }}
          />
        </Appbar.Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Contact not found.</Text>
        </View>
      </Container>
    );
  }

  const primaryPhone = contact.phoneNumbers?.find(p => p.isPrimary) || contact.phoneNumbers?.[0];
  const primaryEmail = contact.emailAddresses?.find(e => e.isPrimary) || contact.emailAddresses?.[0];

  const handleCall = async () => {
    if (primaryPhone) {
      try {
        const canOpen = await Linking.canOpenURL(`tel:${primaryPhone.number}`);
        if (canOpen) {
          await Linking.openURL(`tel:${primaryPhone.number}`);
        } else {
          // Fallback: show alert with phone number
          Alert.alert(
            'Phone Dialer Not Available',
            `Phone number: ${primaryPhone.number}\n\nThis device doesn't support phone calls or you're running in a simulator.`,
            [
              { text: 'Copy Number', onPress: () => Clipboard.setString(primaryPhone.number) },
              { text: 'OK', style: 'cancel' }
            ]
          );
        }
      } catch (error) {
        console.error('Error opening phone dialer:', error);
        Alert.alert(
          'Cannot Open Phone Dialer',
          `Phone number: ${primaryPhone.number}\n\nThis feature is not available on this device or simulator.`,
          [
            { text: 'Copy Number', onPress: () => Clipboard.setString(primaryPhone.number) },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    }
  };

  const handleMessage = async () => {
    if (primaryPhone) {
      try {
        const canOpen = await Linking.canOpenURL(`sms:${primaryPhone.number}`);
        if (canOpen) {
          await Linking.openURL(`sms:${primaryPhone.number}`);
        } else {
          // Fallback: show alert with phone number
          Alert.alert(
            'SMS Not Available',
            `Phone number: ${primaryPhone.number}\n\nThis device doesn't support SMS or you're running in a simulator.`,
            [
              { text: 'Copy Number', onPress: () => Clipboard.setString(primaryPhone.number) },
              { text: 'OK', style: 'cancel' }
            ]
          );
        }
      } catch (error) {
        console.error('Error opening SMS:', error);
        Alert.alert(
          'Cannot Open SMS',
          `Phone number: ${primaryPhone.number}\n\nThis feature is not available on this device or simulator.`,
          [
            { text: 'Copy Number', onPress: () => Clipboard.setString(primaryPhone.number) },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    }
  };

  const handleEmail = async () => {
    if (primaryEmail) {
      try {
        const canOpen = await Linking.canOpenURL(`mailto:${primaryEmail.email}`);
        if (canOpen) {
          await Linking.openURL(`mailto:${primaryEmail.email}`);
        } else {
          // Fallback: show alert with email
          Alert.alert(
            'Email Not Available',
            `Email: ${primaryEmail.email}\n\nThis device doesn't support email or you're running in a simulator.`,
            [
              { text: 'Copy Email', onPress: () => Clipboard.setString(primaryEmail.email) },
              { text: 'OK', style: 'cancel' }
            ]
          );
        }
      } catch (error) {
        console.error('Error opening email:', error);
        Alert.alert(
          'Cannot Open Email',
          `Email: ${primaryEmail.email}\n\nThis feature is not available on this device or simulator.`,
          [
            { text: 'Copy Email', onPress: () => Clipboard.setString(primaryEmail.email) },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    }
  };

  const handleVideoCall = () => {
    if (primaryPhone) {
      // For video calls, we'll use a generic video call URL
      // In a real app, you might integrate with specific video calling services
      Linking.openURL(`tel:${primaryPhone.number}`);
    }
  };

  const handleWebsite = () => {
    if (contact.website) {
      Linking.openURL(contact.website);
    }
  };

  const handleMaps = () => {
    if (contact.address) {
      const encodedAddress = encodeURIComponent(contact.address);
      Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
    }
  };

  const handleShare = async () => {
    const shareText = `${contact.name}\n${primaryPhone?.number || ''}\n${primaryEmail?.email || ''}`;
    // In a real app, you would use the Share API
    console.log('Share:', shareText);
  };

  const handleAddToCalendar = () => {
    if (contact.birthday) {
      const birthday = new Date(contact.birthday);
      const eventTitle = `${contact.name}'s Birthday`;
      const eventDate = birthday.toISOString().split('T')[0];
      // In a real app, you would create a calendar event
      console.log('Add to calendar:', eventTitle, eventDate);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Container style={{ backgroundColor: theme.colors.background }}>
      <HeaderGradient
        colors={[theme.colors.primary, theme.colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
        <Appbar.BackAction onPress={() => router.back()} iconColor="white" />
        <Appbar.Content 
          title="Quick Actions" 
          titleStyle={{ color: 'white', fontWeight: 'bold' }}
        />
      </Appbar.Header>
      
      <ContentScroll>
        <Animated.View entering={FadeInUp.delay(100)}>
          <ActionCard>
            <Card.Content>
              <ContactInfo>
                {contact.imageUri ? (
                  <Avatar.Image
                    source={{ uri: contact.imageUri }}
                    size={80}
                    style={{ alignSelf: 'center' }}
                  />
                ) : (
                  <Avatar.Text
                    label={getInitials(contact.name)}
                    size={80}
                    style={{ 
                      backgroundColor: contact.isFavorite ? theme.colors.primary : theme.colors.secondary,
                      alignSelf: 'center'
                    }}
                  />
                )}
                <ContactName>{contact.name}</ContactName>
                {primaryPhone && (
                  <ContactSubtitle>{primaryPhone.number}</ContactSubtitle>
                )}
                {contact.company && (
                  <ContactSubtitle>{contact.company}</ContactSubtitle>
                )}
              </ContactInfo>
            </Card.Content>
          </ActionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)}>
          <ActionCard>
            <Card.Content>
              <SectionHeader>Communication</SectionHeader>
              <ActionGrid>
                <GridButton>
                  <ActionButton
                    mode="contained"
                    icon="phone"
                    onPress={handleCall}
                    disabled={!primaryPhone}
                    style={{ backgroundColor: theme.colors.primary }}
                    contentStyle={{ height: 48 }}
                  >
                    Call
                  </ActionButton>
                </GridButton>
                <GridButton>
                  <ActionButton
                    mode="contained"
                    icon="message"
                    onPress={handleMessage}
                    disabled={!primaryPhone}
                    style={{ backgroundColor: theme.colors.secondary }}
                    contentStyle={{ height: 48 }}
                  >
                    Message
                  </ActionButton>
                </GridButton>
                <GridButton>
                  <ActionButton
                    mode="contained"
                    icon="email"
                    onPress={handleEmail}
                    disabled={!primaryEmail}
                    style={{ backgroundColor: theme.colors.tertiary }}
                    contentStyle={{ height: 48 }}
                  >
                    Email
                  </ActionButton>
                </GridButton>
                <GridButton>
                  <ActionButton
                    mode="contained"
                    icon="video"
                    onPress={handleVideoCall}
                    disabled={!primaryPhone}
                    style={{ backgroundColor: theme.colors.error }}
                    contentStyle={{ height: 48 }}
                  >
                    Video Call
                  </ActionButton>
                </GridButton>
              </ActionGrid>
            </Card.Content>
          </ActionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)}>
          <ActionCard>
            <Card.Content>
              <SectionHeader>Information & Sharing</SectionHeader>
              <ActionGrid>
                {contact.website && (
                  <GridButton>
                    <ActionButton
                      mode="outlined"
                      icon="web"
                      onPress={handleWebsite}
                      style={{ borderColor: theme.colors.outline }}
                      contentStyle={{ height: 48 }}
                    >
                      Website
                    </ActionButton>
                  </GridButton>
                )}
                {contact.address && (
                  <GridButton>
                    <ActionButton
                      mode="outlined"
                      icon="map-marker"
                      onPress={handleMaps}
                      style={{ borderColor: theme.colors.outline }}
                      contentStyle={{ height: 48 }}
                    >
                      Maps
                    </ActionButton>
                  </GridButton>
                )}
                <GridButton>
                  <ActionButton
                    mode="outlined"
                    icon="share-variant"
                    onPress={handleShare}
                    style={{ borderColor: theme.colors.outline }}
                    contentStyle={{ height: 48 }}
                  >
                    Share
                  </ActionButton>
                </GridButton>
                {contact.birthday && (
                  <GridButton>
                    <ActionButton
                      mode="outlined"
                      icon="calendar"
                      onPress={handleAddToCalendar}
                      style={{ borderColor: theme.colors.outline }}
                      contentStyle={{ height: 48 }}
                    >
                      Calendar
                    </ActionButton>
                  </GridButton>
                )}
              </ActionGrid>
            </Card.Content>
          </ActionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)}>
          <ActionCard>
            <Card.Content>
              <SectionHeader>Contact Management</SectionHeader>
              <ActionGrid>
                <GridButton>
                  <ActionButton
                    mode="outlined"
                    icon="pencil"
                    onPress={() => router.push({ pathname: '/(tabs)/edit-contact', params: { id: contact.id } })}
                    style={{ borderColor: theme.colors.outline }}
                    contentStyle={{ height: 48 }}
                  >
                    Edit Contact
                  </ActionButton>
                </GridButton>
                <GridButton>
                  <ActionButton
                    mode="outlined"
                    icon="account-details"
                    onPress={() => router.push({ pathname: '/contact-details', params: { id: contact.id } })}
                    style={{ borderColor: theme.colors.outline }}
                    contentStyle={{ height: 48 }}
                  >
                    View Details
                  </ActionButton>
                </GridButton>
              </ActionGrid>
            </Card.Content>
          </ActionCard>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ContentScroll>
    </Container>
  );
} 