import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, ScrollView, View } from 'react-native';
import { Button, Card, Chip, IconButton, Snackbar, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import styled from 'styled-components/native';
import { EmailAddress, PhoneNumber, useContacts } from '../../context/ContactsContext';
import {
  avatarSizes,
  borderRadius,
  buttonDimensions,
  cardDimensions,
  chipDimensions,
  fabDimensions,
  fontSizes,
  headerHeights,
  inputDimensions,
  progressBarDimensions,
  spacing
} from '../../utils/responsive';

const { width } = Dimensions.get('window');

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`;

const HeaderGradient = styled(LinearGradient)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${headerHeights.medium}px;
  z-index: -1;
`;

const FormScroll = styled(ScrollView)`
  flex: 1;
  padding: ${spacing.md}px;
`;

const SectionCard = styled(Card)`
  margin-bottom: ${spacing.md}px;
  border-radius: ${cardDimensions.borderRadius}px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const SectionHeader = styled(Text)`
  font-size: ${fontSizes.xxl}px;
  font-weight: 700;
  margin-bottom: ${spacing.lg}px;
  color: #1a1a1a;
  letter-spacing: 0.3px;
`;

const StyledTextInput = styled(TextInput)`
  margin-bottom: ${spacing.md}px;
  background-color: #fafafa;
  border-radius: ${inputDimensions.borderRadius}px;
`;

const ItemRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: ${spacing.md}px;
  padding: ${spacing.md}px;
  background-color: #f8f9fa;
  border-radius: ${borderRadius.lg}px;
`;

const AddButton = styled(Button)`
  margin-top: ${spacing.md}px;
  border-radius: ${buttonDimensions.borderRadius}px;
  background-color: #f0f0f0;
`;

const SwitchRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.md}px 0;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

const SwitchLabel = styled(Text)`
  font-size: ${fontSizes.lg}px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.2px;
`;

const ChipContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${spacing.sm}px;
  margin-top: ${spacing.md}px;
`;

const StyledChip = styled(Chip)`
  margin-bottom: ${spacing.sm}px;
  background-color: #f0f0f0;
  border-radius: ${chipDimensions.borderRadius}px;
`;

const SelectedChip = styled(Chip)`
  margin-bottom: ${spacing.sm}px;
  background-color: #007AFF;
  border-radius: ${chipDimensions.borderRadius}px;
`;

const PhotoSection = styled.View`
  align-items: center;
  margin-bottom: ${spacing.lg}px;
  padding: ${spacing.lg}px;
`;

const AvatarContainer = styled.View`
  position: relative;
  margin-bottom: ${spacing.md}px;
`;

const ContactAvatar = styled.View`
  width: ${avatarSizes.xlarge}px;
  height: ${avatarSizes.xlarge}px;
  border-radius: ${avatarSizes.xlarge / 2}px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
  border-width: 2px;
  border-color: #007AFF;
`;

const AvatarImage = styled.Image`
  width: ${avatarSizes.xlarge}px;
  height: ${avatarSizes.xlarge}px;
  border-radius: ${avatarSizes.xlarge / 2}px;
  border-width: 2px;
  border-color: #007AFF;
`;

const AvatarText = styled(Text)`
  font-size: ${fontSizes.display}px;
  font-weight: 700;
  color: #007AFF;
`;

const PhotoActions = styled.View`
  flex-direction: row;
  gap: ${spacing.sm}px;
`;

const PhotoButton = styled(Button)`
  border-radius: ${borderRadius.round}px;
`;

const ProgressCard = styled.View`
  background-color: white;
  border-radius: ${cardDimensions.borderRadius}px;
  padding: ${spacing.lg}px;
  margin-bottom: ${spacing.md}px;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const ProgressBar = styled.View`
  height: ${progressBarDimensions.height}px;
  background-color: #f0f0f0;
  border-radius: ${progressBarDimensions.borderRadius}px;
  overflow: hidden;
  margin-top: ${spacing.sm}px;
`;

const ProgressFill = styled.View<{ width: number; color: string }>`
  height: 100%;
  background-color: ${(props: { width: number; color: string }) => props.color};
  width: ${(props: { width: number; color: string }) => props.width}%;
  border-radius: ${progressBarDimensions.borderRadius}px;
`;

const FloatingSaveButton = styled.View`
  position: absolute;
  bottom: ${fabDimensions.position.bottom}px;
  right: ${fabDimensions.position.right}px;
  left: ${fabDimensions.position.right}px;
`;

const AnimatedCard = Animated.createAnimatedComponent(SectionCard);

