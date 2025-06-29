import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import AutoTaggingService from '../services/AutoTaggingService';
import ContactSyncService from '../services/ContactSyncService';
import GeoLocationService from '../services/GeoLocationService';
import ScheduledMessagingService from '../services/ScheduledMessagingService';
import SmartRemindersService from '../services/SmartRemindersService';
import { memoryOptimization, performanceMonitor } from '../utils/performance';
import { useGoogleAuth } from './GoogleAuthContext';

export interface InteractionHistoryItem {
  id: string;
  type: 'call' | 'sms' | 'email' | 'visit' | 'note' | 'reminder' | 'share' | 'copy' | 'quick_action' | 'website' | 'map' | 'video_call' | 'custom';
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  duration?: number;
  note?: string;
  attachmentUri?: string;
  source: 'auto' | 'manual';
  metadata?: any;
}

export type PhoneNumber = {
  id: string;
  number: string;
  type: 'mobile' | 'work' | 'home' | 'other';
  isPrimary: boolean;
};

export type EmailAddress = {
  id: string;
  email: string;
  type: 'personal' | 'work' | 'other';
  isPrimary: boolean;
};

export type Contact = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phoneNumbers: PhoneNumber[];
  emailAddresses: EmailAddress[];
  businessType: string;
  address: string;
  socialMedia: string;
  website?: string;
  birthday?: string;
  anniversary?: string;
  isFavorite: boolean;
  isVIP: boolean;
  group: string;
  notes?: string;
  history?: InteractionHistoryItem[];
  imageUri?: string;
  isEmergencyContact?: boolean;
  emergencyContact?: string;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
  googleResourceName?: string;
};

interface ContactsContextType {
  contacts: Contact[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
  addContact: (contact: Omit<Contact, 'id' | 'isFavorite' | 'isVIP' | 'history' | 'createdAt' | 'updatedAt'>) => void;
  editContact: (id: string, updated: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleVIP: (id: string) => void;
  importContacts: (imported: Omit<Contact, 'id' | 'isFavorite' | 'isVIP' | 'createdAt' | 'updatedAt'>[]) => void;
  syncGoogleContacts: (forceSync?: boolean) => Promise<void>;
  setContacts: (contacts: Contact[]) => void;
  addHistoryEvent: (id: string, event: InteractionHistoryItem) => void;
  mergeContacts: (primaryId: string, secondaryId: string) => void;
  findDuplicates: () => { contact1: Contact; contact2: Contact; similarity: number; reason: string }[];
  getContactStats: () => { total: number; favorites: number; vip: number; groups: Record<string, number>; recent: number };
  searchContacts: (query: string) => Contact[];
  getContactsByGroup: (group: string) => Contact[];
  getFavoriteContacts: () => Contact[];
  getVIPContacts: () => Contact[];
  getRecentContacts: (days?: number) => Contact[];
  runBatchAutomation: () => Promise<void>;
  getAutomationServices: () => {
    remindersService: SmartRemindersService;
    taggingService: AutoTaggingService;
    messagingService: ScheduledMessagingService;
    geoService: GeoLocationService;
  };
}

// Action types for reducer
type ContactAction = 
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: { id: string; updates: Partial<Contact> } }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'TOGGLE_VIP'; payload: string }
  | { type: 'ADD_HISTORY'; payload: { id: string; event: InteractionHistoryItem } }
  | { type: 'MERGE_CONTACTS'; payload: { primaryId: string; secondaryId: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_LAST_SYNC'; payload: number };

// Reducer for better state management
const contactsReducer = (state: {
  contacts: Contact[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
}, action: ContactAction) => {
  switch (action.type) {
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };
    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.payload] };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map(contact =>
          contact.id === action.payload.id
            ? { ...contact, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : contact
        )
      };
    case 'DELETE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter(contact => contact.id !== action.payload)
      };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        contacts: state.contacts.map(contact =>
          contact.id === action.payload
            ? { ...contact, isFavorite: !contact.isFavorite, updatedAt: new Date().toISOString() }
            : contact
        )
      };
    case 'TOGGLE_VIP':
      return {
        ...state,
        contacts: state.contacts.map(contact =>
          contact.id === action.payload
            ? { ...contact, isVIP: !contact.isVIP, updatedAt: new Date().toISOString() }
            : contact
        )
      };
    case 'ADD_HISTORY':
      return {
        ...state,
        contacts: state.contacts.map(contact =>
          contact.id === action.payload.id
            ? {
                ...contact,
                history: [...(contact.history || []), action.payload.event],
                updatedAt: new Date().toISOString()
              }
            : contact
        )
      };
    case 'MERGE_CONTACTS':
      // Implementation for merge contacts
      const { primaryId, secondaryId } = action.payload;
      const primaryContact = state.contacts.find(c => c.id === primaryId);
      const secondaryContact = state.contacts.find(c => c.id === secondaryId);
      
      if (!primaryContact || !secondaryContact) {
        return state;
      }
      
      // Merge logic would go here - for now just remove the secondary contact
      return {
        ...state,
        contacts: state.contacts.filter(c => c.id !== secondaryId)
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTimestamp: action.payload };
    default:
      return state;
  }
};

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

