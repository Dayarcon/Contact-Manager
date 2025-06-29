import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import { Contact } from '../context/ContactsContext';

export interface SyncSettings {
  autoSync: boolean;
  syncOnAdd: boolean;
  syncOnUpdate: boolean;
  syncOnDelete: boolean;
  syncSelectedOnly: boolean;
  selectedContactIds: string[];
  syncFields: {
    name: boolean;
    phone: boolean;
    email: boolean;
    address: boolean;
    birthday: boolean;
    notes: boolean;
    photo: boolean;
  };
}

export interface SyncStats {
  totalContacts: number;
  syncedContacts: number;
  failedContacts: number;
  lastSyncTime: Date | null;
  syncDuration: number;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
  stats: SyncStats;
}

class ContactSyncService {
  private static instance: ContactSyncService;
  private syncSettings: SyncSettings;
  private syncStats: SyncStats;
  private isSyncing: boolean = false;

  private constructor() {
    this.syncSettings = {
      autoSync: true,
      syncOnAdd: true,
      syncOnUpdate: true,
      syncOnDelete: true,
      syncSelectedOnly: false,
      selectedContactIds: [],
      syncFields: {
        name: true,
        phone: true,
        email: true,
        address: true,
        birthday: true,
        notes: true,
        photo: true,
      },
    };
    this.syncStats = {
      totalContacts: 0,
      syncedContacts: 0,
      failedContacts: 0,
      lastSyncTime: null,
      syncDuration: 0,
    };
    this.loadSettings();
  }

  public static getInstance(): ContactSyncService {
    if (!ContactSyncService.instance) {
      ContactSyncService.instance = new ContactSyncService();
    }
    return ContactSyncService.instance;
  }

