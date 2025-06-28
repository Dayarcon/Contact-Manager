import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    getContactStats: () => ({ total: 0, favorites: 0, vip: 0, groups: {}, recent: 0 }),
    searchContacts: () => [],
    getContactsByGroup: () => [],
    getFavoriteContacts: () => [],
    getVIPContacts: () => [],
    getRecentContacts: () => [],
    syncGoogleContacts: () => Promise.resolve(),
    runBatchAutomation: () => Promise.resolve(),
    getAutomationServices: () => ({
      remindersService: {} as any,
      taggingService: {} as any,
      messagingService: {} as any,
      geoService: {} as any
    })
  };

  // Swipe state management
  const swipeRefs = useRef<{ [key: string]: ContactListItemRef | null }>({});
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  
  const { contacts, isLoading, deleteContact, toggleFavorite, toggleVIP, searchContacts, getFavoriteContacts, getVIPContacts, getRecentContacts, getContactsByGroup, getContactStats, syncGoogleContacts, isSyncing, lastSyncTimestamp } = safeContext;

  const { isSignedIn, userInfo, signIn, signOut, setSignInSuccessCallback } = useGoogleAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Use ref to access the latest syncGoogleContacts function without causing re-renders
  const syncGoogleContactsRef = useRef(syncGoogleContacts);
  syncGoogleContactsRef.current = syncGoogleContacts;

  // Set up success callback for Google authentication
  const handleSignInSuccess = useCallback(async () => {
    console.log('Google sign-in successful, staying on home screen');
    
    try {
      // Check if we need to sync contacts
      const shouldSync = !lastSyncTimestamp || 
        (Date.now() - lastSyncTimestamp) > (30 * 60 * 1000); // 30 minutes
      
      if (shouldSync) {
        console.log('Syncing contacts after sign-in...');
        await syncGoogleContactsRef.current(false); // Don't force sync, let the logic decide
        setSnackbar({ visible: true, message: 'Successfully signed in with Google and synced contacts! 🎉' });
      } else {
        console.log('Contacts are up to date, skipping sync');
        setSnackbar({ visible: true, message: 'Successfully signed in with Google! Your contacts are up to date.' });
      }
    } catch (error) {
      console.error('Error syncing contacts after sign-in:', error);
      setSnackbar({ visible: true, message: 'Signed in with Google, but failed to sync contacts. You can try syncing manually in Settings.' });
    }
    
    // Ensure we're on the home screen
    if (router.canGoBack()) {
      // If we can go back, we might be on a different screen, so navigate to home
      router.replace('/(tabs)');
    }
  }, [router, lastSyncTimestamp]);

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
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input to improve performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 150); // Reduced delay for better responsiveness

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Combine filter states into a single object to reduce re-renders
  const [filters, setFilters] = useState({
    showFavorites: false,
    showVIP: false,
    showFamily: false,
    showFriends: false,
    showEmergency: false,
    showRecent: false,
    selectedGroup: null as string | null,
    selectedLabel: null as string | null,
  });

  // Destructure for easier access
  const { 
    showFavorites, 
    showVIP, 
    showFamily, 
    showFriends, 
    showEmergency, 
    showRecent, 
    selectedGroup, 
    selectedLabel 
  } = filters;

  // Other state variables
  const [searchMode, setSearchMode] = useState(false);
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
      setFilters({
        showFavorites: true,
        showVIP: false,
        showFamily: false,
        showFriends: false,
        showEmergency: false,
        showRecent: false,
        selectedGroup: null,
        selectedLabel: null,
      });
    } else if (filter === 'vip') {
      setFilters({
        showFavorites: false,
        showVIP: true,
        showFamily: false,
        showFriends: false,
        showEmergency: false,
        showRecent: false,
        selectedGroup: null,
        selectedLabel: null,
      });
    } else if (filter === 'group' && filterValue) {
      setFilters({
        showFavorites: false,
        showVIP: false,
        showFamily: false,
        showFriends: false,
        showEmergency: false,
        showRecent: false,
        selectedGroup: Array.isArray(filterValue) ? filterValue[0] : filterValue,
        selectedLabel: null,
      });
    } else if (filter === 'label' && filterValue) {
      setFilters({
        showFavorites: false,
        showVIP: false,
        showFamily: false,
        showFriends: false,
        showEmergency: false,
        showRecent: false,
        selectedGroup: null,
        selectedLabel: Array.isArray(filterValue) ? filterValue[0] : filterValue,
      });
    } else if (filter === 'emergency') {
      setFilters({
        showFavorites: false,
        showVIP: false,
        showFamily: false,
        showFriends: false,
        showEmergency: true,
        showRecent: false,
        selectedGroup: null,
        selectedLabel: null,
      });
    } else if (filter === 'recent') {
      setFilters({
        showFavorites: false,
        showVIP: false,
        showFamily: false,
        showFriends: false,
        showEmergency: false,
        showRecent: true,
        selectedGroup: null,
        selectedLabel: null,
      });
    }
  }, [filter, filterValue]);

  // Unique groups from contacts - memoized to prevent recalculation, limit to first 10 for performance
  const groups = useMemo(() => 
    Array.from(new Set(safeContacts.map(c => c.group).filter(Boolean))).slice(0, 10), 
    [safeContacts]
  );

  // Memoize stats calculation
  const stats = useMemo(() => 
    getContactStats?.() || { total: 0, favorites: 0, vip: 0, groups: {}, recent: 0 }, 
    [getContactStats, safeContacts]
  );

  // Memoize filtered contacts to prevent recalculation on every render
  const filteredContacts = useMemo(() => {
    let contacts = safeContacts;

    // Apply filters
    if (showFavorites) {
      contacts = getFavoriteContacts?.() || [];
    } else if (showVIP) {
      contacts = getVIPContacts?.() || [];
    } else if (showFamily) {
      contacts = getContactsByGroup?.('Family') || [];
    } else if (showFriends) {
      contacts = getContactsByGroup?.('Friends') || [];
    } else if (selectedGroup) {
      contacts = getContactsByGroup?.(selectedGroup) || [];
    } else if (selectedLabel) {
      contacts = safeContacts.filter((c: any) => c.labels?.includes(selectedLabel));
    } else if (showEmergency) {
      contacts = safeContacts.filter((c: any) => c.isEmergencyContact);
    } else if (showRecent) {
      contacts = getRecentContacts?.(7) || [];
    }

    // Apply search
    if (debouncedSearch) {
      contacts = performAdvancedSearch(debouncedSearch, searchFilters);
    }

    // Sort contacts alphabetically by name
    return contacts.sort((a: any, b: any) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [safeContacts, showFavorites, showVIP, showFamily, showFriends, selectedGroup, selectedLabel, showEmergency, showRecent, debouncedSearch, searchFilters, getFavoriteContacts, getVIPContacts, getContactsByGroup, getRecentContacts]);

  const performAdvancedSearch = (query: string, filters: any) => {
    if (!query.trim()) return safeContacts;
    
    const searchTerm = query.toLowerCase();
    const searchTermLength = searchTerm.length;
    
    return safeContacts.filter((contact: any) => {
      // Early exit for very short queries
      if (searchTermLength < 2) return true;
      
      // Name search - most common case first
      if (filters.name) {
        const name = contact.name?.toLowerCase() || '';
        if (name.includes(searchTerm)) return true;
        
        const firstName = contact.firstName?.toLowerCase() || '';
        if (firstName.includes(searchTerm)) return true;
        
        const lastName = contact.lastName?.toLowerCase() || '';
        if (lastName.includes(searchTerm)) return true;
      }
      
      // Company search
      if (filters.company) {
        const company = contact.company?.toLowerCase() || '';
        if (company.includes(searchTerm)) return true;
        
        const jobTitle = contact.jobTitle?.toLowerCase() || '';
        if (jobTitle.includes(searchTerm)) return true;
      }
      
      // Phone search - only if we have phone numbers
      if (filters.phone && contact.phoneNumbers?.length) {
        for (const phone of contact.phoneNumbers) {
          if (phone.number.toLowerCase().includes(searchTerm)) return true;
        }
      }
      
      // Email search - only if we have emails
      if (filters.email && contact.emailAddresses?.length) {
        for (const email of contact.emailAddresses) {
          if (email.email.toLowerCase().includes(searchTerm)) return true;
        }
      }
      
      // Notes search
      if (filters.notes) {
        const notes = contact.notes?.toLowerCase() || '';
        if (notes.includes(searchTerm)) return true;
      }
      
      // Group search
      if (filters.group) {
        const group = contact.group?.toLowerCase() || '';
        if (group.includes(searchTerm)) return true;
      }
      
      return false;
    });
  };

  const handleToggleFavorite = (id: string, isNowFavorite: boolean) => {
    toggleFavorite?.(id);
  };

  const clearAllFilters = () => {
    // Reset all filter states
    setFilters({
      showFavorites: false,
      showVIP: false,
      showFamily: false,
      showFriends: false,
      showEmergency: false,
      showRecent: false,
      selectedGroup: null,
      selectedLabel: null,
    });
    
    // Reset search filters
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

  const renderContact = useCallback(({ item, index }: { item: any; index: number }) => {
    return (
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
    );
  }, [deleteContact, toggleFavorite, toggleVIP, handleSwipeOpen, router]);

  const renderEmptyState = useMemo(() => (
    <EmptyState>
      <EmptyIcon>👋</EmptyIcon>
      <EmptyTitle>
        {debouncedSearch ? 'No contacts found' : 'No contacts yet'}
      </EmptyTitle>
      <EmptySubtitle>
        {debouncedSearch 
          ? 'Try adjusting your search terms or check your filters'
          : 'Add your first contact to get started with managing your connections'
        }
      </EmptySubtitle>
      {!debouncedSearch && (
        // @ts-ignore
        <IconButton
          icon="plus"
          size={32}
          style={{ marginTop: 24, backgroundColor: '#6200ee' }}
          onPress={() => router.push('/add-contact')}
        />
      )}
    </EmptyState>
  ), [debouncedSearch, router]);

  const SearchFilters = useMemo(() => (
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
  ), [showAdvancedSearch, searchFilters, clearAllFilters]);

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

        {showAdvancedSearch && SearchFilters}

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
                setFilters({
                  showFavorites: true,
                  showVIP: false,
                  showFamily: false,
                  showFriends: false,
                  showEmergency: false,
                  showRecent: false,
                  selectedGroup: null,
                  selectedLabel: null,
                });
              }}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              Favorites
            </Chip>
            
            <Chip
              selected={showVIP}
              onPress={() => {
                setFilters({
                  showFavorites: false,
                  showVIP: true,
                  showFamily: false,
                  showFriends: false,
                  showEmergency: false,
                  showRecent: false,
                  selectedGroup: null,
                  selectedLabel: null,
                });
              }}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              VIP
            </Chip>
            
            <Chip
              selected={showRecent}
              onPress={() => {
                setFilters({
                  showFavorites: false,
                  showVIP: false,
                  showFamily: false,
                  showFriends: false,
                  showEmergency: false,
                  showRecent: true,
                  selectedGroup: null,
                  selectedLabel: null,
                });
              }}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              Recent
            </Chip>
            
            <Chip
              selected={showEmergency}
              onPress={() => {
                setFilters({
                  showFavorites: false,
                  showVIP: false,
                  showFamily: false,
                  showFriends: false,
                  showEmergency: true,
                  showRecent: false,
                  selectedGroup: null,
                  selectedLabel: null,
                });
              }}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              Emergency
            </Chip>
            
            <Chip
              selected={showFamily}
              onPress={() => {
                setFilters({
                  showFavorites: false,
                  showVIP: false,
                  showFamily: true,
                  showFriends: false,
                  showEmergency: false,
                  showRecent: false,
                  selectedGroup: null,
                  selectedLabel: null,
                });
              }}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              Family
            </Chip>
            
            <Chip
              selected={showFriends}
              onPress={() => {
                setFilters({
                  showFavorites: false,
                  showVIP: false,
                  showFamily: false,
                  showFriends: true,
                  showEmergency: false,
                  showRecent: false,
                  selectedGroup: null,
                  selectedLabel: null,
                });
              }}
              textStyle={{ color: 'black', fontWeight: '600' }}
              style={{ marginRight: 12 }}
            >
              Friends
            </Chip>
            
            {groups.map((group) => (
              <Chip
                key={group}
                selected={selectedGroup === group}
                onPress={() => {
                  setFilters({
                    showFavorites: false,
                    showVIP: false,
                    showFamily: false,
                    showFriends: false,
                    showEmergency: false,
                    showRecent: false,
                    selectedGroup: selectedGroup === group ? null : group,
                    selectedLabel: null,
                  });
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
          renderEmptyState
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={5}
            initialNumToRender={5}
            updateCellsBatchingPeriod={50}
            disableVirtualization={false}
            getItemLayout={(data, index) => ({
              length: 100,
              offset: 100 * index,
              index,
            })}
            onEndReachedThreshold={0.5}
            onEndReached={() => {}}
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
