import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Avatar, Button, Card, Chip, Divider, IconButton, Snackbar, Text } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import styled from 'styled-components/native';
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

const DuplicateCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 20px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const ContactRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 20px;
`;

const ContactInfo = styled.View`
  flex: 1;
  margin-left: 16px;
`;

const ContactName = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
`;

const ContactSubtitle = styled(Text)`
  font-size: 14px;
  color: #666666;
  margin-bottom: 4px;
  letter-spacing: 0.2px;
`;

const SimilarityBadge = styled(Chip)`
  align-self: flex-start;
  margin-top: 12px;
  border-radius: 16px;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 6px;
`;

const MergeButton = styled(Button)`
  margin: 16px 0;
  border-radius: 16px;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
`;

const EmptyState = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
`;

const EmptyIcon = styled.Text`
  font-size: 80px;
  margin-bottom: 32px;
  opacity: 0.7;
`;

const EmptyTitle = styled(Text)`
  font-size: 24px;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 16px;
  text-align: center;
  letter-spacing: 0.5px;
`;

const EmptySubtitle = styled(Text)`
  font-size: 16px;
  color: #666666;
  text-align: center;
  line-height: 24px;
  letter-spacing: 0.3px;
`;

const ComparisonContainer = styled.View`
  margin: 16px 0;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 16px;
  border: 1px solid #e0e0e0;
`;

const ComparisonArrow = styled.View`
  align-items: center;
  margin: 12px 0;
`;

const ComparisonText = styled(Text)`
  font-size: 20px;
  color: #666666;
  font-weight: 600;
`;

const ReasonText = styled(Text)`
  font-size: 14px;
  color: #666666;
  margin-left: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
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

