import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import AutoTaggingService from '../services/AutoTaggingService';
import GeoLocationService from '../services/GeoLocationService';
import ScheduledMessagingService from '../services/ScheduledMessagingService';
import SmartRemindersService from '../services/SmartRemindersService';
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
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
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

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

const STORAGE_KEY = 'contacts';

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isSignedIn, createGoogleContact, updateGoogleContact, deleteGoogleContact, getContacts } = useGoogleAuth();

  // Initialize automation services
  const [remindersService] = useState(() => SmartRemindersService.getInstance());
  const [taggingService] = useState(() => AutoTaggingService.getInstance());
  const [messagingService] = useState(() => ScheduledMessagingService.getInstance());
  const [geoService] = useState(() => GeoLocationService.getInstance());

  // Load contacts from AsyncStorage on mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        const syncData = await AsyncStorage.getItem('lastSyncTimestamp');
        
        if (data) {
          const parsedContacts = JSON.parse(data);
          console.log('Loaded contacts from storage:', parsedContacts.length, 'contacts');
          
          // Check for contacts with images
          const contactsWithImages = parsedContacts.filter((c: Contact) => c.imageUri);
          console.log('Contacts with images:', contactsWithImages.length);
          contactsWithImages.forEach((c: Contact) => {
            console.log('Contact with image:', c.name, 'URI:', c.imageUri);
          });
          
          // Validate the parsed data to ensure it has the correct structure
          if (Array.isArray(parsedContacts)) {
            setContacts(parsedContacts);
          }
        }
        
        if (syncData) {
          setLastSyncTimestamp(parseInt(syncData));
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
        // Keep using mock contacts if there's an error
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContacts();
  }, []);

  // Save contacts to AsyncStorage on change
  useEffect(() => {
    if (!isLoading) {
      try {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
      } catch (error) {
        console.error('Error saving contacts:', error);
      }
    }
  }, [contacts, isLoading]);

  // Save sync timestamp to AsyncStorage on change
  useEffect(() => {
    if (lastSyncTimestamp !== null) {
      try {
        AsyncStorage.setItem('lastSyncTimestamp', lastSyncTimestamp.toString());
      } catch (error) {
        console.error('Error saving sync timestamp:', error);
      }
    }
  }, [lastSyncTimestamp]);

  const addContact = async (contact: Omit<Contact, 'id' | 'isFavorite' | 'isVIP' | 'history' | 'createdAt' | 'updatedAt'>) => {
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
      setContacts(prev => {
        const updated = [...prev, newContact];
        triggerAutomationFeatures(newContact);
        return updated;
      });

      // If signed in to Google, create contact in Google
      if (isSignedIn) {
        const googleContact = await createGoogleContact(newContact);
        // Store Google resource name for future updates
        setContacts(prev => prev.map(c => 
          c.id === newContact.id 
            ? { ...c, googleResourceName: googleContact.resourceName }
            : c
        ));
      }
    } catch (error: unknown) {
      console.error('Error adding contact:', error);
    }
  };

  const editContact = async (id: string, updates: Partial<Contact>) => {
    try {
      console.log('Editing contact:', id, 'Updates:', updates);
      
      setContacts(prev => {
        const updated = prev.map(contact => 
          contact.id === id 
            ? { ...contact, ...updates, updatedAt: new Date().toISOString() }
            : contact
        );
        
        // Log the updated contact to see if imageUri is preserved
        const updatedContact = updated.find(c => c.id === id);
        console.log('Updated contact:', updatedContact);
        
        // Trigger automation features for the updated contact
        if (updatedContact) {
          triggerAutomationFeatures(updatedContact);
        }
        
        return updated;
      });

      // If signed in to Google and contact has Google resource name, update in Google
      if (isSignedIn) {
        const contact = contacts.find(c => c.id === id);
        if (contact?.googleResourceName) {
          await updateGoogleContact(contact.googleResourceName, { ...contact, ...updates });
        }
      }
    } catch (error: unknown) {
      console.error('Error editing contact:', error);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const contactToDelete = contacts.find(c => c.id === id);
      
      // Delete from local storage
      setContacts(prev => prev.filter(c => c.id !== id));

      // If signed in to Google and contact has a Google resource name, delete from Google
      if (isSignedIn && contactToDelete?.googleResourceName) {
        await deleteGoogleContact(contactToDelete.googleResourceName);
      }
    } catch (error: unknown) {
      console.error('Error deleting contact:', error);
    }
  };

  const toggleFavorite = (id: string) => {
    setContacts(prev => prev.map(c => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)));
  };

  const toggleVIP = (id: string) => {
    setContacts(prev => prev.map(c => (c.id === id ? { ...c, isVIP: !c.isVIP } : c)));
  };

  // Import contacts (e.g., from device)
  const importContacts = (imported: Omit<Contact, 'id' | 'isFavorite' | 'isVIP' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    setContacts(prev => [
      ...imported.map(c => ({ 
        ...c, 
        id: Date.now().toString() + Math.random(), 
        isFavorite: false,
        isVIP: false,
        createdAt: now,
        updatedAt: now
      })),
      ...prev,
    ]);
  };

  // Add a history event (e.g., call, meeting)
  const addHistoryEvent = (id: string, event: InteractionHistoryItem) => {
    setContacts(prev =>
      prev.map(c =>
        c.id === id
          ? { 
              ...c, 
              history: [event, ...(c.history || [])],
              updatedAt: new Date().toISOString()
            }
          : c
      )
    );
  };

  // Merge two contacts
  const mergeContacts = (contact1Id: string, contact2Id: string): Contact => {
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
    
    setContacts(finalContacts);
    return mergedContact;
  };

  // Find duplicate contacts
  const findDuplicates = (): { contact1: Contact; contact2: Contact; similarity: number; reason: string }[] => {
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
  };

  // Get contact statistics
  const getContactStats = () => {
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
  };

  // Helper function to sort contacts alphabetically by name
  const sortContactsAlphabetically = (contacts: Contact[]) => {
    return contacts.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  // Search contacts
  const searchContacts = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.firstName?.toLowerCase().includes(lowerQuery) ||
      contact.lastName?.toLowerCase().includes(lowerQuery) ||
      contact.company?.toLowerCase().includes(lowerQuery) ||
      contact.jobTitle?.toLowerCase().includes(lowerQuery) ||
      (contact.phoneNumbers || []).some(p => p.number.includes(query)) ||
      (contact.emailAddresses || []).some(e => e.email.toLowerCase().includes(lowerQuery)) ||
      contact.notes?.toLowerCase().includes(lowerQuery)
    );
    return sortContactsAlphabetically(filtered);
  };

  // Get contacts by group
  const getContactsByGroup = (group: string) => {
    const filtered = contacts.filter(c => c.group === group);
    return sortContactsAlphabetically(filtered);
  };

  // Get favorite contacts
  const getFavoriteContacts = () => {
    const filtered = contacts.filter(c => c.isFavorite);
    return sortContactsAlphabetically(filtered);
  };

  // Get VIP contacts
  const getVIPContacts = () => {
    const filtered = contacts.filter(c => c.isVIP);
    return sortContactsAlphabetically(filtered);
  };

  // Get recent contacts
  const getRecentContacts = (days: number = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = contacts.filter(c => new Date(c.updatedAt) > cutoff);
    return sortContactsAlphabetically(filtered);
  };

  // Automation features integration
  const triggerAutomationFeatures = async (contact: Contact) => {
    try {
      // Auto-tagging
      await taggingService.autoTagContact(contact);
      
      // Smart reminders for birthdays and anniversaries
      await remindersService.generateRemindersFromContacts([contact]);
      
      // Scheduled messaging for birthdays and anniversaries
      await messagingService.generateMessagesFromContacts([contact]);
      
      // Location tracking
      if (geoService.getCurrentLocation()) {
        await geoService.addGeoContact(contact, geoService.getCurrentLocation()!);
      }
    } catch (error) {
      console.error('Error triggering automation features:', error);
    }
  };

  // Batch automation for all contacts
  const runBatchAutomation = async () => {
    try {
      // Generate reminders for all contacts
      await remindersService.generateRemindersFromContacts(contacts);
      
      // Auto-tag all contacts
      for (const contact of contacts) {
        const suggestedTags = await taggingService.autoTagContact(contact);
        if (suggestedTags.length > 0) {
          const updatedLabels = [...(contact.labels || []), ...suggestedTags];
          editContact(contact.id, { labels: updatedLabels });
        }
      }
    } catch (error) {
      console.error('Error running batch automation:', error);
    }
  };

  // Get automation services for use in components
  const getAutomationServices = () => ({
    remindersService,
    taggingService,
    messagingService,
    geoService
  });

  // Sync Google Contacts
  const syncGoogleContacts = async (forceSync: boolean = false) => {
    try {
      if (!isSignedIn) {
        throw new Error('Not signed in to Google');
      }

      // Prevent multiple simultaneous syncs
      if (isSyncing) {
        console.log('Sync already in progress, skipping...');
        return;
      }

      // Check if sync is needed (unless forced)
      if (!forceSync && lastSyncTimestamp) {
        const timeSinceLastSync = Date.now() - lastSyncTimestamp;
        const syncCooldown = 5 * 60 * 1000; // 5 minutes cooldown
        
        if (timeSinceLastSync < syncCooldown) {
          console.log('Sync skipped - too soon since last sync');
          return;
        }
      }

      // Check if we already have Google contacts in local storage
      const existingGoogleContacts = contacts.filter(c => c.googleResourceName);
      const hasGoogleContacts = existingGoogleContacts.length > 0;

      // If we have Google contacts and this isn't a force sync, check if we really need to sync
      if (hasGoogleContacts && !forceSync) {
        console.log(`Found ${existingGoogleContacts.length} existing Google contacts, checking if sync is needed...`);
        
        // Only sync if it's been more than 30 minutes since last sync
        if (lastSyncTimestamp && (Date.now() - lastSyncTimestamp) < (30 * 60 * 1000)) {
          console.log('Google contacts are recent, skipping sync');
          return;
        }
      }

      setIsSyncing(true);
      console.log('Starting Google contacts sync...');

      const startTime = Date.now();
      
      // Create a map for faster lookups
      const existingGoogleResourceNames = new Set(
        contacts
          .filter(c => c.googleResourceName)
          .map(c => c.googleResourceName)
      );

      // Create a map of existing contacts for faster updates
      const existingContactsMap = new Map(
        contacts.map(contact => [contact.googleResourceName, contact])
      );

      let processedCount = 0;
      let newContactsCount = 0;
      let updatedCount = 0;

      // Process contacts progressively as they come in
      const onContactProcessed = (googleContact: Contact) => {
        processedCount++;
        
        if (existingContactsMap.has(googleContact.googleResourceName)) {
          // Update existing contact
          const existingContact = existingContactsMap.get(googleContact.googleResourceName)!;
          const shouldBeFavorite = googleContact.isFavorite !== existingContact.isFavorite;
          const shouldBeVIP = googleContact.isVIP !== existingContact.isVIP;
          
          if (shouldBeFavorite || shouldBeVIP) {
            updatedCount++;
            const updatedContact = {
              ...existingContact,
              isFavorite: googleContact.isFavorite,
              isVIP: googleContact.isVIP,
              updatedAt: new Date().toISOString()
            };
            
            // Update the contact in the map
            existingContactsMap.set(googleContact.googleResourceName, updatedContact);
            
            // Update the UI immediately
            setContacts(prev => 
              prev.map(c => 
                c.googleResourceName === googleContact.googleResourceName ? updatedContact : c
              )
            );
          }
        } else {
          // Add new contact
          newContactsCount++;
          
          // Add to the map
          existingContactsMap.set(googleContact.googleResourceName, googleContact);
          
          // Add to UI immediately
          setContacts(prev => [...prev, googleContact]);
        }
      };

      // Call getContacts with the callback for progressive loading
      const googleContacts = await (getContacts as any)(onContactProcessed);
      const fetchTime = Date.now() - startTime;
      console.log(`Fetched and processed ${googleContacts.length} contacts from Google in ${fetchTime}ms`);

      const processTime = Date.now() - startTime;

      if (newContactsCount > 0) {
        console.log(`✅ Imported ${newContactsCount} new contacts from Google in ${processTime}ms`);
      } else if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} existing contacts with new favorite/VIP status in ${processTime}ms`);
      } else {
        console.log(`✅ No changes needed - sync completed in ${processTime}ms`);
      }

      // Update sync timestamp
      setLastSyncTimestamp(Date.now());
      
    } catch (error) {
      console.error('Error syncing Google contacts:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // Create the context value with all functions properly defined
  const contextValue: ContactsContextType = {
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
    setContacts,
    addHistoryEvent,
    mergeContacts,
    findDuplicates,
    getContactStats,
    searchContacts,
    getContactsByGroup,
    getFavoriteContacts,
    getVIPContacts,
    getRecentContacts,
    runBatchAutomation,
    getAutomationServices
  };

  return (
    <ContactsContext.Provider value={contextValue}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (!context) {
    console.error('useContacts must be used within a ContactsProvider');
    // Return a safe fallback context to prevent crashes
    return {
      contacts: [],
      isLoading: true,
      isSyncing: false,
      lastSyncTimestamp: null,
      addContact: () => console.warn('ContactsProvider not available'),
      editContact: () => console.warn('ContactsProvider not available'),
      deleteContact: () => console.warn('ContactsProvider not available'),
      toggleFavorite: () => console.warn('ContactsProvider not available'),
      toggleVIP: () => console.warn('ContactsProvider not available'),
      importContacts: () => console.warn('ContactsProvider not available'),
      syncGoogleContacts: () => Promise.resolve(),
      setContacts: () => console.warn('ContactsProvider not available'),
      addHistoryEvent: () => console.warn('ContactsProvider not available'),
      mergeContacts: () => console.warn('ContactsProvider not available'),
      findDuplicates: () => [],
      getContactStats: () => ({ total: 0, favorites: 0, vip: 0, groups: {}, recent: 0 }),
      searchContacts: () => [],
      getContactsByGroup: () => [],
      getFavoriteContacts: () => [],
      getVIPContacts: () => [],
      getRecentContacts: () => [],
      runBatchAutomation: () => Promise.resolve(),
      getAutomationServices: () => ({
        remindersService: {} as SmartRemindersService,
        taggingService: {} as AutoTaggingService,
        messagingService: {} as ScheduledMessagingService,
        geoService: {} as GeoLocationService
      })
    };
  }
  return context;
} 