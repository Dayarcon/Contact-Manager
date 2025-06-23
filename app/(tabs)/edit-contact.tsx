import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Appbar, Button, Card, Chip, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import styled from 'styled-components/native';
import { useContacts } from '../../context/ContactsContext';

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`;

const FormScroll = styled.ScrollView`
  flex-grow: 1;
  padding: 20px;
`;

const SectionCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 16px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 12px;
  background-color: white;
`;

const SectionHeader = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1a1a1a;
`;

const PhotoSection = styled.View`
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
`;

const AvatarContainer = styled.View`
  position: relative;
  margin-bottom: 16px;
`;

const ContactAvatar = styled.View`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  border-width: 2px;
  border-color: #6200ee;
`;

const AvatarImage = styled.Image`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  border-width: 2px;
  border-color: #6200ee;
`;

const AvatarText = styled(Text)`
  font-size: 36px;
  font-weight: 700;
  color: #6200ee;
`;

const PhotoActions = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const PhotoButton = styled(Button)`
  border-radius: 20px;
  elevation: 2;
`;

const GroupRow = styled.ScrollView`
  flex-direction: row;
  margin-bottom: 8px;
`;

const SwitchRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
`;

const SwitchLabel = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
`;

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (contact: any) => {
  const colors = ['#6200ee', '#03dac6', '#ff6b35', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
  const index = contact.name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function EditContactScreen() {
  const router = useRouter();
  const theme = useTheme();

  // Try to access search params with error handling
  let searchParams;
  try {
    searchParams = useLocalSearchParams<{ id: string }>();
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

  const { contacts, isLoading, editContact } = context;

  const contact = contacts?.find(c => c.id === id);
  
  const [firstName, setFirstName] = useState(contact?.firstName || '');
  const [lastName, setLastName] = useState(contact?.lastName || '');
  const [company, setCompany] = useState(contact?.company || '');
  const [jobTitle, setJobTitle] = useState(contact?.jobTitle || '');
  const [businessType, setBusinessType] = useState(contact?.businessType || '');
  const [address, setAddress] = useState(contact?.address || '');
  const [socialMedia, setSocialMedia] = useState(contact?.socialMedia || '');
  const [website, setWebsite] = useState(contact?.website || '');
  const [group, setGroup] = useState(contact?.group || '');
  const [isFavorite, setIsFavorite] = useState(contact?.isFavorite || false);
  const [isEmergencyContact, setIsEmergencyContact] = useState(contact?.isEmergencyContact || false);
  const [notes, setNotes] = useState(contact?.notes || '');
  const [birthday, setBirthday] = useState(contact?.birthday || '');
  const [anniversary, setAnniversary] = useState(contact?.anniversary || '');
  const [imageUri, setImageUri] = useState(contact?.imageUri || '');

  // Phone numbers state
  const [phoneNumbers, setPhoneNumbers] = useState(contact?.phoneNumbers || [
    { id: '1', number: '', type: 'Mobile', isPrimary: true }
  ]);

  // Email addresses state
  const [emailAddresses, setEmailAddresses] = useState(contact?.emailAddresses || [
    { id: '1', email: '', type: 'Personal', isPrimary: true }
  ]);

  const commonGroups = ["Family", "Work", "Client", "Friends", "Emergency"];

  // Image picker logic
  const handlePickImage = async () => {
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
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setImageUri('');
  };

  // Phone number management
  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, { 
      id: Date.now().toString(), 
      number: '', 
      type: 'Mobile', 
      isPrimary: false 
    }]);
  };

  const updatePhoneNumber = (index: number, field: string, value: any) => {
    const updated = [...phoneNumbers];
    updated[index] = { ...updated[index], [field]: value };
    setPhoneNumbers(updated);
  };

  const removePhoneNumber = (index: number) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
    }
  };

  // Email management
  const addEmailAddress = () => {
    setEmailAddresses([...emailAddresses, { 
      id: Date.now().toString(), 
      email: '', 
      type: 'Personal', 
      isPrimary: false 
    }]);
  };

  const updateEmailAddress = (index: number, field: string, value: any) => {
    const updated = [...emailAddresses];
    updated[index] = { ...updated[index], [field]: value };
    setEmailAddresses(updated);
  };

  const removeEmailAddress = (index: number) => {
    if (emailAddresses.length > 1) {
      setEmailAddresses(emailAddresses.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    if (!editContact || !id) {
      console.warn('Edit contact function not available or no ID');
      router.back();
      return;
    }

    const name = `${firstName} ${lastName}`.trim();
    editContact(id, { 
      name,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      company: company.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      businessType,
      address,
      socialMedia,
      website: website.trim() || undefined,
      group,
      isFavorite,
      isEmergencyContact,
      notes,
      birthday,
      anniversary,
      imageUri,
      phoneNumbers: phoneNumbers.map(phone => ({
        ...phone,
        type: phone.type as "mobile" | "work" | "home" | "other"
      })),
      emailAddresses: emailAddresses.map(email => ({
        ...email,
        type: email.type as "work" | "other" | "personal"
      }))
    });
    router.back();
  };

  if (isLoading) {
    return (
      <Container style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Edit Contact" />
        </Appbar.Header>
        <FormScroll contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </FormScroll>
      </Container>
    );
  }

  if (!id) {
    return (
      <Container style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Edit Contact" />
        </Appbar.Header>
        <FormScroll contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
          <Text>No contact ID provided.</Text>
        </FormScroll>
      </Container>
    );
  }

  if (!contact) {
    return (
      <Container style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Edit Contact" />
        </Appbar.Header>
        <FormScroll contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
          <Text>Contact not found.</Text>
        </FormScroll>
      </Container>
    );
  }

  return (
    <Container style={{ backgroundColor: theme.colors.background }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Edit Contact" />
      </Appbar.Header>
      <FormScroll>
        {/* Photo Section */}
        <SectionCard>
          <Card.Content>
            <SectionHeader>Photo</SectionHeader>
            <PhotoSection>
              <AvatarContainer>
                {imageUri ? (
                  <AvatarImage source={{ uri: imageUri }} />
                ) : (
                  <ContactAvatar>
                    <AvatarText>{getInitials(`${firstName} ${lastName}`)}</AvatarText>
                  </ContactAvatar>
                )}
              </AvatarContainer>
              <PhotoActions>
                <PhotoButton mode="outlined" onPress={handlePickImage}>
                  Choose Photo
                </PhotoButton>
                {imageUri && (
                  <PhotoButton mode="outlined" onPress={handleRemoveImage}>
                    Remove
                  </PhotoButton>
                )}
              </PhotoActions>
            </PhotoSection>
          </Card.Content>
        </SectionCard>

        {/* Basic Information */}
        <SectionCard>
          <Card.Content>
            <SectionHeader>Basic Information</SectionHeader>
            <TextInput 
              label="First Name" 
              value={firstName} 
              onChangeText={setFirstName} 
              style={{ marginBottom: 16 }} 
              mode="outlined" 
            />
            <TextInput 
              label="Last Name" 
              value={lastName} 
              onChangeText={setLastName} 
              style={{ marginBottom: 16 }} 
              mode="outlined" 
            />
            <TextInput 
              label="Company" 
              value={company} 
              onChangeText={setCompany} 
              style={{ marginBottom: 16 }} 
              mode="outlined" 
            />
            <TextInput 
              label="Job Title" 
              value={jobTitle} 
              onChangeText={setJobTitle} 
              style={{ marginBottom: 16 }} 
              mode="outlined" 
            />
            <TextInput 
              label="Business Type" 
              value={businessType} 
              onChangeText={setBusinessType} 
              style={{ marginBottom: 16 }} 
              mode="outlined" 
            />
          </Card.Content>
        </SectionCard>

        {/* Phone Numbers */}
        <SectionCard>
          <Card.Content>
            <SectionHeader>Phone Numbers</SectionHeader>
            {phoneNumbers.map((phone, index) => (
              <Card key={phone.id} style={{ marginBottom: 12, backgroundColor: '#f8f9fa' }}>
                <Card.Content>
                  <TextInput
                    label="Phone Number"
                    value={phone.number}
                    onChangeText={(value) => updatePhoneNumber(index, 'number', value)}
                    mode="outlined"
                    keyboardType="phone-pad"
                    style={{ marginBottom: 8 }}
                  />
                  <TextInput
                    label="Type"
                    value={phone.type}
                    onChangeText={(value) => updatePhoneNumber(index, 'type', value)}
                    mode="outlined"
                    style={{ marginBottom: 8 }}
                  />
                  <SwitchRow>
                    <SwitchLabel>Primary</SwitchLabel>
                    <Switch 
                      value={phone.isPrimary} 
                      onValueChange={(value) => updatePhoneNumber(index, 'isPrimary', value)} 
                    />
                  </SwitchRow>
                  {phoneNumbers.length > 1 && (
                    <Button 
                      mode="text" 
                      onPress={() => removePhoneNumber(index)}
                      textColor="#ff6b6b"
                    >
                      Remove
                    </Button>
                  )}
                </Card.Content>
              </Card>
            ))}
            <Button mode="outlined" onPress={addPhoneNumber} style={{ marginTop: 8 }}>
              Add Phone Number
            </Button>
          </Card.Content>
        </SectionCard>

        {/* Email Addresses */}
        <SectionCard>
          <Card.Content>
            <SectionHeader>Email Addresses</SectionHeader>
            {emailAddresses.map((email, index) => (
              <Card key={email.id} style={{ marginBottom: 12, backgroundColor: '#f8f9fa' }}>
                <Card.Content>
                  <TextInput
                    label="Email Address"
                    value={email.email}
                    onChangeText={(value) => updateEmailAddress(index, 'email', value)}
                    mode="outlined"
                    keyboardType="email-address"
                    style={{ marginBottom: 8 }}
                  />
                  <TextInput
                    label="Type"
                    value={email.type}
                    onChangeText={(value) => updateEmailAddress(index, 'type', value)}
                    mode="outlined"
                    style={{ marginBottom: 8 }}
                  />
                  <SwitchRow>
                    <SwitchLabel>Primary</SwitchLabel>
                    <Switch 
                      value={email.isPrimary} 
                      onValueChange={(value) => updateEmailAddress(index, 'isPrimary', value)} 
                    />
                  </SwitchRow>
                  {emailAddresses.length > 1 && (
                    <Button 
                      mode="text" 
                      onPress={() => removeEmailAddress(index)}
                      textColor="#ff6b6b"
                    >
                      Remove
                    </Button>
                  )}
                </Card.Content>
              </Card>
            ))}
            <Button mode="outlined" onPress={addEmailAddress} style={{ marginTop: 8 }}>
              Add Email Address
            </Button>
          </Card.Content>
        </SectionCard>

        {/* Additional Information */}
        <SectionCard>
          <Card.Content>
            <SectionHeader>Additional Information</SectionHeader>
            <TextInput 
              label="Address" 
              value={address} 
              onChangeText={setAddress} 
              style={{ marginBottom: 16 }} 
              mode="outlined" 
              multiline
            />
            <TextInput 
              label="Website" 
              value={website} 
              onChangeText={setWebsite} 
              style={{ marginBottom: 16 }} 
              mode="outlined" 
              keyboardType="url"
            />
            <TextInput 
              label="Social Media" 
              value={socialMedia} 
              onChangeText={setSocialMedia} 
              style={{ marginBottom: 16 }} 
              mode="outlined" 
            />
            <TextInput 
              label="Birthday" 
              value={birthday} 
              onChangeText={setBirthday} 
              style={{ marginBottom: 16 }} 
              mode="outlined" 
              placeholder="MM/DD/YYYY"
            />
            <TextInput 
              label="Anniversary" 
              value={anniversary} 
              onChangeText={setAnniversary} 
              style={{ marginBottom: 16 }} 
              mode="outlined" 
              placeholder="MM/DD/YYYY"
            />
          </Card.Content>
        </SectionCard>

        {/* Group and Settings */}
        <SectionCard>
          <Card.Content>
            <SectionHeader>Group & Settings</SectionHeader>
            <Text style={{ marginBottom: 8 }}>Group</Text>
            <GroupRow horizontal showsHorizontalScrollIndicator={false}>
              {commonGroups.map(g => (
                <Chip
                  key={g}
                  selected={group === g}
                  onPress={() => setGroup(g)}
                  style={{ marginRight: 8, marginBottom: 8 }}
                >
                  {g}
                </Chip>
              ))}
            </GroupRow>
            <TextInput
              label="Custom Group"
              value={group}
              onChangeText={setGroup}
              mode="outlined"
              style={{ marginBottom: 16 }}
            />
            <SwitchRow>
              <SwitchLabel>Favorite Contact</SwitchLabel>
              <Switch value={isFavorite} onValueChange={setIsFavorite} />
            </SwitchRow>
            <SwitchRow>
              <SwitchLabel>Emergency Contact</SwitchLabel>
              <Switch value={isEmergencyContact} onValueChange={setIsEmergencyContact} />
            </SwitchRow>
          </Card.Content>
        </SectionCard>

        {/* Notes */}
        <SectionCard>
          <Card.Content>
            <SectionHeader>Notes</SectionHeader>
            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={{ marginBottom: 16 }}
            />
          </Card.Content>
        </SectionCard>

        <Button mode="contained" onPress={handleSave} style={{ marginTop: 16, marginBottom: 32 }}>
          Save Changes
        </Button>
      </FormScroll>
    </Container>
  );
} 