export default function DuplicatesScreen() {
  const router = useRouter();
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const { findDuplicates, mergeContacts } = useContacts() || {
    findDuplicates: () => [],
    mergeContacts: () => console.warn('Context not available')
  };

  useEffect(() => {
    scanForDuplicates();
  }, []);

  const scanForDuplicates = () => {
    setIsScanning(true);
    try {
      const foundDuplicates = findDuplicates();
      setDuplicates(foundDuplicates);
    } catch (error) {
      console.error('Error scanning for duplicates:', error);
      setSnackbar({ visible: true, message: 'Error scanning for duplicates' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleMerge = (contact1Id: string, contact2Id: string) => {
    Alert.alert(
      'Merge Contacts',
      'Are you sure you want to merge these contacts? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          style: 'destructive',
          onPress: () => {
            try {
              mergeContacts(contact1Id, contact2Id);
              setSnackbar({ visible: true, message: 'Contacts merged successfully!' });
              scanForDuplicates(); // Refresh the list
            } catch (error) {
              console.error('Error merging contacts:', error);
              setSnackbar({ visible: true, message: 'Error merging contacts' });
            }
          }
        }
      ]
    );
  };

  const renderDuplicate = (duplicate: any, index: number) => {
    const { contact1, contact2, similarity, reason } = duplicate;
    
    return (
      <Animated.View key={`${contact1.id}-${contact2.id}`} entering={FadeInUp.delay(index * 100)}>
        <DuplicateCard>
          <Card.Content style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <SimilarityBadge
                style={{ 
                  backgroundColor: similarity >= 80 ? '#ff6b6b' : similarity >= 60 ? '#ffa726' : '#4caf50'
                }}
                textStyle={{ color: 'white', fontWeight: '600' }}
              >
                {similarity}% Match
              </SimilarityBadge>
              <ReasonText>{reason}</ReasonText>
            </View>

            <Divider style={{ marginBottom: 20 }} />

            <ComparisonContainer>
              {/* Contact 1 */}
              <ContactRow>
                {contact1.imageUri ? (
                  <Avatar.Image size={48} source={{ uri: contact1.imageUri }} />
                ) : (
                  <Avatar.Text 
                    size={48} 
                    label={getInitials(contact1.name)}
                    style={{ backgroundColor: getAvatarColor(contact1) }}
                  />
                )}
                <ContactInfo>
                  <ContactName>{contact1.name}</ContactName>
                  {contact1.company && (
                    <ContactSubtitle>{contact1.company}</ContactSubtitle>
                  )}
                  {contact1.phoneNumbers?.[0] && (
                    <ContactSubtitle>{contact1.phoneNumbers[0].number}</ContactSubtitle>
                  )}
                  {contact1.emailAddresses?.[0] && (
                    <ContactSubtitle>{contact1.emailAddresses[0].email}</ContactSubtitle>
                  )}
                </ContactInfo>
              </ContactRow>

              <ComparisonArrow>
                <ComparisonText>↓</ComparisonText>
              </ComparisonArrow>

              {/* Contact 2 */}
              <ContactRow>
                {contact2.imageUri ? (
                  <Avatar.Image size={48} source={{ uri: contact2.imageUri }} />
                ) : (
                  <Avatar.Text 
                    size={48} 
                    label={getInitials(contact2.name)}
                    style={{ backgroundColor: getAvatarColor(contact2) }}
                  />
                )}
                <ContactInfo>
                  <ContactName>{contact2.name}</ContactName>
                  {contact2.company && (
                    <ContactSubtitle>{contact2.company}</ContactSubtitle>
                  )}
                  {contact2.phoneNumbers?.[0] && (
                    <ContactSubtitle>{contact2.phoneNumbers[0].number}</ContactSubtitle>
                  )}
                  {contact2.emailAddresses?.[0] && (
                    <ContactSubtitle>{contact2.emailAddresses[0].email}</ContactSubtitle>
                  )}
                </ContactInfo>
              </ContactRow>
            </ComparisonContainer>

            <MergeButton
              mode="contained"
              onPress={() => handleMerge(contact1.id, contact2.id)}
              icon="merge"
              style={{ backgroundColor: '#6200ee' }}
            >
              Merge Contacts
            </MergeButton>
          </Card.Content>
        </DuplicateCard>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <EmptyState>
      <EmptyIcon>🎉</EmptyIcon>
      <EmptyTitle>No Duplicates Found!</EmptyTitle>
      <EmptySubtitle>
        Great job! Your contact list is clean and organized. 
        We'll automatically detect duplicates as you add more contacts.
      </EmptySubtitle>
    </EmptyState>
  );

  if (isScanning) {
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
            iconColor="white"
            size={28}
            onPress={() => router.back()}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          />
          <Text style={{ 
            flex: 1, 
            color: 'white', 
            fontSize: 24, 
            fontWeight: '800', 
            marginLeft: 16,
            letterSpacing: 0.5
          }}>
            Duplicate Detection
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#666666' }}>Scanning for duplicates...</Text>
        </View>
      </Container>
    );
  }

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
          iconColor="white"
          size={28}
          onPress={() => router.back()}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        />
        <Text style={{ 
          flex: 1, 
          color: 'white', 
          fontSize: 24, 
          fontWeight: '800', 
          marginLeft: 16,
          letterSpacing: 0.5
        }}>
          Duplicate Detection
        </Text>
        <IconButton
          icon="refresh"
          iconColor="white"
          size={28}
          onPress={scanForDuplicates}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        />
      </View>

      <ContentScroll showsVerticalScrollIndicator={false}>
        {duplicates.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <SectionCard>
              <Card.Content style={{ padding: 20 }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '700', 
                  color: '#1a1a1a',
                  marginBottom: 8
                }}>
                  Found {duplicates.length} Potential Duplicate{duplicates.length !== 1 ? 's' : ''}
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: '#666666',
                  lineHeight: 20
                }}>
                  Review and merge duplicate contacts to keep your list organized.
                </Text>
              </Card.Content>
            </SectionCard>

            {duplicates.map((duplicate, index) => renderDuplicate(duplicate, index))}
          </>
        )}
      </ContentScroll>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
        style={{ 
          backgroundColor: '#6200ee', 
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