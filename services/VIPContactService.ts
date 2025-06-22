import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VIPContactConfig {
  contactId: string;
  name: string;
  phoneNumber: string;
  isEnabled: boolean;
  bypassDND: boolean;
  bypassSilent: boolean;
  bypassVibration: boolean;
  emergencyBypass: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VIPSettings {
  enableNotifications: boolean;
  bypassDND: boolean;
  bypassSilent: boolean;
  bypassVibration: boolean;
  enableEmergencyBypass: boolean;
}

export interface VIPStats {
  totalVIP: number;
  withNotifications: number;
  recentInteractions: number;
}

class VIPContactService {
  private static instance: VIPContactService;
  private vipContacts: Map<string, VIPContactConfig> = new Map();
  private settings: VIPSettings = {
    enableNotifications: true,
    bypassDND: false,
    bypassSilent: false,
    bypassVibration: false,
    enableEmergencyBypass: false
  };

  private readonly VIP_CONTACTS_STORAGE_KEY = 'vip_contacts';
  private readonly VIP_SETTINGS_STORAGE_KEY = 'vip_settings';

  private constructor() {
    this.loadData();
  }

  static getInstance(): VIPContactService {
    if (!VIPContactService.instance) {
      VIPContactService.instance = new VIPContactService();
    }
    return VIPContactService.instance;
  }

  private async loadData() {
    try {
      const storedContacts = await AsyncStorage.getItem(this.VIP_CONTACTS_STORAGE_KEY);
      if (storedContacts) {
        const contactsArray = JSON.parse(storedContacts);
        this.vipContacts = new Map(Object.entries(contactsArray));
      }

      const storedSettings = await AsyncStorage.getItem(this.VIP_SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error('Error loading VIP data:', error);
    }
  }

  private async saveData() {
    try {
      const contactsObject = Object.fromEntries(this.vipContacts);
      await AsyncStorage.setItem(this.VIP_CONTACTS_STORAGE_KEY, JSON.stringify(contactsObject));
      await AsyncStorage.setItem(this.VIP_SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving VIP data:', error);
    }
  }

  async addVIPContact(contact: any): Promise<boolean> {
    try {
      const primaryPhone = contact.phoneNumbers?.find((p: any) => p.isPrimary)?.number || '';
      
      const vipConfig: VIPContactConfig = {
        contactId: contact.id,
        name: contact.name,
        phoneNumber: primaryPhone,
        isEnabled: true,
        bypassDND: this.settings.bypassDND,
        bypassSilent: this.settings.bypassSilent,
        bypassVibration: this.settings.bypassVibration,
        emergencyBypass: this.settings.enableEmergencyBypass,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.vipContacts.set(contact.id, vipConfig);
      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error adding VIP contact:', error);
      return false;
    }
  }

  async removeVIPContact(contactId: string): Promise<boolean> {
    try {
      this.vipContacts.delete(contactId);
      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error removing VIP contact:', error);
      return false;
    }
  }

  async updateVIPContact(contactId: string, updates: Partial<VIPContactConfig>): Promise<boolean> {
    try {
      const contact = this.vipContacts.get(contactId);
      if (contact) {
        const updatedContact = { ...contact, ...updates, updatedAt: new Date().toISOString() };
        this.vipContacts.set(contactId, updatedContact);
        await this.saveData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating VIP contact:', error);
      return false;
    }
  }

  async updateSettings(settings: Partial<VIPSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveData();
  }

  isVIPContact(contactId: string): boolean {
    return this.vipContacts.has(contactId);
  }

  getVIPContact(contactId: string): VIPContactConfig | null {
    return this.vipContacts.get(contactId) || null;
  }

  getVIPContacts(): VIPContactConfig[] {
    return Array.from(this.vipContacts.values());
  }

  getSettings(): VIPSettings {
    return { ...this.settings };
  }

  getStats(): VIPStats {
    const totalVIP = this.vipContacts.size;
    const withNotifications = Array.from(this.vipContacts.values()).filter(c => c.isEnabled).length;
    
    return {
      totalVIP,
      withNotifications,
      recentInteractions: 0 // This would be calculated from actual interaction data
    };
  }

  async handleIncomingCall(contactId: string): Promise<void> {
    const vipContact = this.vipContacts.get(contactId);
    if (!vipContact || !vipContact.isEnabled) return;

    // Log VIP call handling
    console.log(`VIP call from ${vipContact.name}:`, {
      bypassDND: vipContact.bypassDND,
      bypassSilent: vipContact.bypassSilent,
      bypassVibration: vipContact.bypassVibration,
      emergencyBypass: vipContact.emergencyBypass
    });

    // In a real app, this would integrate with the phone system
    // to actually bypass DND/silent modes
  }
}

export default VIPContactService; 