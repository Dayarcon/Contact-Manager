import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Card, Chip, IconButton, Snackbar, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import styled from 'styled-components/native';
import { EmailAddress, PhoneNumber, useContacts } from '../context/ContactsContext';

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

const FormScroll = styled(ScrollView)`
  flex: 1;
  padding: 20px;
`;

const SectionCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 24px;
  elevation: 6;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 16px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const SectionHeader = styled(Text)`
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 24px;
  color: #1a1a1a;
  letter-spacing: 0.5px;
`;

const StyledTextInput = styled(TextInput)`
  margin-bottom: 20px;
  background-color: white;
  border-radius: 16px;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
`;

const ItemRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 24px;
  background-color: #f8f9fa;
  border-radius: 20px;
  border-left-width: 4px;
  border-left-color: #6200ee;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
`;

const AddButton = styled(Button)`
  margin-top: 20px;
  border-radius: 16px;
  background-color: #f0f0f0;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
`;

const SwitchRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
`;

const SwitchLabel = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.3px;
`;

const ChipContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
`;

const StyledChip = styled(Chip)`
  margin-bottom: 12px;
  background-color: #f0f0f0;
  border-radius: 24px;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 6px;
`;

const SelectedChip = styled(Chip)`
  margin-bottom: 12px;
  background-color: #6200ee;
  border-radius: 24px;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
`;

const ProgressIndicator = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-bottom: 32px;
  padding: 20px;
`;

const ProgressDot = styled.View<{ active: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  margin: 0 8px;
  background-color: ${(props: { active: boolean }) => props.active ? '#6200ee' : '#e0e0e0'};
  elevation: ${(props: { active: boolean }) => props.active ? 3 : 0};
  shadow-color: #000;
  shadow-opacity: ${(props: { active: boolean }) => props.active ? 0.1 : 0};
  shadow-radius: ${(props: { active: boolean }) => props.active ? 4 : 0};
`;

const AnimatedCard = Animated.createAnimatedComponent(SectionCard);

const PhotoSection = styled.View`
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
`;

const AvatarContainer = styled.View`
  position: relative;
  margin-bottom: 20px;
`;

const ContactAvatar = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
  elevation: 6;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  border-width: 3px;
  border-color: #6200ee;
`;

const AvatarImage = styled.Image`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  border-width: 3px;
  border-color: #6200ee;
`;

const AvatarText = styled(Text)`
  font-size: 48px;
  font-weight: 700;
  color: #6200ee;
`;

const PhotoActions = styled.View`
  flex-direction: row;
  gap: 16px;
`;

const PhotoButton = styled(Button)`
  border-radius: 24px;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