export default function AddContactScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { addContact, isLoading } = useContacts() || { addContact: () => console.warn('Context not available'), isLoading: false };
  
  // Basic Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [contactPhoto, setContactPhoto] = useState<string | null>(null);
  
  // Contact Information
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([
    { id: '1', number: '', type: 'mobile', isPrimary: true }
  ]);
  const [emailAddresses, setEmailAddresses] = useState<EmailAddress[]>([
    { id: '1', email: '', type: 'personal', isPrimary: true }
  ]);
  
  // Additional Information
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [socialMedia, setSocialMedia] = useState('');
  const [website, setWebsite] = useState('');
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [notes, setNotes] = useState('');
  
  // Organization
  const [group, setGroup] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  
  // Settings
  const [isEmergencyContact, setIsEmergencyContact] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  
  // UI State
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [isSaving, setIsSaving] = useState(false);

  const commonGroups = ['Family', 'Work', 'Friends', 'Client', 'Vendor', 'Emergency'];
  const commonLabels = ['VIP', 'Important', 'Client', 'Family', 'Friend', 'Work', 'Emergency', 'Favorite'];

  // Check if form has required fields
  const hasRequiredFields = firstName.trim() || lastName.trim();
  const canSave = hasRequiredFields && !isSaving;

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

  const handleAddContact = async () => {
    if (!hasRequiredFields) {
      setSnackbar({ visible: true, message: 'Please enter at least a first name or last name' });
      return;
    }

    setIsSaving(true);

    try {
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

      setSnackbar({ visible: true, message: 'Contact saved successfully! 🎉' });
      
      // Wait a moment to show success message before navigating back
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (error) {
      console.error('Error adding contact:', error);
      setSnackbar({ visible: true, message: 'Failed to save contact. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container>
      <HeaderGradient
        colors={['#007AFF', '#5AC8FA', '#34C759']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingTop: 50, 
        paddingHorizontal: 16, 
        paddingBottom: 16,
        backgroundColor: 'transparent'
      }}>
        <IconButton
          icon="arrow-left"
          iconColor="black"
          size={24}
          onPress={() => router.back()}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        />
        <Text style={{ 
          flex: 1, 
          color: 'black', 
          fontSize: 20, 
          fontWeight: '700', 
          marginLeft: 12,
          letterSpacing: 0.3
        }}>
          Add New Contact
        </Text>
        <IconButton
          icon={isSaving ? "loading" : "check"}
          iconColor="black"
          size={24}
          onPress={handleAddContact}
          disabled={!canSave || isSaving}
          style={{ 
            backgroundColor: canSave ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            opacity: canSave ? 1 : 0.5
          }}
        />
      </View>

      
      <FormScroll showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <Animated.View entering={FadeInUp.delay(25).springify()}>
          <ProgressCard>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                Form Progress
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {Math.round((hasRequiredFields ? 1 : 0) * 100)}% Complete
              </Text>
            </View>
            <ProgressBar>
              <ProgressFill 
                width={(hasRequiredFields ? 1 : 0) * 100} 
                color={hasRequiredFields ? '#4CAF50' : '#ccc'} 
              />
            </ProgressBar>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              {hasRequiredFields ? 'Ready to save!' : 'Add at least a first or last name'}
            </Text>
          </ProgressCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(50).springify()}>
          <SectionCard>
            <Card.Content style={{ padding: 20 }}>
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
                    size={20}
                    iconColor="white"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#007AFF',
                    }}
                    onPress={takePhoto}
                  />
                </AvatarContainer>
                
                <PhotoActions>
                  <PhotoButton
                    mode="outlined"
                    onPress={pickImage}
                    icon="image"
                    style={{ borderColor: '#007AFF' }}
                    labelStyle={{ color: '#007AFF' }}
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
            <Card.Content style={{ padding: 20 }}>
              <SectionHeader>👤 Basic Information</SectionHeader>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <StyledTextInput
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    mode="outlined"
                    left={<TextInput.Icon icon="account" />}
                    outlineColor="#e0e0e0"
                    activeOutlineColor="#007AFF"
                    style={{ 
                      borderColor: !firstName.trim() ? '#ff6b6b' : undefined,
                      borderWidth: !firstName.trim() ? 2 : undefined
                    }}
                  />
                  {!firstName.trim() && (
                    <Text style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4, marginLeft: 8 }}>
                      First name is recommended
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <StyledTextInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    mode="outlined"
                    left={<TextInput.Icon icon="account" />}
                    outlineColor="#e0e0e0"
                    activeOutlineColor="#007AFF"
                    style={{ 
                      borderColor: !lastName.trim() ? '#ff6b6b' : undefined,
                      borderWidth: !lastName.trim() ? 2 : undefined
                    }}
                  />
                  {!lastName.trim() && (
                    <Text style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4, marginLeft: 8 }}>
                      Last name is recommended
                    </Text>
                  )}
                </View>
              </View>

              <StyledTextInput
                label="Company"
                value={company}
                onChangeText={setCompany}
                mode="outlined"
                left={<TextInput.Icon icon="domain" />}
                outlineColor="#e0e0e0"
                activeOutlineColor="#007AFF"
              />

              <StyledTextInput
                label="Job Title"
                value={jobTitle}
                onChangeText={setJobTitle}
                mode="outlined"
                left={<TextInput.Icon icon="briefcase" />}
                outlineColor="#e0e0e0"
                activeOutlineColor="#007AFF"
              />

              <StyledTextInput
                label="Website"
                value={website}
                onChangeText={setWebsite}
                mode="outlined"
                left={<TextInput.Icon icon="web" />}
                keyboardType="url"
                outlineColor="#e0e0e0"
                activeOutlineColor="#007AFF"
              />
            </Card.Content>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <SectionCard>
            <Card.Content style={{ padding: 20 }}>
              <SectionHeader>📞 Phone Numbers</SectionHeader>
              
              {phoneNumbers.length === 0 && (
                <View style={{ 
                  padding: 20, 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: 12, 
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                    No phone numbers added yet
                  </Text>
                  <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4 }}>
                    Tap &quot;Add Phone Number&quot; to get started
                  </Text>
                </View>
              )}
              
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
                      activeOutlineColor="#007AFF"
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        label="Type"
                        value={phone.type}
                        onChangeText={(value) => updatePhoneNumber(phone.id, 'type', value)}
                        mode="outlined"
                        style={{ flex: 1, backgroundColor: 'white' }}
                        outlineColor="#e0e0e0"
                        activeOutlineColor="#007AFF"
                      />
                      <Button
                        mode={phone.isPrimary ? "contained" : "outlined"}
                        onPress={() => setPrimaryPhone(phone.id)}
                        style={{ 
                          alignSelf: 'flex-end',
                          backgroundColor: phone.isPrimary ? '#007AFF' : 'transparent',
                          borderColor: '#007AFF'
                        }}
                        labelStyle={{ color: phone.isPrimary ? 'white' : '#007AFF' }}
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
                style={{ borderColor: '#007AFF' }}
                labelStyle={{ color: '#007AFF' }}
              >
                Add Phone Number
              </AddButton>
            </Card.Content>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <SectionCard>
            <Card.Content style={{ padding: 20 }}>
              <SectionHeader>📧 Email Addresses</SectionHeader>
              
              {emailAddresses.length === 0 && (
                <View style={{ 
                  padding: 20, 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: 12, 
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                    No email addresses added yet
                  </Text>
                  <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4 }}>
                    Tap &quot;Add Email Address&quot; to get started
                  </Text>
                </View>
              )}
              
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
                      activeOutlineColor="#007AFF"
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        label="Type"
                        value={email.type}
                        onChangeText={(value) => updateEmailAddress(email.id, 'type', value)}
                        mode="outlined"
                        style={{ flex: 1, backgroundColor: 'white' }}
                        outlineColor="#e0e0e0"
                        activeOutlineColor="#007AFF"
                      />
                      <Button
                        mode={email.isPrimary ? "contained" : "outlined"}
                        onPress={() => setPrimaryEmail(email.id)}
                        style={{ 
                          alignSelf: 'flex-end',
                          backgroundColor: email.isPrimary ? '#007AFF' : 'transparent',
                          borderColor: '#007AFF'
                        }}
                        labelStyle={{ color: email.isPrimary ? 'white' : '#007AFF' }}
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
                style={{ borderColor: '#007AFF' }}
                labelStyle={{ color: '#007AFF' }}
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
                activeOutlineColor="#007AFF"
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
                activeOutlineColor="#007AFF"
              />

              <StyledTextInput
                label="Social Media"
                value={socialMedia}
                onChangeText={setSocialMedia}
                mode="outlined"
                left={<TextInput.Icon icon="share-variant" />}
                outlineColor="#e0e0e0"
                activeOutlineColor="#007AFF"
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
                  activeOutlineColor="#007AFF"
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
                  activeOutlineColor="#007AFF"
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
                activeOutlineColor="#007AFF"
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
                activeOutlineColor="#007AFF"
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
                      backgroundColor: group === g ? '#007AFF' : '#f0f0f0'
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
                      backgroundColor: labels.includes(label) ? '#007AFF' : '#f0f0f0'
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
                  color="#007AFF"
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

      {/* Floating Save Button */}
      <FloatingSaveButton>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 4,
        }}>
          <Button
            mode="contained"
            onPress={handleAddContact}
            disabled={!canSave || isSaving}
            loading={isSaving}
            icon="content-save"
            style={{
              borderRadius: 12,
              paddingVertical: 8,
              backgroundColor: canSave ? '#007AFF' : '#ccc',
            }}
            labelStyle={{
              fontSize: 16,
              fontWeight: '600',
              color: 'white',
            }}
          >
            {isSaving ? 'Saving...' : 'Save Contact'}
          </Button>
        </View>
      </FloatingSaveButton>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
        style={{ 
          backgroundColor: snackbar.message.includes('successfully') ? '#4CAF50' : '#ff6b6b', 
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