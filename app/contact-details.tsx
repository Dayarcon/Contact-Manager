import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Linking, Modal, ScrollView, View, useWindowDimensions } from 'react-native';
import { Avatar, Button, Card, Chip, Dialog, FAB, IconButton, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import styled from 'styled-components/native';
import ContactTimeline from '../components/ContactTimeline';
import { useContacts } from '../context/ContactsContext';

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`;

const HeaderGradient = styled(LinearGradient)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  z-index: -1;
`;

const ContentScroll = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const CenteredCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 24px;
  elevation: 6;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 16px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const ContactAvatar = styled.View`
  align-items: center;
  margin-bottom: 20px;
`;

const ContactName = styled(Text)`
  font-size: 28px;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 8px;
  text-align: center;
  letter-spacing: 0.5px;
`;

const ContactSubtitle = styled(Text)`
  font-size: 16px;
  color: #666666;
  margin-bottom: 4px;
  text-align: center;
  letter-spacing: 0.3px;
`;

const BadgeContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
`;

const StyledBadge = styled(Chip)`
  background-color: #f0f0f0;
  border-radius: 20px;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 6px;
`;

const SectionCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 20px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const SectionHeader = styled(Text)`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1a1a1a;
  letter-spacing: 0.3px;
`;

const ActionButton = styled(Button)`
  margin: 8px 0;
  border-radius: 16px;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
`;

const InfoRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px 0;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

const InfoLabel = styled(Text)`
  font-size: 14px;
  color: #666666;
  font-weight: 600;
  width: 80px;
  letter-spacing: 0.2px;
`;

const InfoValue = styled(Text)`
  font-size: 16px;
  color: #1a1a1a;
  flex: 1;
  margin-left: 16px;
  letter-spacing: 0.3px;
`;

const TopSection = styled.View`
  margin-bottom: 20px;
`;

const DetailsSection = styled.View`
  padding: 20px;
`;

const GradientBackground = styled(LinearGradient)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

const QuickActionButton = styled(Button)`
  margin: 6px;
  border-radius: 12px;
  elevation: 2;
`;

const ActionRow = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  margin-top: 8px;
`;

const AnimatedCard = Animated.createAnimatedComponent(SectionCard);
const AnimatedCenteredCard = Animated.createAnimatedComponent(CenteredCard);

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (contact: any, theme: any) => {
  const colors = ['#6200ee', '#03dac6', '#ff6b35', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
  const index = contact.name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function ContactDetailsScreen() {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  
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
  
  const { width: windowWidth } = useWindowDimensions();

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

  const { contacts, isLoading, deleteContact, toggleFavorite, addHistoryEvent, editContact } = context || {
    contacts: [],
    isLoading: true,
    deleteContact: () => console.warn('Context not available'),
    toggleFavorite: () => console.warn('Context not available'),
    addHistoryEvent: () => console.warn('Context not available'),
    editContact: () => console.warn('Context not available')
  };

  const contact = contacts?.find(c => c.id === id);

  // State for editing notes
  const [notesDialogVisible, setNotesDialogVisible] = useState(false);
  const [notesDraft, setNotesDraft] = useState(contact?.notes || '');

  // Favorite badge animation state
  const [favScale, setFavScale] = useState(1);
  useEffect(() => {
    if (contact?.isFavorite) {
      setFavScale(1.2);
      setTimeout(() => setFavScale(1), 200);
    }
  }, [contact?.isFavorite]);

  // FAB animation state
  const [fabScale, setFabScale] = useState(1);
  const handleFabPress = () => {
    setFabScale(0.92);
    setTimeout(() => setFabScale(1), 120);
    router.push({ pathname: '/(tabs)/edit-contact', params: { id: contact?.id } });
  };

  // Copy phone to clipboard
  const [copied, setCopied] = useState(false);
  const handleCopyPhone = async () => {
    if (contact) {
      const primaryPhone = contact.phoneNumbers?.find(p => p.isPrimary) || contact.phoneNumbers?.[0];
      if (primaryPhone) {
        await Clipboard.setStringAsync(primaryPhone.number);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }
    }
  };

  // Image picker logic
  const handlePickImage = async () => {
    if (!contact) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      editContact(contact.id, { imageUri: result.assets[0].uri });
    }
  };

  // State for image preview modal
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Remove image logic
  const handleRemoveImage = () => {
    if (contact) {
      editContact(contact.id, { imageUri: undefined });
      setImageModalVisible(false);
    }
  };

  // Action handling functions
  const handleCall = async () => {
    if (!contact || !primaryPhone) {
      Alert.alert('No Phone Number', 'This contact doesn\'t have a phone number.');
      return;
    }
    
    try {
      const phoneNumber = primaryPhone.number.replace(/\s/g, '');
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, { type: 'call', detail: 'Called contact', date: new Date().toISOString() });
      } else {
        Alert.alert('Error', 'Cannot open phone dialer on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open phone dialer.');
    }
  };

  const handleMessage = async () => {
    if (!contact || !primaryPhone) {
      Alert.alert('No Phone Number', 'This contact doesn\'t have a phone number.');
      return;
    }
    
    try {
      const phoneNumber = primaryPhone.number.replace(/\s/g, '');
      const url = `sms:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, { type: 'message', detail: 'Opened messaging app', date: new Date().toISOString() });
      } else {
        Alert.alert('Error', 'Cannot open messaging app on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open messaging app.');
    }
  };

  const handleEmail = async () => {
    if (!contact || !primaryEmail) {
      Alert.alert('No Email', 'This contact doesn\'t have an email address.');
      return;
    }
    
    try {
      const email = primaryEmail.email;
      const url = `mailto:${email}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, { type: 'email', detail: 'Opened email app', date: new Date().toISOString() });
      } else {
        Alert.alert('Error', 'Cannot open email app on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email app.');
    }
  };

  const handleWhatsApp = async () => {
    if (!contact || !primaryPhone) {
      Alert.alert('No Phone Number', 'This contact doesn\'t have a phone number.');
      return;
    }
    
    try {
      const phoneNumber = primaryPhone.number.replace(/\s/g, '');
      
      // Try WhatsApp app first
      let url = `whatsapp://send?phone=${phoneNumber}`;
      let supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, { type: 'whatsapp', detail: 'Opened WhatsApp', date: new Date().toISOString() });
        return;
      }
      
      // Try WhatsApp Web
      url = `https://wa.me/${phoneNumber}`;
      supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, { type: 'whatsapp', detail: 'Opened WhatsApp Web', date: new Date().toISOString() });
        return;
      }
      
      Alert.alert('WhatsApp Not Found', 'WhatsApp is not installed on this device.');
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp.');
    }
  };

  const handleVideoCall = async () => {
    if (!contact || !primaryPhone) {
      Alert.alert('No Phone Number', 'This contact doesn\'t have a phone number.');
      return;
    }
    
    try {
      const phoneNumber = primaryPhone.number.replace(/\s/g, '');
      
      // Try Google Meet
      let url = `https://meet.google.com/`;
      let supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, { type: 'video_call', detail: 'Opened Google Meet', date: new Date().toISOString() });
        return;
      }
      
      // Try Zoom
      url = `https://zoom.us/`;
      supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, { type: 'video_call', detail: 'Opened Zoom', date: new Date().toISOString() });
        return;
      }
      
      // Try FaceTime (iOS)
      url = `facetime:${phoneNumber}`;
      supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, { type: 'video_call', detail: 'Opened FaceTime', date: new Date().toISOString() });
        return;
      }
      
      Alert.alert('No Video App', 'No video calling app found. Please install Google Meet, Zoom, or FaceTime.');
    } catch (error) {
      Alert.alert('Error', 'Failed to open video calling app.');
    }
  };

  const handleWebsite = async () => {
    if (!contact || !contact.website) {
      Alert.alert('No Website', 'This contact doesn\'t have a website.');
      return;
    }
    
    try {
      let url = contact.website;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, { type: 'website', detail: 'Visited website', date: new Date().toISOString() });
      } else {
        Alert.alert('Error', 'Cannot open website on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open website.');
    }
  };

  const handleMap = async () => {
    if (!contact || !contact.address) {
      Alert.alert('No Address', 'This contact doesn\'t have an address.');
      return;
    }
    
    try {
      const address = encodeURIComponent(contact.address);
      const url = `https://maps.google.com/?q=${address}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, { type: 'map', detail: 'Viewed location', date: new Date().toISOString() });
      } else {
        Alert.alert('Error', 'Cannot open maps app on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open maps app.');
    }
  };

  if (isLoading) {
    return (
      <Container style={{ backgroundColor: theme.colors.background }}>
        <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <IconButton icon="arrow-left" onPress={() => router.back()} accessibilityLabel="Go back" />
        </View>
        <DetailsSection style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </DetailsSection>
      </Container>
    );
  }

  if (!id) {
    return (
      <Container style={{ backgroundColor: theme.colors.background }}>
        <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <IconButton icon="arrow-left" onPress={() => router.back()} accessibilityLabel="Go back" />
        </View>
        <DetailsSection style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No contact ID provided.</Text>
        </DetailsSection>
      </Container>
    );
  }

  if (!contact) {
    return (
      <Container style={{ backgroundColor: theme.colors.background }}>
        <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <IconButton icon="arrow-left" onPress={() => router.back()} accessibilityLabel="Go back" />
        </View>
        <DetailsSection style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Contact not found.</Text>
        </DetailsSection>
      </Container>
    );
  }

  // Keep notesDraft in sync if contact changes
  useEffect(() => {
    setNotesDraft(contact.notes || '');
  }, [contact.notes]);

  const primaryPhone = contact.phoneNumbers?.find(p => p.isPrimary) || contact.phoneNumbers?.[0];
  const primaryEmail = contact.emailAddresses?.find(e => e.isPrimary) || contact.emailAddresses?.[0];

  // Generate timeline events from contact history
  const timelineEvents = contact?.history?.map((event, index) => ({
    id: `event-${index}`,
    type: event.type as any,
    title: event.detail,
    description: event.detail,
    timestamp: event.date,
    tags: [contact.group, contact.businessType].filter(Boolean)
  })) || [];

  const renderContactHeader = () => {
    const initials = getInitials(contact.name);
    const avatarColor = getAvatarColor(contact, theme);

    return (
      <Animated.View entering={FadeInUp.delay(100)}>
        <CenteredCard>
          <Card.Content>
            {contact.imageUri ? (
              <Avatar.Image 
                size={100} 
                source={{ uri: contact.imageUri }}
                style={{ 
                  alignSelf: 'center',
                  marginBottom: 16,
                  elevation: 4,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 8
                }}
              />
            ) : (
              <ContactAvatar>
                <Avatar.Text 
                  size={100} 
                  label={initials}
                  color="white"
                  style={{ 
                    backgroundColor: avatarColor,
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 8
                  }}
                />
              </ContactAvatar>
            )}
            
            <ContactName>{contact.name}</ContactName>
            {contact.company && (
              <ContactSubtitle>{contact.company}</ContactSubtitle>
            )}
            {contact.jobTitle && (
              <ContactSubtitle>{contact.jobTitle}</ContactSubtitle>
            )}
            
            <BadgeContainer>
              {contact.isFavorite && (
                <StyledBadge size={24} style={{ backgroundColor: '#ff6b35' }}>
                  ⭐
                </StyledBadge>
              )}
              {contact.isEmergencyContact && (
                <StyledBadge size={24} style={{ backgroundColor: '#ff6b6b' }}>
                  🚨
                </StyledBadge>
              )}
              {contact.group && (
                <StyledBadge size={24} style={{ backgroundColor: '#4ecdc4' }}>
                  {contact.group}
                </StyledBadge>
              )}
            </BadgeContainer>
          </Card.Content>
        </CenteredCard>
      </Animated.View>
    );
  };

  const [showTimeline, setShowTimeline] = useState(false);

  return (
    <Container style={{ backgroundColor: theme.colors.background }}>
      {/* Navigation Header */}
      <View style={{ 
        height: 100, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 40,
        backgroundColor: 'white',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        zIndex: 1000,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0
      }}>
        <IconButton 
          icon="arrow-left" 
          onPress={() => router.back()} 
          accessibilityLabel="Go back"
          iconColor="#1a1a1a"
        />
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '700', 
          color: '#1a1a1a',
          flex: 1,
          textAlign: 'center',
          marginRight: 48
        }}>
          Contact Details
        </Text>
        <IconButton 
          icon="dots-vertical" 
          onPress={() => {}} 
          accessibilityLabel="More options"
          iconColor="#1a1a1a"
        />
      </View>

      <GradientBackground
        colors={[theme.colors.primaryContainer, theme.colors.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48, paddingTop: 50 }}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: 80 }}
      >
        <TopSection>
          {renderContactHeader()}
        </TopSection>

        <DetailsSection>
          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <SectionCard>
              <Card.Content>
                <SectionHeader>Quick Actions</SectionHeader>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <QuickActionButton
                    mode="contained"
                    icon="phone"
                    onPress={handleCall}
                    disabled={!primaryPhone}
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    Call
                  </QuickActionButton>
                  <QuickActionButton
                    mode="contained"
                    icon="message"
                    onPress={handleMessage}
                    disabled={!primaryPhone}
                    style={{ backgroundColor: theme.colors.secondary }}
                  >
                    SMS
                  </QuickActionButton>
                  <QuickActionButton
                    mode="contained"
                    icon="chat"
                    onPress={handleWhatsApp}
                    disabled={!primaryPhone}
                    style={{ backgroundColor: '#25D366' }}
                  >
                    WhatsApp
                  </QuickActionButton>
                  <QuickActionButton
                    mode="contained"
                    icon="video"
                    onPress={handleVideoCall}
                    disabled={!primaryPhone}
                    style={{ backgroundColor: '#ff6b35' }}
                  >
                    Video
                  </QuickActionButton>
                  <QuickActionButton
                    mode="contained"
                    icon="email"
                    onPress={handleEmail}
                    disabled={!primaryEmail}
                    style={{ backgroundColor: theme.colors.tertiary }}
                  >
                    Email
                  </QuickActionButton>
                </View>
              </Card.Content>
            </SectionCard>
          </Animated.View>

          {/* Contact Information */}
          <Animated.View entering={FadeInUp.delay(300)}>
            <SectionCard>
              <Card.Content>
                <SectionHeader>Contact Information</SectionHeader>
                
                {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                  <>
                    <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 8, marginLeft: 8 }}>
                      Phone Numbers
                    </Text>
                    {contact.phoneNumbers.map((phone, index) => (
                      <Row key={phone.id || index}>
                        <IconButton icon="phone" size={20} iconColor={theme.colors.primary} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: '500' }}>{phone.number}</Text>
                          <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                            {phone.type} {phone.isPrimary && '(Primary)'}
                          </Text>
                        </View>
                        <IconButton
                          icon="phone"
                          size={20}
                          onPress={() => {
                            addHistoryEvent?.(contact.id, { type: 'call', detail: 'Called contact', date: new Date().toISOString() });
                            // Handle call action
                          }}
                        />
                      </Row>
                    ))}
                  </>
                )}

                {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                  <>
                    <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 8, marginLeft: 8, marginTop: 16 }}>
                      Email Addresses
                    </Text>
                    {contact.emailAddresses.map((email, index) => (
                      <Row key={email.id || index}>
                        <IconButton icon="email" size={20} iconColor={theme.colors.secondary} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: '500' }}>{email.email}</Text>
                          <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                            {email.type} {email.isPrimary && '(Primary)'}
                          </Text>
                        </View>
                        <IconButton
                          icon="email"
                          size={20}
                          onPress={() => {
                            addHistoryEvent?.(contact.id, { type: 'email', detail: 'Sent email', date: new Date().toISOString() });
                            // Handle email action
                          }}
                        />
                      </Row>
                    ))}
                  </>
                )}

                {contact.website && (
                  <Row>
                    <IconButton icon="web" size={20} iconColor={theme.colors.tertiary} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.website}</Text>
                      <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>Website</Text>
                    </View>
                    <IconButton
                      icon="open-in-new"
                      size={20}
                      onPress={handleWebsite}
                    />
                  </Row>
                )}

                {contact.address && (
                  <Row>
                    <IconButton icon="map-marker" size={20} iconColor={theme.colors.error} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.address}</Text>
                      <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>Address</Text>
                    </View>
                    <IconButton
                      icon="map"
                      size={20}
                      onPress={handleMap}
                    />
                  </Row>
                )}
              </Card.Content>
            </SectionCard>
          </Animated.View>

          {/* Additional Information */}
          {(contact.birthday || contact.anniversary || contact.socialMedia || contact.businessType) && (
            <Animated.View entering={FadeInUp.delay(400)}>
              <SectionCard>
                <Card.Content>
                  <SectionHeader>Additional Information</SectionHeader>
                  
                  {contact.birthday && (
                    <Row>
                      <IconButton icon="cake-variant" size={20} iconColor={theme.colors.primary} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.birthday}</Text>
                        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>Birthday</Text>
                      </View>
                    </Row>
                  )}

                  {contact.anniversary && (
                    <Row>
                      <IconButton icon="heart" size={20} iconColor={theme.colors.secondary} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.anniversary}</Text>
                        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>Anniversary</Text>
                      </View>
                    </Row>
                  )}

                  {contact.socialMedia && (
                    <Row>
                      <IconButton icon="share-variant" size={20} iconColor={theme.colors.tertiary} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.socialMedia}</Text>
                        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>Social Media</Text>
                      </View>
                    </Row>
                  )}

                  {contact.businessType && (
                    <Row>
                      <IconButton icon="store" size={20} iconColor={theme.colors.error} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.businessType}</Text>
                        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>Business Type</Text>
                      </View>
                    </Row>
                  )}
                </Card.Content>
              </SectionCard>
            </Animated.View>
          )}

          {/* Notes */}
          <Animated.View entering={FadeInUp.delay(500)}>
            <SectionCard>
              <Card.Content>
                <SectionHeader>Notes</SectionHeader>
                <View style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 14, lineHeight: 20 }}>
                    {contact.notes || 'No notes added yet.'}
                  </Text>
                </View>
                <ActionRow>
                  <Button
                    mode="outlined"
                    onPress={() => setNotesDialogVisible(true)}
                    icon="pencil"
                  >
                    Edit Notes
                  </Button>
                </ActionRow>
              </Card.Content>
            </SectionCard>
          </Animated.View>

          {/* Timeline */}
          <Animated.View entering={FadeInUp.delay(600)}>
            <SectionCard>
              <Card.Content>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: 16 
                }}>
                  <SectionHeader>Interaction History</SectionHeader>
                  <Button
                    mode="text"
                    onPress={() => setShowTimeline(!showTimeline)}
                    icon={showTimeline ? "chevron-up" : "chevron-down"}
                  >
                    {showTimeline ? 'Hide' : 'Show'}
                  </Button>
                </View>
                
                {showTimeline && (
                  <ContactTimeline
                    contactId={contact.id}
                    events={timelineEvents}
                    contactName={contact.name}
                    contactImage={contact.imageUri}
                  />
                )}
                
                {!showTimeline && timelineEvents.length > 0 && (
                  <View style={{ 
                    backgroundColor: theme.colors.surfaceVariant, 
                    borderRadius: 8, 
                    padding: 12 
                  }}>
                    <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>
                      {timelineEvents.length} interaction{timelineEvents.length !== 1 ? 's' : ''} recorded
                    </Text>
                  </View>
                )}
              </Card.Content>
            </SectionCard>
          </Animated.View>
        </DetailsSection>
      </ScrollView>

      {/* FAB */}
      <Animated.View style={{ position: 'absolute', bottom: 16, right: 16, transform: [{ scale: fabScale }] }}>
        <FAB
          icon="pencil"
          onPress={handleFabPress}
          style={{ backgroundColor: theme.colors.primary }}
        />
      </Animated.View>

      {/* Notes Dialog */}
      <Portal>
        <Dialog visible={notesDialogVisible} onDismiss={() => setNotesDialogVisible(false)}>
          <Dialog.Title>Edit Notes</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Notes"
              value={notesDraft}
              onChangeText={setNotesDraft}
              mode="outlined"
              multiline
              numberOfLines={4}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNotesDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={() => {
                if (editContact) {
                  editContact(contact.id, { notes: notesDraft });
                }
                setNotesDialogVisible(false);
              }}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Image Preview Modal */}
      <Portal>
        <Modal
          visible={imageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center' }}>
            <Image
              source={{ uri: contact.imageUri }}
              style={{ width: width * 0.8, height: width * 0.8, borderRadius: 16 }}
              resizeMode="cover"
            />
            <View style={{ flexDirection: 'row', marginTop: 24 }}>
              <Button
                mode="contained"
                onPress={handleRemoveImage}
                icon="delete"
                style={{ marginRight: 12 }}
              >
                Remove
              </Button>
              <Button
                mode="outlined"
                onPress={() => setImageModalVisible(false)}
              >
                Close
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </Container>
  );
} 