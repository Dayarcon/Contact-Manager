import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, TouchableOpacity, View } from 'react-native';
import { Avatar, Button, Card, Chip, FAB, IconButton, Menu, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import styled from 'styled-components/native';
import ContactListItem, { ContactListItemRef } from '../../components/ContactListItem';
import { useContacts } from '../../context/ContactsContext';
import { useGoogleAuth } from '../../context/GoogleAuthContext';

const { width, height } = Dimensions.get('window');

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`;

const HeaderGradient = styled(LinearGradient)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 280px;
  z-index: -1;
`;

const HeaderSection = styled.View`
  background-color: transparent;
  padding-bottom: 20px;
  padding-top: 40px;
`;

const SearchContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: white;
  margin: 0 20px 20px 20px;
  padding: -1px 10px;
  border-radius: 50px;
  elevation: 8;
  shadow-color: #000;
  shadow-opacity: 0.12;
  shadow-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
`;

const SearchIconContainer = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 6px;
`;

const GoogleButton = styled(TouchableOpacity)`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: white;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const StyledSearchBar = styled(TextInput)`
  flex: 1;
  background-color: transparent;
  color: #1a1a1a;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.3px;
  text-decoration: none;
  border-bottom-width: 0;
  padding-bottom: 0;
`;

const SearchActions = styled.View`
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
`;

const ActionButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 6px;
`;

const FilterButton = styled.TouchableOpacity<{ active: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${(props: { active: boolean }) => props.active ? '#6200ee' : '#f0f0f0'};
  align-items: center;
  justify-content: center;
  elevation: ${(props: { active: boolean }) => props.active ? 4 : 2};
  shadow-color: #000;
  shadow-opacity: ${(props: { active: boolean }) => props.active ? 0.1 : 0.05};
  shadow-radius: ${(props: { active: boolean }) => props.active ? 8 : 6};
`;

const ChipRow = styled.View`
  margin-bottom: 0px;
  padding: 0 15px;
`;

const ActiveChip = styled(Chip)`
  margin-right: 10px;
  background-color: white;
  border-radius: 22px;
  elevation: 4;
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

const StatsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin: 10px 20px 20px 20px;
  padding: 20px;
  background-color: white;
  border-radius: 20px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const StatItem = styled.View`
  align-items: center;
`;

const StatValue = styled(Text)`
  font-size: 24px;
  font-weight: 800;
  color: #6200ee;
  margin-bottom: 4px;
`;

const StatLabel = styled(Text)`
  font-size: 12px;
  color: #666666;
  text-align: center;
  letter-spacing: 0.2px;
`;

const ContactListContainer = styled.View`
  flex: 1;
  padding-top: 20px;
`;

const commonGroups = ["Family", "Work", "Client", "Friends", "Emergency"];

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();
  const context = useContacts();
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
    toggleVIP: () => console.warn('Context not available'),
    importContacts: () => console.warn('Context not available'),
    setContacts: () => console.warn('Context not available'),
    addHistoryEvent: () => console.warn('Context not available'),
    mergeContacts: () => console.warn('Context not available'),
    findDuplicates: () => [],
    searchContacts: () => [],
    getContactsByGroup: () => [],
    getFavoriteContacts: () => [],
    getVIPContacts: () => [],
    getRecentContacts: () => [],
    getContactStats: () => ({ total: 0, favorites: 0, vip: 0, groups: {}, recent: 0 })
  };

  // Swipe state management
  const swipeRefs = useRef<{ [key: string]: ContactListItemRef | null }>({});
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  
  const { contacts, isLoading, deleteContact, toggleFavorite, toggleVIP, searchContacts, getFavoriteContacts, getVIPContacts, getRecentContacts, getContactsByGroup, getContactStats } = safeContext;

  const { isSignedIn, userInfo, signIn, signOut, setSignInSuccessCallback } = useGoogleAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Set up success callback for Google authentication
  const handleSignInSuccess = useCallback(() => {
    console.log('Google sign-in successful, staying on home screen');
    // Ensure we're on the home screen
    if (router.canGoBack()) {
      // If we can go back, we might be on a different screen, so navigate to home
      router.replace('/(tabs)');
    }
    // Show success message
    setSnackbar({ visible: true, message: 'Successfully signed in with Google! 🎉' });
  }, [router]);

  // Set up success callback only once
  useEffect(() => {
    console.log('Setting up Google sign-in success callback');
    setSignInSuccessCallback(handleSignInSuccess);
    
    // Cleanup function to prevent memory leaks
    return () => {
      setSignInSuccessCallback(() => {});
    };
  }, []); // Empty dependency array to run only once

  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showVIP, setShowVIP] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [menuVisible, setMenuVisible] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    name: true,
    company: true,
    phone: true,
    email: true,
    notes: true,
    group: true,
    type: 'All',
    sortBy: 'Name'
  });

  // Ensure contacts is always an array
  const safeContacts = contacts || [];

  // Get filter from route params
  const filter = params?.filter;
  const filterValue = params?.value;

  // Apply route filters on mount
  useEffect(() => {
    if (filter === 'favorites') {
      setShowFavorites(true);
      setSelectedGroup(null);
      setSelectedLabel(null);
      setShowEmergency(false);
      setShowRecent(false);
      setShowVIP(false);
    } else if (filter === 'vip') {
      setShowVIP(true);
      setShowFavorites(false);
      setSelectedGroup(null);
      setSelectedLabel(null);
      setShowEmergency(false);
      setShowRecent(false);
    } else if (filter === 'group' && filterValue) {
      setSelectedGroup(Array.isArray(filterValue) ? filterValue[0] : filterValue);
      setShowFavorites(false);
      setSelectedLabel(null);
      setShowEmergency(false);
      setShowRecent(false);
      setShowVIP(false);
    } else if (filter === 'label' && filterValue) {
      setSelectedLabel(Array.isArray(filterValue) ? filterValue[0] : filterValue);
      setShowFavorites(false);
      setSelectedGroup(null);
      setShowEmergency(false);
      setShowRecent(false);
      setShowVIP(false);
    } else if (filter === 'emergency') {
      setShowEmergency(true);
      setShowFavorites(false);
      setSelectedGroup(null);
      setSelectedLabel(null);
      setShowRecent(false);
      setShowVIP(false);
    } else if (filter === 'recent') {
      setShowRecent(true);
      setShowFavorites(false);
      setSelectedGroup(null);
      setSelectedLabel(null);
      setShowEmergency(false);
      setShowVIP(false);
    }
  }, [filter, filterValue]);

  // Unique groups from contacts
  const groups = Array.from(new Set(safeContacts.map(c => c.group).filter(Boolean)));

  let filteredContacts = safeContacts;

  // Apply filters
  if (showFavorites) {
    filteredContacts = getFavoriteContacts?.() || [];
  } else if (showVIP) {
    filteredContacts = getVIPContacts?.() || [];
  } else if (selectedGroup) {
    filteredContacts = getContactsByGroup?.(selectedGroup) || [];
  } else if (selectedLabel) {
    filteredContacts = safeContacts.filter(c => c.labels?.includes(selectedLabel));
  } else if (showEmergency) {
    filteredContacts = safeContacts.filter(c => c.isEmergencyContact);
  } else if (showRecent) {
    filteredContacts = getRecentContacts?.(7) || [];
  }

  const performAdvancedSearch = (query: string, filters: any) => {
    if (!query.trim()) return safeContacts;
    
    const searchTerm = query.toLowerCase();
    return safeContacts.filter(contact => {
      // Name search
      if (filters.name && contact.name?.toLowerCase().includes(searchTerm)) return true;
      if (filters.name && contact.firstName?.toLowerCase().includes(searchTerm)) return true;
      if (filters.name && contact.lastName?.toLowerCase().includes(searchTerm)) return true;
      
      // Company search
      if (filters.company && contact.company?.toLowerCase().includes(searchTerm)) return true;
      if (filters.company && contact.jobTitle?.toLowerCase().includes(searchTerm)) return true;
      
      // Phone search
      if (filters.phone && contact.phoneNumbers?.some(phone => 
        phone.number.toLowerCase().includes(searchTerm)
      )) return true;
      
      // Email search
      if (filters.email && contact.emailAddresses?.some(email => 
        email.email.toLowerCase().includes(searchTerm)
      )) return true;
      
      // Notes search
      if (filters.notes && contact.notes?.toLowerCase().includes(searchTerm)) return true;
      
      // Group search
      if (filters.group && contact.group?.toLowerCase().includes(searchTerm)) return true;
      
      return false;
    });
  };

  // Apply search
  if (search) {
    filteredContacts = performAdvancedSearch(search, searchFilters);
  }

  const handleToggleFavorite = (id: string, isNowFavorite: boolean) => {
    toggleFavorite?.(id);
  };

  const clearAllFilters = () => {
    setSearchFilters({
      name: true,
      company: true,
      phone: true,
      email: true,
      notes: true,
      group: true,
      type: 'All',
      sortBy: 'Name'
    });
  };

  const handleSwipeOpen = (contactId: string) => {
    // Close any previously open swipe immediately
    if (openSwipeId && openSwipeId !== contactId) {
      const prevRef = swipeRefs.current[openSwipeId];
      if (prevRef) {
        prevRef.closeImmediate();
      }
    }
    setOpenSwipeId(contactId);
  };

  const stats = getContactStats?.() || { total: 0, favorites: 0, vip: 0, groups: {}, recent: 0 };

  const renderContact = ({ item, index }: { item: any; index: number }) => {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 80).springify()}
      >
        <ContactListItem
          ref={(ref: ContactListItemRef | null) => {
            swipeRefs.current[item.id] = ref;
          }}
          contact={item}
          onEdit={(id: string) => router.push({ pathname: '/edit-contact', params: { id } })}
          onDelete={(id: string) => {
            if (deleteContact) {
              deleteContact(id);
            }
          }}
          onToggleFavorite={(id: string) => {
            if (toggleFavorite) {
              toggleFavorite(id);
            }
          }}
          onToggleVIP={(id: string) => {
            if (toggleVIP) {
              toggleVIP(id);
            }
          }}
          onPress={(contact: any) => {
            router.push({ pathname: '/contact-details', params: { id: contact.id } });
          }}
          onSwipeOpen={handleSwipeOpen}
        />
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <EmptyState>
      <EmptyIcon>👋</EmptyIcon>
      <EmptyTitle>
        {search ? 'No contacts found' : 'No contacts yet'}
      </EmptyTitle>
      <EmptySubtitle>
        {search 
          ? 'Try adjusting your search terms or check your filters'
          : 'Add your first contact to get started with managing your connections'
        }
      </EmptySubtitle>
      {!search && (
        // @ts-ignore
        <IconButton
          icon="plus"
          size={32}
          style={{ marginTop: 24, backgroundColor: '#6200ee' }}
          onPress={() => router.push('/add-contact')}
        />
      )}
    </EmptyState>
  );

  const SearchFilters = () => (
    <Animated.View entering={FadeInUp.springify()}>
      <Card style={{ 
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 20,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        backgroundColor: 'white'
      }}>
        <Card.Content style={{ padding: 24 }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 20 
          }}>
            <View style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              backgroundColor: '#6200ee', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: 12
            }}>
              <Text style={{ color: 'white', fontSize: 16 }}>⚙️</Text>
            </View>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '700', 
              color: '#1a1a1a',
              letterSpacing: 0.3
            }}>
              Advanced Filters
            </Text>
          </View>
          
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              marginBottom: 12, 
              color: '#666666',
              letterSpacing: 0.2
            }}>
              Contact Type
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {['All', 'Personal', 'Work', 'Family', 'Emergency'].map((type) => (
                <Chip
                  key={type}
                  selected={searchFilters.type === type}
                  onPress={() => setSearchFilters({ ...searchFilters, type })}
                  textStyle={{ 
                    color: searchFilters.type === type ? 'white' : '#6200ee',
                    fontWeight: '600',
                    fontSize: 14
                  }}
                  style={{ 
                    backgroundColor: searchFilters.type === type ? '#6200ee' : '#f8f9fa',
                    marginBottom: 8,
                    borderWidth: searchFilters.type === type ? 0 : 1,
                    borderColor: '#e0e0e0'
                  }}
                >
                  {type}
                </Chip>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              marginBottom: 12, 
              color: '#666666',
              letterSpacing: 0.2
            }}>
              Sort By
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {['Name', 'Recent', 'Favorites', 'Company'].map((sort) => (
                <Chip
                  key={sort}
                  selected={searchFilters.sortBy === sort}
                  onPress={() => setSearchFilters({ ...searchFilters, sortBy: sort })}
                  textStyle={{ 
                    color: searchFilters.sortBy === sort ? 'white' : '#6200ee',
                    fontWeight: '600',
                    fontSize: 14
                  }}
                  style={{ 
                    backgroundColor: searchFilters.sortBy === sort ? '#6200ee' : '#f8f9fa',
                    marginBottom: 8,
                    borderWidth: searchFilters.sortBy === sort ? 0 : 1,
                    borderColor: '#e0e0e0'
                  }}
                >
                  {sort}
                </Chip>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              mode="outlined"
              onPress={clearAllFilters}
              style={{ flex: 1, borderRadius: 12 }}
            >
              Clear All
            </Button>
            <Button
              mode="contained"
              onPress={() => setShowAdvancedSearch(false)}
              style={{ flex: 1, borderRadius: 12 }}
            >
              Apply Filters
            </Button>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  const handleGoogleAuth = async () => {
    try {
      setIsAuthLoading(true);
      if (isSignedIn) {
        await signOut();
        setSnackbar({ visible: true, message: 'Successfully signed out from Google' });
      } else {
        await signIn();
        // Success callback will handle the success message
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setSnackbar({ 
        visible: true, 
        message: 'Failed to authenticate with Google. Please try again.' 
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <HeaderGradient
          colors={[safeTheme.colors.primary, safeTheme.colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={safeTheme.colors.primary} />
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderGradient
        colors={[safeTheme.colors.primary, safeTheme.colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <HeaderSection>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginBottom: 20
        }}>
          <View>
            <Text style={{ 
              fontSize: 32, 
              fontWeight: '800', 
              color: 'black',
              letterSpacing: 0.5
            }}>
              Contacts
            </Text>
          </View>
          <SearchActions>
            <FilterButton
            style={{ marginLeft: 140}}
              active={showAdvancedSearch}
              onPress={() => setShowAdvancedSearch(!showAdvancedSearch)}
            >
              <IconButton
                icon="filter-variant"
                size={20}
                iconColor={showAdvancedSearch ? 'white' : '#666666'}
                style={{ margin: 0 }}
              />
            </FilterButton>
          </SearchActions>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                iconColor="black"
                size={24}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                router.push('/duplicates');
              }}
              title="Find Duplicates"
              leadingIcon="account-multiple"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                router.push('/settings');
              }}
              title="Settings"
              leadingIcon="cog"
            />
          </Menu>
        </View>

        <SearchContainer>
          <SearchIconContainer>
            <IconButton
              icon="magnify"
              size={20}
              iconColor="#666666"
              style={{ margin: 0 }}
            />
          </SearchIconContainer>
          
          <StyledSearchBar
            placeholder="Search contacts..."
            value={search}
            onChangeText={setSearch}
            mode="flat"
            style={{ flex: 1 }}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            right={
              search ? (
                <TextInput.Icon
                  icon="close"
                  onPress={() => setSearch('')}
                />
              ) : undefined
            }
          />

          <GoogleButton 
            onPress={handleGoogleAuth}
            disabled={isAuthLoading}
          >
            {isAuthLoading ? (
              <ActivityIndicator size={24} color="#DB4437" />
            ) : isSignedIn && userInfo?.picture ? (
              <Avatar.Image 
                size={40} 
                source={{ uri: userInfo.picture }}
              />
            ) : (
              <Avatar.Icon 
                size={40}
                icon="google"
                color="#DB4437"
                style={{ backgroundColor: 'transparent' }}
              />
            )}
          </GoogleButton>
        </SearchContainer>

        {showAdvancedSearch && <SearchFilters />}

        <ChipRow>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip
              selected={!showFavorites && !showVIP && !selectedGroup && !selectedLabel && !showEmergency && !showRecent}
              onPress={clearAllFilters}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              All
            </Chip>
            
            <Chip
              selected={showFavorites}
              onPress={() => {
                setShowFavorites(!showFavorites);
                setShowVIP(false);
                setSelectedGroup(null);
                setSelectedLabel(null);
                setShowEmergency(false);
                setShowRecent(false);
              }}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              Favorites
            </Chip>
            
            <Chip
              selected={showVIP}
              onPress={() => {
                setShowVIP(!showVIP);
                setShowFavorites(false);
                setSelectedGroup(null);
                setSelectedLabel(null);
                setShowEmergency(false);
                setShowRecent(false);
              }}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              VIP
            </Chip>
            
            <Chip
              selected={showRecent}
              onPress={() => {
                setShowRecent(!showRecent);
                setShowFavorites(false);
                setShowVIP(false);
                setSelectedGroup(null);
                setSelectedLabel(null);
                setShowEmergency(false);
              }}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              Recent
            </Chip>
            
            <Chip
              selected={showEmergency}
              onPress={() => {
                setShowEmergency(!showEmergency);
                setShowFavorites(false);
                setShowVIP(false);
                setSelectedGroup(null);
                setSelectedLabel(null);
                setShowRecent(false);
              }}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              Emergency
            </Chip>
            
            {groups.map((group) => (
              <Chip
                key={group}
                selected={selectedGroup === group}
                onPress={() => {
                  setSelectedGroup(selectedGroup === group ? null : group);
                  setShowFavorites(false);
                  setShowVIP(false);
                  setSelectedLabel(null);
                  setShowEmergency(false);
                  setShowRecent(false);
                }}
                textStyle={{ color: 'black', fontWeight: '600' }}
                style={{ marginRight: 12 }}
              >
                {group}
              </Chip>
            ))}
          </ScrollView>
        </ChipRow>


      </HeaderSection>

      <ContactListContainer>
        {filteredContacts.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderContact}
            keyExtractor={(item: any) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </ContactListContainer>

      <FAB
        icon="plus"
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
          backgroundColor: safeTheme.colors.primary,
        }}
        onPress={() => router.push('/add-contact')}
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </Container>
  );
}