  // Check if contacts permission is granted
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking contacts permissions:', error);
      return false;
    }
  }

  // Request contacts permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting contacts permissions:', error);
      return false;
    }
  }

  // Get sync settings
  getSettings(): SyncSettings {
    return { ...this.syncSettings };
  }

  // Update sync settings
  async updateSettings(settings: Partial<SyncSettings>): Promise<void> {
    this.syncSettings = { ...this.syncSettings, ...settings };
    await this.saveSettings();
  }

  // Get sync statistics
  getStats(): SyncStats {
    return { ...this.syncStats };
  }

  // Check if contact exists in system contacts
  async contactExistsInSystem(contact: Contact): Promise<boolean> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) return false;

      const primaryPhone = contact.phoneNumbers?.find(p => p.isPrimary)?.number || 
                          contact.phoneNumbers?.[0]?.number;
      
      if (!primaryPhone) return false;

      const { data } = await Contacts.getContactsAsync({
        phoneNumbers: [primaryPhone],
      });

      return data.length > 0;
    } catch (error) {
      console.error('Error checking if contact exists:', error);
      return false;
    }
  }

  // Convert app contact to system contact format
  private convertToSystemContact(contact: Contact): Contacts.Contact {
    const systemContact: Contacts.Contact = {
      id: contact.id,
      name: contact.name,
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      company: contact.company || '',
      jobTitle: contact.jobTitle || '',
      notes: contact.notes || '',
      imageAvailable: !!contact.imageUri,
      image: contact.imageUri ? { uri: contact.imageUri } : undefined,
      phoneNumbers: [],
      emails: [],
      addresses: [],
      birthdays: [],
    };

    // Convert phone numbers
    if (contact.phoneNumbers) {
      systemContact.phoneNumbers = contact.phoneNumbers.map(phone => ({
        id: phone.id,
        number: phone.number,
        label: phone.type.toLowerCase(),
        isPrimary: phone.isPrimary,
      }));
    }

    // Convert email addresses
    if (contact.emailAddresses) {
      systemContact.emails = contact.emailAddresses.map(email => ({
        id: email.id,
        email: email.email,
        label: email.type.toLowerCase(),
        isPrimary: email.isPrimary,
      }));
    }

    // Convert addresses
    if (contact.addresses) {
      systemContact.addresses = contact.addresses.map(address => ({
        id: address.id,
        street: address.street || '',
        city: address.city || '',
        region: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || '',
        label: address.type.toLowerCase(),
      }));
    }

    // Convert birthday
    if (contact.birthday) {
      systemContact.birthdays = [{
        id: `birthday-${contact.id}`,
        day: contact.birthday.getDate(),
        month: contact.birthday.getMonth() + 1,
        year: contact.birthday.getFullYear(),
      }];
    }

    return systemContact;
  }

  // Convert system contact to app contact format
  private convertFromSystemContact(systemContact: Contacts.Contact): Contact {
    const contact: Contact = {
      id: systemContact.id || `system-${Date.now()}`,
      name: systemContact.name || '',
      firstName: systemContact.firstName || '',
      lastName: systemContact.lastName || '',
      company: systemContact.company || '',
      jobTitle: systemContact.jobTitle || '',
      notes: systemContact.notes || '',
      imageUri: systemContact.image?.uri,
      phoneNumbers: [],
      emailAddresses: [],
      addresses: [],
      birthday: undefined,
      group: '',
      isVIP: false,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Convert phone numbers
    if (systemContact.phoneNumbers) {
      contact.phoneNumbers = systemContact.phoneNumbers.map(phone => ({
        id: phone.id || `phone-${Date.now()}`,
        number: phone.number,
        type: phone.label.charAt(0).toUpperCase() + phone.label.slice(1),
        isPrimary: phone.isPrimary || false,
      }));
    }

    // Convert email addresses
    if (systemContact.emails) {
      contact.emailAddresses = systemContact.emails.map(email => ({
        id: email.id || `email-${Date.now()}`,
        email: email.email,
        type: email.label.charAt(0).toUpperCase() + email.label.slice(1),
        isPrimary: email.isPrimary || false,
      }));
    }

    // Convert addresses
    if (systemContact.addresses) {
      contact.addresses = systemContact.addresses.map(address => ({
        id: address.id || `address-${Date.now()}`,
        street: address.street || '',
        city: address.city || '',
        state: address.region || '',
        postalCode: address.postalCode || '',
        country: address.country || '',
        type: address.label.charAt(0).toUpperCase() + address.label.slice(1),
      }));
    }

    // Convert birthday
    if (systemContact.birthdays && systemContact.birthdays.length > 0) {
      const birthday = systemContact.birthdays[0];
      contact.birthday = new Date(birthday.year, birthday.month - 1, birthday.day);
    }

    return contact;
  }

  // Sync single contact to system
  async syncContactToSystem(contact: Contact): Promise<boolean> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permission not granted');
      }

      const systemContact = this.convertToSystemContact(contact);
      
      // Check if contact already exists
      const exists = await this.contactExistsInSystem(contact);
      
      if (exists) {
        // Update existing contact
        await Contacts.updateContactAsync(systemContact);
      } else {
        // Add new contact
        await Contacts.addContactAsync(systemContact);
      }

      return true;
    } catch (error) {
      console.error('Error syncing contact to system:', error);
      return false;
    }
  }

  // Sync single contact from system
  async syncContactFromSystem(contactId: string): Promise<Contact | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permission not granted');
      }

      const { data } = await Contacts.getContactsAsync({
        id: contactId,
      });

      if (data.length === 0) return null;

      return this.convertFromSystemContact(data[0]);
    } catch (error) {
      console.error('Error syncing contact from system:', error);
      return null;
    }
  }

  // Sync all contacts to system
  async syncAllToSystem(contacts: Contact[]): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permission not granted');
      }

      const contactsToSync = this.syncSettings.syncSelectedOnly
        ? contacts.filter(c => this.syncSettings.selectedContactIds.includes(c.id))
        : contacts;

      this.syncStats.totalContacts = contactsToSync.length;

      for (const contact of contactsToSync) {
        try {
          const success = await this.syncContactToSystem(contact);
          if (success) {
            syncedCount++;
          } else {
            failedCount++;
            errors.push(`Failed to sync contact: ${contact.name}`);
          }
        } catch (error) {
          failedCount++;
          errors.push(`Error syncing ${contact.name}: ${error}`);
        }
      }

      this.syncStats.syncedContacts = syncedCount;
      this.syncStats.failedContacts = failedCount;
      this.syncStats.lastSyncTime = new Date();
      this.syncStats.syncDuration = Date.now() - startTime;

      return {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        errors,
        stats: this.syncStats,
      };
    } catch (error) {
      this.syncStats.failedContacts = contacts.length;
      this.syncStats.lastSyncTime = new Date();
      this.syncStats.syncDuration = Date.now() - startTime;
      
      return {
        success: false,
        syncedCount: 0,
        failedCount: contacts.length,
        errors: [error.toString()],
        stats: this.syncStats,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync all contacts from system
  async syncAllFromSystem(): Promise<Contact[]> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permission not granted');
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Addresses,
          Contacts.Fields.Birthdays,
          Contacts.Fields.Company,
          Contacts.Fields.JobTitle,
          Contacts.Fields.Notes,
          Contacts.Fields.Image,
        ],
      });

      return data.map(contact => this.convertFromSystemContact(contact));
    } catch (error) {
      console.error('Error syncing contacts from system:', error);
      return [];
    }
  }

  // Delete contact from system
  async deleteContactFromSystem(contact: Contact): Promise<boolean> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permission not granted');
      }

      const exists = await this.contactExistsInSystem(contact);
      if (!exists) return true; // Contact doesn't exist in system

      const primaryPhone = contact.phoneNumbers?.find(p => p.isPrimary)?.number || 
                          contact.phoneNumbers?.[0]?.number;
      
      if (!primaryPhone) return false;

      const { data } = await Contacts.getContactsAsync({
        phoneNumbers: [primaryPhone],
      });

      if (data.length > 0) {
        await Contacts.deleteContactAsync(data[0]);
      }

      return true;
    } catch (error) {
      console.error('Error deleting contact from system:', error);
      return false;
    }
  }

  // Auto sync on contact changes
  async autoSyncContact(contact: Contact, action: 'add' | 'update' | 'delete'): Promise<void> {
    if (!this.syncSettings.autoSync) return;

    const shouldSync = (action === 'add' && this.syncSettings.syncOnAdd) ||
                      (action === 'update' && this.syncSettings.syncOnUpdate) ||
                      (action === 'delete' && this.syncSettings.syncOnDelete);

    if (!shouldSync) return;

    try {
      if (action === 'delete') {
        await this.deleteContactFromSystem(contact);
      } else {
        await this.syncContactToSystem(contact);
      }
    } catch (error) {
      console.error(`Error auto-syncing contact (${action}):`, error);
    }
  }

  // Get system contacts count
  async getSystemContactsCount(): Promise<number> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) return 0;

      const { data } = await Contacts.getContactsAsync();
      return data.length;
    } catch (error) {
      console.error('Error getting system contacts count:', error);
      return 0;
    }
  }

  // Find duplicates between app and system contacts
  async findDuplicates(appContacts: Contact[]): Promise<{
    appContact: Contact;
    systemContact: Contact;
    similarity: number;
  }[]> {
    const duplicates: {
      appContact: Contact;
      systemContact: Contact;
      similarity: number;
    }[] = [];

    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) return duplicates;

      const { data: systemContacts } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      for (const appContact of appContacts) {
        for (const systemContact of systemContacts) {
          const similarity = this.calculateSimilarity(appContact, systemContact);
          if (similarity > 0.7) { // 70% similarity threshold
            duplicates.push({
              appContact,
              systemContact: this.convertFromSystemContact(systemContact),
              similarity,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error finding duplicates:', error);
    }

    return duplicates;
  }

  // Calculate similarity between two contacts
  private calculateSimilarity(contact1: Contact, contact2: Contact): number {
    let score = 0;
    let totalChecks = 0;

    // Name similarity
    if (contact1.name && contact2.name) {
      const nameSimilarity = this.levenshteinDistance(contact1.name.toLowerCase(), contact2.name.toLowerCase());
      const maxLength = Math.max(contact1.name.length, contact2.name.length);
      score += (maxLength - nameSimilarity) / maxLength;
      totalChecks++;
    }

    // Phone number similarity
    const phone1 = contact1.phoneNumbers?.find(p => p.isPrimary)?.number || contact1.phoneNumbers?.[0]?.number;
    const phone2 = contact2.phoneNumbers?.find(p => p.isPrimary)?.number || contact2.phoneNumbers?.[0]?.number;
    
    if (phone1 && phone2) {
      const normalizedPhone1 = phone1.replace(/\D/g, '');
      const normalizedPhone2 = phone2.replace(/\D/g, '');
      if (normalizedPhone1 === normalizedPhone2) {
        score += 1;
      }
      totalChecks++;
    }

    // Email similarity
    const email1 = contact1.emailAddresses?.find(e => e.isPrimary)?.email || contact1.emailAddresses?.[0]?.email;
    const email2 = contact2.emailAddresses?.find(e => e.isPrimary)?.email || contact2.emailAddresses?.[0]?.email;
    
    if (email1 && email2 && email1.toLowerCase() === email2.toLowerCase()) {
      score += 1;
      totalChecks++;
    }

    return totalChecks > 0 ? score / totalChecks : 0;
  }

  // Levenshtein distance for string similarity
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Load settings from storage
  private async loadSettings(): Promise<void> {
    try {
      const settings = await AsyncStorage.getItem('contactSyncSettings');
      if (settings) {
        this.syncSettings = { ...this.syncSettings, ...JSON.parse(settings) };
      }

      const stats = await AsyncStorage.getItem('contactSyncStats');
      if (stats) {
        const parsedStats = JSON.parse(stats);
        this.syncStats = { ...this.syncStats, ...parsedStats };
        if (parsedStats.lastSyncTime) {
          this.syncStats.lastSyncTime = new Date(parsedStats.lastSyncTime);
        }
      }
    } catch (error) {
      console.error('Error loading sync settings:', error);
    }
  }

  // Save settings to storage
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('contactSyncSettings', JSON.stringify(this.syncSettings));
      await AsyncStorage.setItem('contactSyncStats', JSON.stringify(this.syncStats));
    } catch (error) {
      console.error('Error saving sync settings:', error);
    }
  }

  // Reset sync statistics
  async resetStats(): Promise<void> {
    this.syncStats = {
      totalContacts: 0,
      syncedContacts: 0,
      failedContacts: 0,
      lastSyncTime: null,
      syncDuration: 0,
    };
    await this.saveSettings();
  }

  // Check if sync is in progress
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export default ContactSyncService;
