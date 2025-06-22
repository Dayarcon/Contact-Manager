import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import AutoTaggingService from '../services/AutoTaggingService';
import GeoLocationService from '../services/GeoLocationService';
import ScheduledMessagingService from '../services/ScheduledMessagingService';
import SmartRemindersService from '../services/SmartRemindersService';

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
  history?: { type: string; detail: string; date: string }[];
  imageUri?: string;
  isEmergencyContact?: boolean;
  emergencyContact?: string;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
};

interface ContactsContextType {
  contacts: Contact[];
  isLoading: boolean;
  addContact: (contact: Omit<Contact, 'id' | 'isFavorite' | 'isVIP' | 'history' | 'createdAt' | 'updatedAt'>) => void;
  editContact: (id: string, updated: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleVIP: (id: string) => void;
  importContacts: (imported: Omit<Contact, 'id' | 'isFavorite' | 'isVIP' | 'createdAt' | 'updatedAt'>[]) => void;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  addHistoryEvent: (id: string, event: { type: string; detail: string; date: string }) => void;
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

const mockContacts: Contact[] = [
  { 
    id: '1', 
    name: 'Alice Johnson', 
    firstName: 'Alice',
    lastName: 'Johnson',
    company: 'TechCorp',
    jobTitle: 'Software Engineer',
    phoneNumbers: [
      { id: '1-1', number: '123-456-7890', type: 'mobile', isPrimary: true },
      { id: '1-2', number: '123-456-7891', type: 'work', isPrimary: false }
    ],
    emailAddresses: [
      { id: '1-1', email: 'alice@techcorp.com', type: 'work', isPrimary: true },
      { id: '1-2', email: 'alice.johnson@gmail.com', type: 'personal', isPrimary: false }
    ],
    businessType: 'Tech', 
    address: '123 Main St, San Francisco, CA', 
    socialMedia: '@alice_tech', 
    website: 'https://alicejohnson.dev',
    birthday: '1990-05-15',
    isFavorite: false, 
    isVIP: true,
    group: 'Work',
    labels: ['Developer', 'Tech'],
    history: [
      { type: 'call', detail: 'Called about project collaboration', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { type: 'email', detail: 'Sent project proposal', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { type: 'meeting', detail: 'Team sync meeting', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { type: 'note', detail: 'Great technical skills, good team player', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  { 
    id: '2', 
    name: 'Bob Smith', 
    firstName: 'Bob',
    lastName: 'Smith',
    company: 'Finance Inc',
    jobTitle: 'Financial Analyst',
    phoneNumbers: [
      { id: '2-1', number: '987-654-3210', type: 'mobile', isPrimary: true }
    ],
    emailAddresses: [
      { id: '2-1', email: 'bob.smith@finance.com', type: 'work', isPrimary: true }
    ],
    businessType: 'Finance', 
    address: '456 Oak Ave, New York, NY', 
    socialMedia: '@bob_finance', 
    isFavorite: true, 
    isVIP: false,
    group: 'Family',
    isEmergencyContact: true,
    emergencyContact: 'Emergency contact for family',
    labels: ['Family', 'Emergency'],
    history: [
      { type: 'call', detail: 'Called to check in', date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
      { type: 'message', detail: 'Sent birthday wishes', date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
      { type: 'birthday', detail: 'Birthday celebration', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  { 
    id: '3', 
    name: 'Charlie Brown', 
    firstName: 'Charlie',
    lastName: 'Brown',
    company: 'Retail Store',
    jobTitle: 'Store Manager',
    phoneNumbers: [
      { id: '3-1', number: '555-555-5555', type: 'work', isPrimary: true },
      { id: '3-2', number: '555-555-5556', type: 'home', isPrimary: false }
    ],
    emailAddresses: [
      { id: '3-1', email: 'charlie@retailstore.com', type: 'work', isPrimary: true }
    ],
    businessType: 'Retail', 
    address: '789 Pine Rd, Chicago, IL', 
    socialMedia: '@charlie_retail', 
    isFavorite: false, 
    isVIP: false,
    group: 'Client',
    labels: ['Client', 'Retail'],
    history: [
      { type: 'email', detail: 'Sent invoice for services', date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
      { type: 'meeting', detail: 'Business review meeting', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  { 
    id: '4', 
    name: 'Diana Prince', 
    firstName: 'Diana',
    lastName: 'Prince',
    company: 'Legal Associates',
    jobTitle: 'Attorney',
    phoneNumbers: [
      { id: '4-1', number: '111-222-3333', type: 'work', isPrimary: true },
      { id: '4-2', number: '111-222-3334', type: 'mobile', isPrimary: false }
    ],
    emailAddresses: [
      { id: '4-1', email: 'diana@legalassociates.com', type: 'work', isPrimary: true }
    ],
    businessType: 'Legal', 
    address: '100 Justice Ave, Washington, DC', 
    socialMedia: '@diana_legal', 
    isFavorite: true, 
    isVIP: true,
    group: 'Work',
    labels: ['Legal', 'Professional'],
    history: [
      { type: 'call', detail: 'Legal consultation call', date: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { type: 'email', detail: 'Sent legal documents', date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
      { type: 'meeting', detail: 'Contract review meeting', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { type: 'note', detail: 'Excellent legal expertise, very professional', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  { 
    id: '5', 
    name: 'Ethan Hunt', 
    firstName: 'Ethan',
    lastName: 'Hunt',
    company: 'Security Solutions',
    jobTitle: 'Security Specialist',
    phoneNumbers: [
      { id: '5-1', number: '222-333-4444', type: 'mobile', isPrimary: true }
    ],
    emailAddresses: [
      { id: '5-1', email: 'ethan@securitysolutions.com', type: 'work', isPrimary: true }
    ],
    businessType: 'Security', 
    address: '99 Mission St, Los Angeles, CA', 
    socialMedia: '@ethan_security', 
    isFavorite: false, 
    isVIP: false,
    group: 'Client',
    labels: ['Security', 'Client'],
    history: [
      { type: 'call', detail: 'Security consultation', date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
      { type: 'meeting', detail: 'Security assessment meeting', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        if (data) {
          const parsedContacts = JSON.parse(data);
          // Validate the parsed data to ensure it has the correct structure
          if (Array.isArray(parsedContacts)) {
            setContacts(parsedContacts);
          }
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

  const addContact = (contact: Omit<Contact, 'id' | 'isFavorite' | 'isVIP' | 'history' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString(),
      isFavorite: false,
      isVIP: false,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setContacts(prev => {
      const updated = [...prev, newContact];
      
      // Trigger automation features
      triggerAutomationFeatures(newContact);
      
      return updated;
    });
  };

  const editContact = (id: string, updated: Partial<Contact>) => {
    setContacts(prev => {
      const updatedContacts = prev.map(contact => 
        contact.id === id 
          ? { ...contact, ...updated, updatedAt: new Date().toISOString() }
          : contact
      );
      
      // Trigger automation features for updated contact
      const updatedContact = updatedContacts.find(c => c.id === id);
      if (updatedContact) {
        triggerAutomationFeatures(updatedContact);
      }
      
      return updatedContacts;
    });
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
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
  const addHistoryEvent = (id: string, event: { type: string; detail: string; date: string }) => {
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
          type: 'merge',
          detail: `Merged with ${contact2.name}`,
          date: new Date().toISOString()
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

  // Search contacts
  const searchContacts = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.firstName?.toLowerCase().includes(lowerQuery) ||
      contact.lastName?.toLowerCase().includes(lowerQuery) ||
      contact.company?.toLowerCase().includes(lowerQuery) ||
      contact.jobTitle?.toLowerCase().includes(lowerQuery) ||
      (contact.phoneNumbers || []).some(p => p.number.includes(query)) ||
      (contact.emailAddresses || []).some(e => e.email.toLowerCase().includes(lowerQuery)) ||
      contact.notes?.toLowerCase().includes(lowerQuery)
    );
  };

  // Get contacts by group
  const getContactsByGroup = (group: string) => {
    return contacts.filter(c => c.group === group);
  };

  // Get favorite contacts
  const getFavoriteContacts = () => {
    return contacts.filter(c => c.isFavorite);
  };

  // Get VIP contacts
  const getVIPContacts = () => {
    return contacts.filter(c => c.isVIP);
  };

  // Get recent contacts
  const getRecentContacts = (days: number = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return contacts.filter(c => new Date(c.updatedAt) > cutoff);
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

  // Create the context value with all functions properly defined
  const contextValue: ContactsContextType = {
    contacts,
    isLoading,
    addContact,
    editContact,
    deleteContact,
    toggleFavorite,
    toggleVIP,
    importContacts,
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
      addContact: () => console.warn('ContactsProvider not available'),
      editContact: () => console.warn('ContactsProvider not available'),
      deleteContact: () => console.warn('ContactsProvider not available'),
      toggleFavorite: () => console.warn('ContactsProvider not available'),
      toggleVIP: () => console.warn('ContactsProvider not available'),
      importContacts: () => console.warn('ContactsProvider not available'),
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