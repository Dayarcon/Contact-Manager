import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, ScrollView, View, useWindowDimensions } from 'react-native';
import { Avatar, Button, Card, Chip, Dialog, FAB, IconButton, Menu, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import styled from 'styled-components/native';
import ContactTimeline from '../components/ContactTimeline';
import QuickActions from '../components/QuickActions';
import { useContacts } from '../context/ContactsContext';
import {
  borderRadius
} from '../utils/responsive';

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
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const searchParams = useLocalSearchParams();
  const context = useContacts();
  
  // State for editing notes
  const [notesDialogVisible, setNotesDialogVisible] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  
  // Menu state
  const [menuVisible, setMenuVisible] = useState(false);
  
  // State for image preview modal
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  // Timeline state
  const [showTimeline, setShowTimeline] = useState(false);
  
  // Fallback theme if needed
  const safeTheme = theme || {
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
  const safeContext = context || {
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
  const { id } = searchParams;
  const { contacts, isLoading, deleteContact, toggleFavorite, addHistoryEvent, editContact } = safeContext;
  
  const contact = contacts?.find(c => c.id === id);
  
  // Initialize notesDraft when contact changes
  useEffect(() => {
    setNotesDraft(contact?.notes || '');
  }, [contact?.notes]);
  
  // Menu position state
  const [menuPosition, setMenuPosition] = useState({ anchorX: 0, anchorY: 0 });
  
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

  // Remove image logic
  const handleRemoveImage = () => {
    if (contact) {
      editContact(contact.id, { imageUri: undefined });
      setImageModalVisible(false);
    }
  };

  // Action handling functions
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
        addHistoryEvent?.(contact.id, {
          id: Date.now().toString(),
          type: 'sms',
          note: 'Opened WhatsApp',
          timestamp: new Date().toISOString(),
          source: 'manual'
        });
        return;
      }
      
      // Try WhatsApp Web
      url = `https://wa.me/${phoneNumber}`;
      supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, {
          id: Date.now().toString(),
          type: 'sms',
          note: 'Opened WhatsApp',
          timestamp: new Date().toISOString(),
          source: 'manual'
        });
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
        addHistoryEvent?.(contact.id, {
          id: Date.now().toString(),
          type: 'video_call',
          note: 'Opened Google Meet',
          timestamp: new Date().toISOString(),
          source: 'manual'
        });
        return;
      }
      
      // Try Zoom
      url = `https://zoom.us/`;
      supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, {
          id: Date.now().toString(),
          type: 'video_call',
          note: 'Opened Zoom',
          timestamp: new Date().toISOString(),
          source: 'manual'
        });
        return;
      }
      
      // Try FaceTime (iOS)
      url = `facetime:${phoneNumber}`;
      supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        addHistoryEvent?.(contact.id, {
          id: Date.now().toString(),
          type: 'video_call',
          note: 'Opened FaceTime',
          timestamp: new Date().toISOString(),
          source: 'manual'
        });
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
        addHistoryEvent?.(contact.id, {
          id: Date.now().toString(),
          type: 'website',
          note: 'Visited website',
          timestamp: new Date().toISOString(),
          source: 'manual'
        });
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
        addHistoryEvent?.(contact.id, {
          id: Date.now().toString(),
          type: 'map',
          note: 'Viewed location',
          timestamp: new Date().toISOString(),
          source: 'manual'
        });
      } else {
        Alert.alert('Error', 'Cannot open maps app on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open maps app.');
    }
  };

  // Contact sharing functionality
  const generateContactText = () => {
    if (!contact) return '';
    
    let contactText = `${contact.name}\n`;
    
    if (contact.company) {
      contactText += `Company: ${contact.company}\n`;
    }
    
    if (contact.jobTitle) {
      contactText += `Job Title: ${contact.jobTitle}\n`;
    }
    
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      contactText += '\nPhone Numbers:\n';
      contact.phoneNumbers.forEach(phone => {
        contactText += `• ${phone.type}: ${phone.number}${phone.isPrimary ? ' (Primary)' : ''}\n`;
      });
    }
    
    if (contact.emailAddresses && contact.emailAddresses.length > 0) {
      contactText += '\nEmail Addresses:\n';
      contact.emailAddresses.forEach(email => {
        contactText += `• ${email.type}: ${email.email}${email.isPrimary ? ' (Primary)' : ''}\n`;
      });
    }
    
    if (contact.address) {
      contactText += `\nAddress: ${contact.address}\n`;
    }
    
    if (contact.website) {
      contactText += `Website: ${contact.website}\n`;
    }
    
    if (contact.socialMedia) {
      contactText += `Social Media: ${contact.socialMedia}\n`;
    }
    
    if (contact.birthday) {
      contactText += `Birthday: ${contact.birthday}\n`;
    }
    
    if (contact.anniversary) {
      contactText += `Anniversary: ${contact.anniversary}\n`;
    }
    
    if (contact.notes) {
      contactText += `\nNotes: ${contact.notes}\n`;
    }
    
    if (contact.group) {
      contactText += `Group: ${contact.group}\n`;
    }
    
    if (contact.labels && contact.labels.length > 0) {
      contactText += `Labels: ${contact.labels.join(', ')}\n`;
    }
    
    return contactText;
  };

  const generateVCard = () => {
    if (!contact) return '';
    
    let vcard = 'BEGIN:VCARD\n';
    vcard += 'VERSION:3.0\n';
    vcard += `FN:${contact.name}\n`;
    
    if (contact.company) {
      vcard += `ORG:${contact.company}\n`;
    }
    
    if (contact.jobTitle) {
      vcard += `TITLE:${contact.jobTitle}\n`;
    }
    
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      contact.phoneNumbers.forEach(phone => {
        vcard += `TEL;TYPE=${phone.type.toUpperCase()}:${phone.number}\n`;
      });
    }
    
    if (contact.emailAddresses && contact.emailAddresses.length > 0) {
      contact.emailAddresses.forEach(email => {
        vcard += `EMAIL;TYPE=${email.type.toUpperCase()}:${email.email}\n`;
      });
    }
    
    if (contact.address) {
      vcard += `ADR:;;${contact.address};;;;\n`;
    }
    
    if (contact.website) {
      vcard += `URL:${contact.website}\n`;
    }
    
    if (contact.notes) {
      vcard += `NOTE:${contact.notes}\n`;
    }
    
    vcard += 'END:VCARD';
    return vcard;
  };

  const handleShareContact = async (format: 'text' | 'vcard') => {
    if (!contact) return;
    
    try {
      let content = '';
      
      if (format === 'text') {
        content = generateContactText();
      } else {
        content = generateVCard();
      }
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // Create a temporary file for sharing
        const fileUri = `${FileSystem.documentDirectory}${contact.name.replace(/\s+/g, '_')}_contact.${format === 'vcard' ? 'vcf' : 'txt'}`;
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8
        });
        
        // Directly open system share sheet
        await Sharing.shareAsync(fileUri, {
          mimeType: format === 'vcard' ? 'text/vcard' : 'text/plain',
          dialogTitle: `Share ${contact.name}'s contact information`
        });
        
        // Clean up the temporary file after sharing
        setTimeout(async () => {
          try {
            await FileSystem.deleteAsync(fileUri);
          } catch (error) {
            console.log('Error cleaning up temporary file:', error);
          }
        }, 1000);
        
      } else {
        // Fallback: copy to clipboard
        await Clipboard.setStringAsync(content);
        Alert.alert(
          'Contact Information Copied',
          `Contact information has been copied to clipboard in ${format.toUpperCase()} format.`,
          [{ text: 'OK' }]
        );
      }
      
      // Add to history
      addHistoryEvent?.(contact.id, {
        id: Date.now().toString(),
        type: 'share',
        note: `Shared contact as ${format.toUpperCase()}`,
        timestamp: new Date().toISOString(),
        source: 'manual'
      });
      
    } catch (error) {
      console.error('Error sharing contact:', error);
      // Fallback to clipboard if sharing fails
      try {
        const content = format === 'text' ? generateContactText() : generateVCard();
        await Clipboard.setStringAsync(content);
        Alert.alert(
          'Sharing Failed - Copied to Clipboard',
          `Unable to share directly, but contact information has been copied to clipboard in ${format.toUpperCase()} format.`,
          [{ text: 'OK' }]
        );
      } catch (clipboardError) {
        Alert.alert(
          'Sharing Failed',
          'Unable to share contact information. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleCopyContactInfo = async () => {
    if (!contact) return;
    
    try {
      const contactText = generateContactText();
      await Clipboard.setStringAsync(contactText);
      
      Alert.alert(
        'Contact Information Copied',
        'Contact information has been copied to clipboard.',
        [{ text: 'OK' }]
      );
      
      // Add to history
      addHistoryEvent?.(contact.id, {
        id: Date.now().toString(),
        type: 'copy',
        note: 'Copied contact information',
        timestamp: new Date().toISOString(),
        source: 'manual'
      });
      
    } catch (error) {
      console.error('Error copying contact:', error);
      Alert.alert(
        'Copy Failed',
        'Unable to copy contact information. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (isLoading) {
    return (
      <Container style={{ backgroundColor: safeTheme.colors.background }}>
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
      <Container style={{ backgroundColor: safeTheme.colors.background }}>
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
      <Container style={{ backgroundColor: safeTheme.colors.background }}>
        <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <IconButton icon="arrow-left" onPress={() => router.back()} accessibilityLabel="Go back" />
        </View>
        <DetailsSection style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Contact not found.</Text>
        </DetailsSection>
      </Container>
    );
  }

  const primaryPhone = contact.phoneNumbers?.find(p => p.isPrimary) || contact.phoneNumbers?.[0];
  const primaryEmail = contact.emailAddresses?.find(e => e.isPrimary) || contact.emailAddresses?.[0];

  // Generate timeline events from contact history
  const timelineEvents = contact?.history?.map((event, index) => ({
    id: event.id,
    type: event.type as any,
    title: event.note || '',
    description: event.note || '',
    timestamp: event.timestamp,
    tags: [contact.group, contact.businessType].filter(Boolean)
  })) || [];

  const renderContactHeader = () => {
    const initials = getInitials(contact.name);
    const avatarColor = getAvatarColor(contact, safeTheme);

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
                onError={(error) => {
                  console.log('Contact details image error for:', contact.name, 'URI:', contact.imageUri, 'Error:', error);
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

  return (
    <Container style={{ backgroundColor: safeTheme.colors.background }}>
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
          onPress={() => setMenuVisible(true)} 
          accessibilityLabel="More options"
          iconColor="#1a1a1a"
        />
      </View>

      {/* Contact Sharing Menu */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{ x: menuPosition.anchorX, y: menuPosition.anchorY }}
        contentStyle={{ borderRadius: borderRadius.md }}
      >
        <Menu.Item
          leadingIcon="share-variant"
          onPress={() => {
            setMenuVisible(false);
            handleShareContact('text');
          }}
          title="Share as Text"
        />
        <Menu.Item
          leadingIcon="card-account-phone"
          onPress={() => {
            setMenuVisible(false);
            handleShareContact('vcard');
          }}
          title="Share as vCard"
        />
        <Menu.Item
          leadingIcon="content-copy"
          onPress={() => {
            setMenuVisible(false);
            handleCopyContactInfo();
          }}
          title="Copy Contact Info"
        />
        <View style={{ height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 16 }} />
        <Menu.Item
          leadingIcon="star"
          onPress={() => {
            setMenuVisible(false);
            toggleFavorite(contact.id);
          }}
          title={contact.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        />
        <Menu.Item
          leadingIcon="pencil"
          onPress={() => {
            setMenuVisible(false);
            router.push({ pathname: '/(tabs)/edit-contact', params: { id: contact.id } });
          }}
          title="Edit Contact"
        />
        <View style={{ height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 16 }} />
        <Menu.Item
          leadingIcon="delete"
          onPress={() => {
            setMenuVisible(false);
            Alert.alert(
              'Delete Contact',
              `Are you sure you want to delete ${contact.name}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    deleteContact(contact.id);
                    router.back();
                  }
                }
              ]
            );
          }}
          title="Delete Contact"
          titleStyle={{ color: '#ff6b6b' }}
        />
      </Menu>

      <GradientBackground
        colors={[safeTheme.colors.primaryContainer, safeTheme.colors.background]}
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
          <Animated.View entering={FadeInUp.delay(200)} style={{ marginBottom: 30 }}>
            <QuickActions 
              contact={contact}
              showUnavailable={true}
              maxActions={6}
              onActionExecuted={(action) => {
                // Add a history event when a quick action is executed
                addHistoryEvent?.(contact.id, {
                  id: Date.now().toString(),
                  type: action.id === 'facetime' ? 'video_call'
                    : action.id === 'phone_call' ? 'call'
                    : action.id === 'sms' ? 'sms'
                    : action.id === 'whatsapp' || action.id === 'telegram' ? 'sms'
                    : action.id === 'email' ? 'email'
                    : 'quick_action',
                  note: `Used quick action: ${action.name}`,
                  timestamp: new Date().toISOString(),
                  source: 'manual'
                });
              }}
            />
          </Animated.View>

          {/* Contact Information */}
          <Animated.View entering={FadeInUp.delay(300)}>
            <SectionCard>
              <Card.Content>
                <SectionHeader>Contact Information</SectionHeader>
                
                {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                  <>
                    <Text style={{ fontSize: 14, color: safeTheme.colors.onSurfaceVariant, marginBottom: 8, marginLeft: 8 }}>
                      Phone Numbers
                    </Text>
                    {contact.phoneNumbers.map((phone, index) => (
                      <Row key={phone.id || index}>
                        <IconButton icon="phone" size={20} iconColor={safeTheme.colors.primary} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: '500' }}>{phone.number}</Text>
                          <Text style={{ fontSize: 12, color: safeTheme.colors.onSurfaceVariant }}>
                            {phone.type} {phone.isPrimary && '(Primary)'}
                          </Text>
                        </View>
                        <IconButton
                          icon="phone"
                          size={20}
                          onPress={() => {
                            addHistoryEvent?.(contact.id, {
                              id: Date.now().toString(),
                              type: 'call',
                              note: `Called ${phone.type} number`,
                              timestamp: new Date().toISOString(),
                              source: 'manual'
                            });
                            if (phone.number) {
                              Linking.openURL(`tel:${phone.number}`);
                            }
                          }}
                        />
                      </Row>
                    ))}
                  </>
                )}

                {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                  <>
                    <Text style={{ fontSize: 14, color: safeTheme.colors.onSurfaceVariant, marginBottom: 8, marginLeft: 8, marginTop: 16 }}>
                      Email Addresses
                    </Text>
                    {contact.emailAddresses.map((email, index) => (
                      <Row key={email.id || index}>
                        <IconButton icon="email" size={20} iconColor={safeTheme.colors.secondary} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: '500' }}>{email.email}</Text>
                          <Text style={{ fontSize: 12, color: safeTheme.colors.onSurfaceVariant }}>
                            {email.type} {email.isPrimary && '(Primary)'}
                          </Text>
                        </View>
                        <IconButton
                          icon="email"
                          size={20}
                          onPress={() => {
                            addHistoryEvent?.(contact.id, {
                              id: Date.now().toString(),
                              type: 'email',
                              note: 'Sent email',
                              timestamp: new Date().toISOString(),
                              source: 'manual'
                            });
                          }}
                        />
                      </Row>
                    ))}
                  </>
                )}

                {contact.website && (
                  <Row>
                    <IconButton icon="web" size={20} iconColor={safeTheme.colors.tertiary} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.website}</Text>
                      <Text style={{ fontSize: 12, color: safeTheme.colors.onSurfaceVariant }}>Website</Text>
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
                    <IconButton icon="map-marker" size={20} iconColor={safeTheme.colors.error} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.address}</Text>
                      <Text style={{ fontSize: 12, color: safeTheme.colors.onSurfaceVariant }}>Address</Text>
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
                      <IconButton icon="cake-variant" size={20} iconColor={safeTheme.colors.primary} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.birthday}</Text>
                        <Text style={{ fontSize: 12, color: safeTheme.colors.onSurfaceVariant }}>Birthday</Text>
                      </View>
                    </Row>
                  )}

                  {contact.anniversary && (
                    <Row>
                      <IconButton icon="heart" size={20} iconColor={safeTheme.colors.secondary} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.anniversary}</Text>
                        <Text style={{ fontSize: 12, color: safeTheme.colors.onSurfaceVariant }}>Anniversary</Text>
                      </View>
                    </Row>
                  )}

                  {contact.socialMedia && (
                    <Row>
                      <IconButton icon="share-variant" size={20} iconColor={safeTheme.colors.tertiary} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.socialMedia}</Text>
                        <Text style={{ fontSize: 12, color: safeTheme.colors.onSurfaceVariant }}>Social Media</Text>
                      </View>
                    </Row>
                  )}

                  {contact.businessType && (
                    <Row>
                      <IconButton icon="store" size={20} iconColor={safeTheme.colors.error} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '500' }}>{contact.businessType}</Text>
                        <Text style={{ fontSize: 12, color: safeTheme.colors.onSurfaceVariant }}>Business Type</Text>
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
                <View style={{ backgroundColor: safeTheme.colors.surfaceVariant, borderRadius: 8, padding: 12 }}>
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
                    backgroundColor: safeTheme.colors.surfaceVariant, 
                    borderRadius: 8, 
                    padding: 12 
                  }}>
                    <Text style={{ fontSize: 14, color: safeTheme.colors.onSurfaceVariant }}>
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
          style={{ backgroundColor: safeTheme.colors.primary }}
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
              style={{ width: windowWidth * 0.8, height: windowWidth * 0.8, borderRadius: 16 }}
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