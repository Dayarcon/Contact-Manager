import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Appbar, Button, Card, Chip, Text, useTheme } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import styled from 'styled-components/native';
import DraggableContactList from '../../components/DraggableContactList';
import { useContacts } from '../../context/ContactsContext';

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

const SectionHeader = styled(Text)`
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 20px;
  color: #1a1a1a;
  letter-spacing: 0.5px;
`;

const GroupHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
`;

const GroupTitle = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.3px;
`;

const GroupCount = styled(Chip)`
  background-color: #6200ee;
  border-radius: 16px;
`;

const EmptyState = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
`;

const EmptyIcon = styled.Text`
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.7;
`;

const EmptyTitle = styled(Text)`
  font-size: 24px;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 12px;
  text-align: center;
  letter-spacing: 0.5px;
`;

const EmptySubtitle = styled(Text)`
  font-size: 16px;
  color: #666666;
  text-align: center;
  line-height: 24px;
  margin-bottom: 32px;
  letter-spacing: 0.3px;
`;

const FilterContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
`;

const StyledChip = styled(Chip)`
  background-color: #f0f0f0;
  border-radius: 20px;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 6px;
`;

const ActiveChip = styled(Chip)`
  background-color: #6200ee;
  border-radius: 20px;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
`;

export default function ManageContactsScreen() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Try to access theme with error handling
  let theme;
  try {
    theme = useTheme();
  } catch (error) {
    console.error('Error accessing theme:', error);
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

  const { contacts, editContact, deleteContact, getContactsByGroup } = useContacts() || {
    contacts: [],
    editContact: () => console.warn('Context not available'),
    deleteContact: () => console.warn('Context not available'),
    getContactsByGroup: () => []
  };

  // Get unique groups from contacts
  const groups = Array.from(new Set(contacts.map(contact => contact.group).filter(Boolean)));
  const allContacts = contacts.filter(contact => !selectedGroup || contact.group === selectedGroup);

  const handleReorder = (fromIndex: number, toIndex: number) => {
    // This would typically update the order in your data store
    console.log(`Reordered contact from index ${fromIndex} to ${toIndex}`);
    // You could implement a custom ordering system here
  };

  const handleContactPress = (contact: any) => {
    router.push({ pathname: '/contact-details', params: { id: contact.id } });
  };

  const handleContactEdit = (contactId: string) => {
    router.push({ pathname: '/edit-contact', params: { id: contactId } });
  };

  const handleContactDelete = (contactId: string) => {
    deleteContact?.(contactId);
  };

  const renderEmptyState = () => (
    <EmptyState>
      <EmptyIcon>📋</EmptyIcon>
      <EmptyTitle>No contacts to manage</EmptyTitle>
      <EmptySubtitle>
        Add some contacts first to start organizing and reordering them
      </EmptySubtitle>
      <Button
        mode="contained"
        onPress={() => router.push('/add-contact')}
        icon="plus"
        style={{ borderRadius: 16 }}
      >
        Add Contact
      </Button>
    </EmptyState>
  );

  if (contacts.length === 0) {
    return (
      <Container>
        <HeaderGradient
          colors={[theme.colors.primary, theme.colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.Content 
            title="Manage Contacts" 
            titleStyle={{ color: 'white', fontWeight: 'bold' }}
          />
          <Appbar.Action icon="plus" onPress={() => router.push('/add-contact')} iconColor="white" />
        </Appbar.Header>
        {renderEmptyState()}
      </Container>
    );
  }

  return (
    <Container>
      <HeaderGradient
        colors={[theme.colors.primary, theme.colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
        <Appbar.Content 
          title="Manage Contacts" 
          titleStyle={{ color: 'white', fontWeight: 'bold' }}
        />
        <Appbar.Action 
          icon={isEditMode ? "check" : "pencil"} 
          onPress={() => setIsEditMode(!isEditMode)} 
          iconColor="white" 
        />
        <Appbar.Action icon="plus" onPress={() => router.push('/add-contact')} iconColor="white" />
      </Appbar.Header>

      <ContentScroll>
        <Animated.View entering={FadeInUp.springify()}>
          <SectionCard>
            <Card.Content>
              <SectionHeader>Organize Contacts</SectionHeader>
              
              <FilterContainer>
                <StyledChip
                  selected={!selectedGroup}
                  onPress={() => setSelectedGroup(null)}
                  textStyle={{ 
                    color: !selectedGroup ? 'white' : '#6200ee',
                    fontWeight: '600'
                  }}
                  style={{ 
                    backgroundColor: !selectedGroup ? '#6200ee' : '#f0f0f0'
                  }}
                >
                  All Contacts
                </StyledChip>
                
                {groups.map((group) => (
                  <StyledChip
                    key={group}
                    selected={selectedGroup === group}
                    onPress={() => setSelectedGroup(group)}
                    textStyle={{ 
                      color: selectedGroup === group ? 'white' : '#6200ee',
                      fontWeight: '600'
                    }}
                    style={{ 
                      backgroundColor: selectedGroup === group ? '#6200ee' : '#f0f0f0'
                    }}
                  >
                    {group}
                  </StyledChip>
                ))}
              </FilterContainer>

              {selectedGroup && (
                <GroupHeader>
                  <GroupTitle>{selectedGroup}</GroupTitle>
                  <GroupCount textStyle={{ color: 'white', fontWeight: '600' }}>
                    {allContacts.length} contact{allContacts.length !== 1 ? 's' : ''}
                  </GroupCount>
                </GroupHeader>
              )}

              <DraggableContactList
                contacts={allContacts}
                onReorder={handleReorder}
                onContactPress={handleContactPress}
                onContactEdit={handleContactEdit}
                onContactDelete={handleContactDelete}
                groupName={selectedGroup || undefined}
              />
            </Card.Content>
          </SectionCard>
        </Animated.View>
      </ContentScroll>
    </Container>
  );
} 