const STORAGE_KEY = 'contacts';

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(contactsReducer, {
    contacts: [],
    isLoading: true,
    isSyncing: false,
    lastSyncTimestamp: null,
  });

  const { isSignedIn, createGoogleContact, updateGoogleContact, deleteGoogleContact, getContacts } = useGoogleAuth();

  // Initialize automation services
  const [remindersService] = useState(() => SmartRemindersService.getInstance());
  const [taggingService] = useState(() => AutoTaggingService.getInstance());
  const [messagingService] = useState(() => ScheduledMessagingService.getInstance());
  const [geoService] = useState(() => GeoLocationService.getInstance());
  const [contactSyncService] = useState(() => ContactSyncService.getInstance());

  // Memoized selectors for better performance
  const contacts = state.contacts;
  const isLoading = state.isLoading;
  const isSyncing = state.isSyncing;
  const lastSyncTimestamp = state.lastSyncTimestamp;

  // Optimized contact selectors
  const favoriteContacts = useMemo(() => 
    contacts.filter(contact => contact.isFavorite), 
    [contacts]
  );

  const vipContacts = useMemo(() => 
    contacts.filter(contact => contact.isVIP), 
    [contacts]
  );

  const contactsByGroup = useMemo(() => {
    const grouped = contacts.reduce((acc, contact) => {
      const group = contact.group || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(contact);
      return acc;
    }, {} as Record<string, Contact[]>);
    return grouped;
  }, [contacts]);

  const recentContacts = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return contacts
      .filter(contact => {
        const lastInteraction = contact.history?.[contact.history.length - 1];
        if (!lastInteraction) return false;
        return new Date(lastInteraction.timestamp) > thirtyDaysAgo;
      })
      .sort((a, b) => {
        const aLast = a.history?.[a.history.length - 1]?.timestamp || '';
        const bLast = b.history?.[b.history.length - 1]?.timestamp || '';
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });
  }, [contacts]);

  // Load contacts from AsyncStorage on mount
  useEffect(() => {
    const loadContacts = async () => {
      performanceMonitor.start('load_contacts');
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        const syncData = await AsyncStorage.getItem('lastSyncTimestamp');
        
        if (data) {
          const parsedContacts = JSON.parse(data);
          console.log('Loaded contacts from storage:', parsedContacts.length, 'contacts');
          
          // Optimize contact data for better performance
          const optimizedContacts = memoryOptimization.optimizeContactData(parsedContacts);
          
          // Check for contacts with images
          const contactsWithImages = optimizedContacts.filter((c: Contact) => c.imageUri);
          console.log('Contacts with images:', contactsWithImages.length);
          
          // Validate the parsed data to ensure it has the correct structure
          if (Array.isArray(optimizedContacts)) {
            dispatch({ type: 'SET_CONTACTS', payload: optimizedContacts });
          }
        }
        
        if (syncData) {
          dispatch({ type: 'SET_LAST_SYNC', payload: parseInt(syncData) });
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        performanceMonitor.end('load_contacts');
      }
    };
    
    loadContacts();
  }, []);

  // Save contacts to AsyncStorage on change - debounced to reduce frequency
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        performanceMonitor.start('save_contacts');
        try {
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
          performanceMonitor.end('save_contacts');
        } catch (error) {
          console.error('Error saving contacts:', error);
        }
      }, 2000); // Increased debounce to 2 seconds for better performance
      
      return () => clearTimeout(timeoutId);
    }
  }, [contacts, isLoading]);

  // Save sync timestamp to AsyncStorage on change - debounced
  useEffect(() => {
    if (lastSyncTimestamp !== null) {
      const timeoutId = setTimeout(() => {
        try {
          AsyncStorage.setItem('lastSyncTimestamp', lastSyncTimestamp.toString());
        } catch (error) {
          console.error('Error saving sync timestamp:', error);
        }
      }, 1000); // Increased debounce to 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [lastSyncTimestamp]);

  // Background sync effect - runs periodically to ensure all contacts are synced
  useEffect(() => {
    if (isLoading || contacts.length === 0) return;

    const performBackgroundSync = async () => {
      try {
        // Check if auto-sync is enabled
        const settings = contactSyncService.getSettings();
        if (!settings.autoSync) return;

        // Check permissions
        const hasPermission = await contactSyncService.checkPermissions();
        if (!hasPermission) return;

        console.log('🔄 Performing background sync...');
        
        // Sync all contacts to system
        const result = await contactSyncService.syncAllToSystem(contacts);
        
        if (result.success) {
          console.log(`✅ Background sync completed: ${result.syncedCount} contacts synced`);
          dispatch({ type: 'SET_LAST_SYNC', payload: Date.now() });
        } else {
          console.log(`⚠️ Background sync completed with errors: ${result.failedCount} failed`);
        }
      } catch (error) {
        console.log('Background sync failed (non-critical):', error);
      }
    };

    // Run initial sync after a delay
    const initialSyncTimeout = setTimeout(performBackgroundSync, 5000);

    // Set up periodic sync (every 30 minutes)
    const periodicSyncInterval = setInterval(performBackgroundSync, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialSyncTimeout);
      clearInterval(periodicSyncInterval);
    };
  }, [contacts, isLoading, contactSyncService]);

  // Show sync notification on first contact add
  const [hasShownSyncNotification, setHasShownSyncNotification] = useState(false);

  const addContact = useCallback(async (contact: Omit<Contact, 'id' | 'isFavorite' | 'isVIP' | 'history' | 'createdAt' | 'updatedAt'>) => {
    performanceMonitor.start('add_contact');
    
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString(),
      isFavorite: false,
      isVIP: false,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Create contact in local storage
      dispatch({ type: 'ADD_CONTACT', payload: newContact });
      
      // Trigger automation features
      triggerAutomationFeatures(newContact);
      
      // Auto-sync to system contacts (background)
      try {
        await contactSyncService.autoSyncContact(newContact, 'add');
        
        // Show sync notification on first contact (if not shown before)
        if (!hasShownSyncNotification) {
          setHasShownSyncNotification(true);
          // Note: In a real app, you'd show a toast notification here
          console.log('🎉 Contact automatically synced to system contacts! Available in WhatsApp, SMS, and other apps.');
        }
      } catch (syncError) {
        console.log('Background sync failed (non-critical):', syncError);
      }
      
      // Create in Google Contacts if signed in
      if (isSignedIn && createGoogleContact) {
        try {
          await createGoogleContact(newContact);
        } catch (error) {
          console.error('Error creating Google contact:', error);
        }
      }
      
      performanceMonitor.end('add_contact');
    } catch (error) {
      console.error('Error adding contact:', error);
      performanceMonitor.end('add_contact');
    }
  }, [isSignedIn, createGoogleContact, contactSyncService, hasShownSyncNotification]);

  const editContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    performanceMonitor.start('edit_contact');
    
    try {
      // Update in local storage
      dispatch({ type: 'UPDATE_CONTACT', payload: { id, updates } });
      
      // Get the updated contact for sync
      const updatedContact = contacts.find(c => c.id === id);
      if (updatedContact) {
        // Auto-sync to system contacts (background)
        try {
          await contactSyncService.autoSyncContact(updatedContact, 'update');
        } catch (syncError) {
          console.log('Background sync failed (non-critical):', syncError);
        }
      }
      
      // Update in Google Contacts if signed in
      if (isSignedIn && updateGoogleContact) {
        try {
          const contact = contacts.find(c => c.id === id);
          if (contact) {
            await updateGoogleContact(contact.googleResourceName || '', { ...contact, ...updates });
          }
        } catch (error) {
          console.error('Error updating Google contact:', error);
        }
      }
      
      performanceMonitor.end('edit_contact');
    } catch (error) {
      console.error('Error editing contact:', error);
      performanceMonitor.end('edit_contact');
    }
  }, [contacts, isSignedIn, updateGoogleContact, contactSyncService]);

  const deleteContact = useCallback(async (id: string) => {
    performanceMonitor.start('delete_contact');
    
    try {
      // Get the contact before deleting for sync
      const contactToDelete = contacts.find(c => c.id === id);
      
      // Delete from local storage
      dispatch({ type: 'DELETE_CONTACT', payload: id });
      
      // Auto-sync to system contacts (background)
      if (contactToDelete) {
        try {
          await contactSyncService.autoSyncContact(contactToDelete, 'delete');
        } catch (syncError) {
          console.log('Background sync failed (non-critical):', syncError);
        }
      }
      
      // Delete from Google Contacts if signed in
      if (isSignedIn && deleteGoogleContact) {
        try {
          await deleteGoogleContact(id);
        } catch (error) {
          console.error('Error deleting Google contact:', error);
        }
      }
      
      performanceMonitor.end('delete_contact');
    } catch (error) {
      console.error('Error deleting contact:', error);
      performanceMonitor.end('delete_contact');
    }
  }, [contacts, isSignedIn, deleteGoogleContact, contactSyncService]);

  const toggleFavorite = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
  }, []);

  const toggleVIP = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_VIP', payload: id });
  }, []);

  const addHistoryEvent = useCallback((id: string, event: InteractionHistoryItem) => {
    dispatch({ type: 'ADD_HISTORY', payload: { id, event } });
  }, []);

  // Optimized search function
  const searchContacts = useCallback((query: string) => {
    if (!query.trim()) return contacts;
    
    const searchTerm = query.toLowerCase();
    return contacts.filter(contact => {
      // Name search (highest priority)
      if (contact.name?.toLowerCase().includes(searchTerm)) return true;
      
      // Company search
      if (contact.company?.toLowerCase().includes(searchTerm)) return true;
      
      // Phone search
      if (contact.phoneNumbers?.some(phone => phone.number.includes(searchTerm))) return true;
      
      // Email search
      if (contact.emailAddresses?.some(email => email.email.toLowerCase().includes(searchTerm))) return true;
      
      return false;
    });
  }, [contacts]);

  // Import contacts (e.g., from device)
  const importContacts = useCallback(async (imported: Omit<Contact, 'id' | 'isFavorite' | 'isVIP' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    const newContacts = imported.map(c => ({ 
      ...c, 
      id: Date.now().toString() + Math.random(), 
      isFavorite: false,
      isVIP: false,
      createdAt: now,
      updatedAt: now
    }));
    
    dispatch({ type: 'SET_CONTACTS', payload: [...newContacts, ...contacts] });
    
    // Auto-sync imported contacts to system contacts (background)
    try {
      for (const contact of newContacts) {
        await contactSyncService.autoSyncContact(contact, 'add');
      }
    } catch (syncError) {
      console.log('Background sync of imported contacts failed (non-critical):', syncError);
    }
  }, [contacts, contactSyncService]);

  // Merge two contacts
  const mergeContacts = useCallback((contact1Id: string, contact2Id: string): Contact => {
    const contact1 = contacts.find(c => c.id === contact1Id);
    const contact2 = contacts.find(c => c.id === contact2Id);
    
    if (!contact1 || !contact2) {
      throw new Error('One or both contacts not found');
    }
    
    // Merge phone numbers
    const mergedPhones = [...(contact1.phoneNumbers || [])];
    contact2.phoneNumbers?.forEach(phone2 => {
      const exists = mergedPhones.some(phone1 => 
        phone1.number.replace(/\D/g, '') === phone2.number.replace(/\D/g, '')
      );
      if (!exists) {
        mergedPhones.push(phone2);
      }
    });
    
    // Merge email addresses
    const mergedEmails = [...(contact1.emailAddresses || [])];
    contact2.emailAddresses?.forEach(email2 => {
      const exists = mergedEmails.some(email1 => 
        email1.email.toLowerCase() === email2.email.toLowerCase()
      );
      if (!exists) {
        mergedEmails.push(email2);
      }
    });
    
    // Merge other fields (prefer non-empty values)
    const mergedContact: Contact = {
      id: contact1.id,
      name: contact1.name || contact2.name,
      firstName: contact1.firstName || contact2.firstName,
      lastName: contact1.lastName || contact2.lastName,
      company: contact1.company || contact2.company,
      jobTitle: contact1.jobTitle || contact2.jobTitle,
      phoneNumbers: mergedPhones,
      emailAddresses: mergedEmails,
      businessType: contact1.businessType || contact2.businessType,
      address: contact1.address || contact2.address,
      socialMedia: contact1.socialMedia || contact2.socialMedia,
      website: contact1.website || contact2.website,
      birthday: contact1.birthday || contact2.birthday,
      anniversary: contact1.anniversary || contact2.anniversary,
      isFavorite: contact1.isFavorite || contact2.isFavorite,
      isVIP: contact1.isVIP || contact2.isVIP,
      group: contact1.group || contact2.group,
      notes: contact1.notes || contact2.notes,
      history: [
        ...(contact1.history || []),
        ...(contact2.history || []),
        {
          id: `merge-${Date.now()}`,
          type: 'custom',
          note: `Merged with ${contact2.name}`,
          timestamp: new Date().toISOString(),
          source: 'manual',
          metadata: { originalType: 'merge' }
        }
      ],
      imageUri: contact1.imageUri || contact2.imageUri,
      isEmergencyContact: contact1.isEmergencyContact || contact2.isEmergencyContact,
      emergencyContact: contact1.emergencyContact || contact2.emergencyContact,
      labels: [...new Set([...(contact1.labels || []), ...(contact2.labels || [])])],
      createdAt: contact1.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    // Remove the second contact and update the first
    const updatedContacts = contacts.filter(c => c.id !== contact2Id);
    const finalContacts = updatedContacts.map(c => 
      c.id === contact1Id ? mergedContact : c
    );
    
    dispatch({ type: 'SET_CONTACTS', payload: finalContacts });
    return mergedContact;
  }, [contacts]);

  // Find duplicate contacts
  const findDuplicates = useCallback((): { contact1: Contact; contact2: Contact; similarity: number; reason: string }[] => {
    const duplicates: { contact1: Contact; contact2: Contact; similarity: number; reason: string }[] = [];
    
    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const contact1 = contacts[i];
        const contact2 = contacts[j];
        
        let similarity = 0;
        let reasons: string[] = [];
        
        // Name similarity
        const name1 = contact1.name.toLowerCase();
        const name2 = contact2.name.toLowerCase();
        if (name1 === name2) {
          similarity += 40;
          reasons.push('Exact name match');
        } else if (name1.includes(name2) || name2.includes(name1)) {
          similarity += 30;
          reasons.push('Similar names');
        }
        
        // Phone number similarity
        const phones1 = contact1.phoneNumbers?.map(p => p.number.replace(/\D/g, '')) || [];
        const phones2 = contact2.phoneNumbers?.map(p => p.number.replace(/\D/g, '')) || [];
        
        const phoneMatch = phones1.some(phone1 => 
          phones2.some(phone2 => phone1 === phone2 || phone1.includes(phone2) || phone2.includes(phone1))
        );
        
        if (phoneMatch) {
          similarity += 35;
          reasons.push('Matching phone numbers');
        }
        
        // Email similarity
        const emails1 = contact1.emailAddresses?.map(e => e.email.toLowerCase()) || [];
        const emails2 = contact2.emailAddresses?.map(e => e.email.toLowerCase()) || [];
        
        const emailMatch = emails1.some(email1 => 
          emails2.some(email2 => email1 === email2)
        );
        
        if (emailMatch) {
          similarity += 25;
          reasons.push('Matching email addresses');
        }
        
        // Company similarity
        if (contact1.company && contact2.company) {
          const company1 = contact1.company.toLowerCase();
          const company2 = contact2.company.toLowerCase();
          if (company1 === company2) {
            similarity += 15;
            reasons.push('Same company');
          }
        }
        
        if (similarity >= 50) {
          duplicates.push({
            contact1,
            contact2,
            similarity,
            reason: reasons.join(', ')
          });
        }
      }
    }
    
    return duplicates.sort((a, b) => b.similarity - a.similarity);
  }, [contacts]);

  // Get contact statistics
  const getContactStats = useCallback(() => {
    const groups = contacts.reduce((acc, contact) => {
      acc[contact.group] = (acc[contact.group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recent = contacts.filter(c => {
      const updated = new Date(c.updatedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return updated > weekAgo;
    }).length;

    return {
      total: contacts.length,
      favorites: contacts.filter(c => c.isFavorite).length,
      vip: contacts.filter(c => c.isVIP).length,
      groups,
      recent
    };
  }, [contacts]);

  // Automation features integration
  const triggerAutomationFeatures = useCallback(async (contact: Contact) => {
    try {
      // Auto-tagging
      const tags = await taggingService.autoTagContact(contact);
      if (tags.length > 0) {
        // Convert tags to strings safely
        const tagStrings = tags.map(tag => String(tag));
        dispatch({ 
          type: 'UPDATE_CONTACT', 
          payload: { 
            id: contact.id, 
            updates: { labels: [...(contact.labels || []), ...tagStrings] } 
          } 
        });
      }

      // Smart reminders
      const reminders = await remindersService.getReminders();
      console.log('Generated reminders:', reminders);

      // Location-based features
      if (contact.address) {
        const locationData = await geoService.getCurrentLocation();
        if (locationData) {
          dispatch({ 
            type: 'UPDATE_CONTACT', 
            payload: { 
              id: contact.id, 
              updates: { 
                history: [...(contact.history || []), {
                  id: Date.now().toString(),
                  type: 'visit',
                  location: locationData,
                  timestamp: new Date().toISOString(),
                  source: 'auto'
                }] 
              } 
            } 
          });
        }
      }
    } catch (error) {
      console.error('Error triggering automation features:', error);
    }
  }, [taggingService, remindersService, geoService]);

  const runBatchAutomation = useCallback(async () => {
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      // Process contacts in batches for better performance
      const batchSize = 10;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        await Promise.all(batch.map(contact => triggerAutomationFeatures(contact)));
        
        // Small delay to prevent blocking the UI
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error running batch automation:', error);
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [contacts, triggerAutomationFeatures]);

  const getAutomationServices = useCallback(() => ({
    remindersService,
    taggingService,
    messagingService,
    geoService,
  }), [remindersService, taggingService, messagingService, geoService]);

  // Google Contacts sync
  const syncGoogleContacts = useCallback(async (forceSync: boolean = false) => {
    if (!isSignedIn || !getContacts) {
      console.log('Not signed in to Google or getContacts not available');
      return;
    }

    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      const googleContacts = await getContacts();
      console.log('Fetched Google contacts:', googleContacts.length);

      // Process Google contacts
      const onContactProcessed = (googleContact: Contact) => {
        // Check if contact already exists
        const existingContact = contacts.find(c => 
          c.googleResourceName === googleContact.googleResourceName ||
          c.emailAddresses?.some(e => 
            googleContact.emailAddresses?.some(ge => ge.email === e.email)
          )
        );

        if (existingContact) {
          // Update existing contact
          dispatch({ 
            type: 'UPDATE_CONTACT', 
            payload: { 
              id: existingContact.id, 
              updates: { 
                ...googleContact,
                id: existingContact.id, // Preserve local ID
                isFavorite: existingContact.isFavorite, // Preserve local flags
                isVIP: existingContact.isVIP,
                history: existingContact.history, // Preserve local history
                createdAt: existingContact.createdAt, // Preserve creation date
              } 
            } 
          });
        } else {
          // Add new contact
          dispatch({ type: 'ADD_CONTACT', payload: googleContact });
        }
      };

      // Process contacts in batches
      const batchSize = 20;
      for (let i = 0; i < googleContacts.length; i += batchSize) {
        const batch = googleContacts.slice(i, i + batchSize);
        batch.forEach(onContactProcessed);
        
        // Small delay to prevent blocking the UI
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      dispatch({ type: 'SET_LAST_SYNC', payload: Date.now() });
      console.log('Google contacts sync completed');
    } catch (error) {
      console.error('Error syncing Google contacts:', error);
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [isSignedIn, getContacts, contacts]);

  const contextValue = useMemo(() => ({
    contacts,
    isLoading,
    isSyncing,
    lastSyncTimestamp,
    addContact,
    editContact,
    deleteContact,
    toggleFavorite,
    toggleVIP,
    importContacts,
    syncGoogleContacts,
    setContacts: (contacts: Contact[]) => dispatch({ type: 'SET_CONTACTS', payload: contacts }),
    addHistoryEvent,
    mergeContacts,
    findDuplicates,
    getContactStats,
    searchContacts,
    getContactsByGroup: (group: string) => contactsByGroup[group] || [],
    getFavoriteContacts: () => favoriteContacts,
    getVIPContacts: () => vipContacts,
    getRecentContacts: (days: number = 30) => recentContacts,
    runBatchAutomation,
    getAutomationServices,
  }), [
    contacts,
    isLoading,
    isSyncing,
    lastSyncTimestamp,
    addContact,
    editContact,
    deleteContact,
    toggleFavorite,
    toggleVIP,
    importContacts,
    syncGoogleContacts,
    addHistoryEvent,
    mergeContacts,
    findDuplicates,
    getContactStats,
    searchContacts,
    contactsByGroup,
    favoriteContacts,
    vipContacts,
    recentContacts,
    runBatchAutomation,
    getAutomationServices,
  ]);

  return (
    <ContactsContext.Provider value={contextValue}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
} 