`;

export default function AddContactScreen() {
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

  const { addContact, isLoading } = context || {
    addContact: () => console.warn('Context not available'),
    isLoading: true
  };

  // Basic Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [website, setWebsite] = useState('');
  const [contactPhoto, setContactPhoto] = useState<string | null>(null);

  // Phone Numbers
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([
    { id: '1', number: '', type: 'mobile', isPrimary: true }
  ]);

  // Email Addresses
  const [emailAddresses, setEmailAddresses] = useState<EmailAddress[]>([
    { id: '1', email: '', type: 'personal', isPrimary: true }
  ]);

  // Additional Info
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [socialMedia, setSocialMedia] = useState('');
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [group, setGroup] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [isEmergencyContact, setIsEmergencyContact] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const commonGroups = ["Family", "Work", "Client", "Friends", "Emergency"];
  const commonLabels = ["Developer", "Tech", "Legal", "Medical", "Finance", "Education", "Emergency", "VIP"];

  const addPhoneNumber = () => {
    const newId = Date.now().toString();
    setPhoneNumbers(prev => [...prev, { id: newId, number: '', type: 'mobile', isPrimary: false }]);
  };

  const removePhoneNumber = (id: string) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(prev => prev.filter(p => p.id !== id));
    }
  };

  const updatePhoneNumber = (id: string, field: keyof PhoneNumber, value: any) => {
    setPhoneNumbers(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const setPrimaryPhone = (id: string) => {
    setPhoneNumbers(prev => prev.map(p => ({
      ...p,
      isPrimary: p.id === id
    })));
  };

  const addEmailAddress = () => {
    const newId = Date.now().toString();
    setEmailAddresses(prev => [...prev, { id: newId, email: '', type: 'personal', isPrimary: false }]);
  };

  const removeEmailAddress = (id: string) => {
    if (emailAddresses.length > 1) {
      setEmailAddresses(prev => prev.filter(e => e.id !== id));
    }
  };

  const updateEmailAddress = (id: string, field: keyof EmailAddress, value: any) => {
    setEmailAddresses(prev => prev.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const setPrimaryEmail = (id: string) => {
    setEmailAddresses(prev => prev.map(e => ({
      ...e,
      isPrimary: e.id === id
    })));
  };

  const toggleLabel = (label: string) => {
    setLabels(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const getInitials = () => {
    const first = firstName.trim().charAt(0).toUpperCase();
    const last = lastName.trim().charAt(0).toUpperCase();
    return `${first}${last}` || '?';
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to add contact photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setContactPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to take a photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setContactPhoto(result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setContactPhoto(null) }
      ]
    );
  };

  const handleAddContact = () => {
    if (!firstName.trim() && !lastName.trim()) {
      setSnackbar({ visible: true, message: 'Please enter at least a first name or last name' });
      return;
    }

    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    
    addContact({
      name,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      company: company.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      phoneNumbers,
      emailAddresses,
      businessType,
      address,
      socialMedia,
      website: website.trim() || undefined,
      birthday: birthday.trim() || undefined,
      anniversary: anniversary.trim() || undefined,
      group,
      labels: labels.length > 0 ? labels : undefined,
      isEmergencyContact,
      emergencyContact: emergencyContact.trim() || undefined,
      notes,
      imageUri: contactPhoto || undefined
    });

    router.back();
  };

  return (
    <Container>
      <HeaderGradient
        colors={['#6200ee', '#7c4dff', '#9c27b0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingTop: 60, 
        paddingHorizontal: 16, 
        paddingBottom: 20,
        backgroundColor: 'transparent'
      }}>
        <IconButton
          icon="arrow-left"
          iconColor="black"
          size={28}
          onPress={() => router.back()}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        />
        <Text style={{ 
          flex: 1, 
          color: 'black', 
          fontSize: 24, 
          fontWeight: '800', 
          marginLeft: 16,
          letterSpacing: 0.5
        }}>
          Add New Contact
        </Text>
        <IconButton
          icon="check"
          iconColor="white"
          size={28}
          onPress={handleAddContact}
          disabled={isLoading}
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            opacity: isLoading ? 0.5 : 1
          }}
        />
      </View>

      
      <FormScroll showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(50).springify()}>
          <SectionCard>
            <Card.Content style={{ padding: 24 }}>
              <PhotoSection>
                <AvatarContainer>
                  {contactPhoto ? (
                    <AvatarImage source={{ uri: contactPhoto }} />
                  ) : (
                    <ContactAvatar>
                      <AvatarText>{getInitials()}</AvatarText>
                    </ContactAvatar>
                  )}
                  <IconButton
                    icon="camera"
                    size={24}
                    iconColor="white"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#6200ee',
                      elevation: 4,
                    }}
                    onPress={takePhoto}
                  />
                </AvatarContainer>
                
                <PhotoActions>
                  <PhotoButton
                    mode="outlined"
                    onPress={pickImage}
                    icon="image"
                    style={{ borderColor: '#6200ee' }}
                    labelStyle={{ color: '#6200ee' }}
                  >
                    Choose Photo
                  </PhotoButton>
                  
                  {contactPhoto && (
                    <PhotoButton
                      mode="outlined"
                      onPress={removePhoto}
                      icon="delete"
                      style={{ borderColor: '#ff6b6b' }}
                      labelStyle={{ color: '#ff6b6b' }}
                    >
                      Remove
                    </PhotoButton>
                  )}
                </PhotoActions>
              </PhotoSection>
            </Card.Content>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <SectionCard>
            <Card.Content style={{ padding: 24 }}>
              <SectionHeader>👤 Basic Information</SectionHeader>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <StyledTextInput
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  mode="outlined"
                  style={{ flex: 1 }}
                  left={<TextInput.Icon icon="account" />}
                  outlineColor="#e0e0e0"
                  activeOutlineColor="#6200ee"
                />
                <StyledTextInput
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  mode="outlined"
                  style={{ flex: 1 }}
                  left={<TextInput.Icon icon="account" />}
                  outlineColor="#e0e0e0"
                  activeOutlineColor="#6200ee"
                />
              </View>

              <StyledTextInput
                label="Company"
                value={company}
                onChangeText={setCompany}
                mode="outlined"
                left={<TextInput.Icon icon="domain" />}
                outlineColor="#e0e0e0"
                activeOutlineColor="#6200ee"
              />

              <StyledTextInput
                label="Job Title"
                value={jobTitle}
                onChangeText={setJobTitle}
                mode="outlined"
                left={<TextInput.Icon icon="briefcase" />}
                outlineColor="#e0e0e0"
                activeOutlineColor="#6200ee"
              />

              <StyledTextInput
                label="Website"
                value={website}
                onChangeText={setWebsite}
                mode="outlined"
                left={<TextInput.Icon icon="web" />}
                keyboardType="url"
                outlineColor="#e0e0e0"
                activeOutlineColor="#6200ee"
              />
            </Card.Content>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <SectionCard>
            <Card.Content style={{ padding: 24 }}>
              <SectionHeader>📞 Phone Numbers</SectionHeader>
              
              {phoneNumbers.map((phone, index) => (
                <ItemRow key={phone.id}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      label="Phone Number"
                      value={phone.number}
                      onChangeText={(value) => updatePhoneNumber(phone.id, 'number', value)}
                      mode="outlined"
                      keyboardType="phone-pad"
                      left={<TextInput.Icon icon="phone" />}
                      style={{ marginBottom: 12, backgroundColor: 'white' }}
                      outlineColor="#e0e0e0"
                      activeOutlineColor="#6200ee"
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        label="Type"
                        value={phone.type}
                        onChangeText={(value) => updatePhoneNumber(phone.id, 'type', value)}
                        mode="outlined"
                        style={{ flex: 1, backgroundColor: 'white' }}
                        outlineColor="#e0e0e0"
                        activeOutlineColor="#6200ee"
                      />
                      <Button
                        mode={phone.isPrimary ? "contained" : "outlined"}
                        onPress={() => setPrimaryPhone(phone.id)}
                        style={{ 
                          alignSelf: 'flex-end',
                          backgroundColor: phone.isPrimary ? '#6200ee' : 'transparent',
                          borderColor: '#6200ee'
                        }}
                        labelStyle={{ color: phone.isPrimary ? 'white' : '#6200ee' }}
                      >
                        {phone.isPrimary ? "Primary" : "Set Primary"}
                      </Button>
                    </View>
                  </View>
                  {phoneNumbers.length > 1 && (
                    <IconButton
                      icon="delete"
                      onPress={() => removePhoneNumber(phone.id)}
                      iconColor="#ff6b6b"
                      style={{ backgroundColor: '#fff5f5' }}
                    />
                  )}
                </ItemRow>
              ))}
              
              <AddButton
                mode="outlined"
                onPress={addPhoneNumber}
                icon="plus"
                style={{ borderColor: '#6200ee' }}
                labelStyle={{ color: '#6200ee' }}
              >
                Add Phone Number
              </AddButton>
            </Card.Content>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <SectionCard>
            <Card.Content style={{ padding: 24 }}>
              <SectionHeader>📧 Email Addresses</SectionHeader>
              
              {emailAddresses.map((email, index) => (
                <ItemRow key={email.id}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      label="Email Address"
                      value={email.email}
                      onChangeText={(value) => updateEmailAddress(email.id, 'email', value)}
                      mode="outlined"
                      keyboardType="email-address"
                      left={<TextInput.Icon icon="email" />}
                      style={{ marginBottom: 12, backgroundColor: 'white' }}
                      outlineColor="#e0e0e0"
                      activeOutlineColor="#6200ee"
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        label="Type"
                        value={email.type}
                        onChangeText={(value) => updateEmailAddress(email.id, 'type', value)}
                        mode="outlined"
                        style={{ flex: 1, backgroundColor: 'white' }}
                        outlineColor="#e0e0e0"
                        activeOutlineColor="#6200ee"
                      />
                      <Button
                        mode={email.isPrimary ? "contained" : "outlined"}
                        onPress={() => setPrimaryEmail(email.id)}
                        style={{ 
                          alignSelf: 'flex-end',
                          backgroundColor: email.isPrimary ? '#6200ee' : 'transparent',
                          borderColor: '#6200ee'
                        }}
                        labelStyle={{ color: email.isPrimary ? 'white' : '#6200ee' }}
                      >
                        {email.isPrimary ? "Primary" : "Set Primary"}
                      </Button>
                    </View>
                  </View>
                  {emailAddresses.length > 1 && (
                    <IconButton
                      icon="delete"
                      onPress={() => removeEmailAddress(email.id)}
                      iconColor="#ff6b6b"
                      style={{ backgroundColor: '#fff5f5' }}
                    />
                  )}
                </ItemRow>
              ))}
              
              <AddButton
                mode="outlined"
                onPress={addEmailAddress}
                icon="plus"
                style={{ borderColor: '#6200ee' }}
                labelStyle={{ color: '#6200ee' }}
              >
                Add Email Address
              </AddButton>
            </Card.Content>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <SectionCard>
            <Card.Content style={{ padding: 24 }}>
              <SectionHeader>📋 Additional Information</SectionHeader>
              
              <StyledTextInput
                label="Business Type"
                value={businessType}
                onChangeText={setBusinessType}
                mode="outlined"
                left={<TextInput.Icon icon="briefcase" />}
                outlineColor="#e0e0e0"
                activeOutlineColor="#6200ee"
              />

              <StyledTextInput
                label="Address"
                value={address}
                onChangeText={setAddress}
                mode="outlined"
                left={<TextInput.Icon icon="map-marker" />}
                multiline
                numberOfLines={2}
                outlineColor="#e0e0e0"
                activeOutlineColor="#6200ee"
              />

              <StyledTextInput
                label="Social Media"
                value={socialMedia}
                onChangeText={setSocialMedia}
                mode="outlined"
                left={<TextInput.Icon icon="share-variant" />}
                outlineColor="#e0e0e0"
                activeOutlineColor="#6200ee"
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <StyledTextInput
                  label="Birthday"
                  value={birthday}
                  onChangeText={setBirthday}
                  mode="outlined"
                  left={<TextInput.Icon icon="cake" />}
                  placeholder="YYYY-MM-DD"
                  style={{ flex: 1 }}
                  outlineColor="#e0e0e0"
                  activeOutlineColor="#6200ee"
                />
                <StyledTextInput
                  label="Anniversary"
                  value={anniversary}
                  onChangeText={setAnniversary}
                  mode="outlined"
                  left={<TextInput.Icon icon="heart" />}
                  placeholder="YYYY-MM-DD"
                  style={{ flex: 1 }}
                  outlineColor="#e0e0e0"
                  activeOutlineColor="#6200ee"
                />
              </View>

              <StyledTextInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                left={<TextInput.Icon icon="note-text" />}
                multiline
                numberOfLines={3}
                outlineColor="#e0e0e0"
                activeOutlineColor="#6200ee"
              />
            </Card.Content>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).springify()}>
          <SectionCard>
            <Card.Content style={{ padding: 24 }}>
              <SectionHeader>🏷️ Organization</SectionHeader>
              
              <StyledTextInput
                label="Group"
                value={group}
                onChangeText={setGroup}
                mode="outlined"
                left={<TextInput.Icon icon="account-group" />}
                outlineColor="#e0e0e0"
                activeOutlineColor="#6200ee"
              />

              <Text style={{ 
                marginTop: 20, 
                marginBottom: 12, 
                fontWeight: '700', 
                color: '#1a1a1a',
                fontSize: 16
              }}>
                Quick Groups:
              </Text>
              <ChipContainer>
                {commonGroups.map((g) => (
                  <StyledChip
                    key={g}
                    selected={group === g}
                    onPress={() => setGroup(group === g ? '' : g)}
                    textStyle={{ 
                      color: group === g ? 'white' : '#1a1a1a',
                      fontWeight: '600'
                    }}
                    style={{ 
                      backgroundColor: group === g ? '#6200ee' : '#f0f0f0'
                    }}
                  >
                    {g}
                  </StyledChip>
                ))}
              </ChipContainer>

              <Text style={{ 
                marginTop: 20, 
                marginBottom: 12, 
                fontWeight: '700', 
                color: '#1a1a1a',
                fontSize: 16
              }}>
                Labels:
              </Text>
              <ChipContainer>
                {commonLabels.map((label) => (
                  <StyledChip
                    key={label}
                    selected={labels.includes(label)}
                    onPress={() => toggleLabel(label)}
                    textStyle={{ 
                      color: labels.includes(label) ? 'white' : '#1a1a1a',
                      fontWeight: '600'
                    }}
                    style={{ 
                      backgroundColor: labels.includes(label) ? '#6200ee' : '#f0f0f0'
                    }}
                  >
                    {label}
                  </StyledChip>
                ))}
              </ChipContainer>
            </Card.Content>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).springify()}>
          <SectionCard>
            <Card.Content style={{ padding: 24 }}>
              <SectionHeader>⚙️ Settings</SectionHeader>
              
              <SwitchRow>
                <SwitchLabel>🚨 Emergency Contact</SwitchLabel>
                <Switch
                  value={isEmergencyContact}
                  onValueChange={setIsEmergencyContact}
                  color="#6200ee"
                />
              </SwitchRow>
              
              {isEmergencyContact && (
                <Animated.View entering={SlideInRight.delay(200)}>
                  <StyledTextInput
                    label="Emergency Contact Details"
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                    mode="outlined"
                    left={<TextInput.Icon icon="alert" />}
                    multiline
                    numberOfLines={2}
                    style={{ marginTop: 8 }}
                    outlineColor="#e0e0e0"
                    activeOutlineColor="#ff6b6b"
                  />
                </Animated.View>
              )}
            </Card.Content>
          </SectionCard>
        </Animated.View>

        <View style={{ height: 100 }} />
      </FormScroll>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
        style={{ 
          backgroundColor: '#ff6b6b', 
          borderRadius: 12,
          margin: 16
        }}
        action={{
          label: 'OK',
          onPress: () => setSnackbar({ visible: false, message: '' }),
        }}
      >
        {snackbar.message}
      </Snackbar>
    </Container>
  );
} 