import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import VIPContactModule from '../native/VIPContactModule';

export interface VIPContactConfig {
  contactId: string;
  phoneNumber: string;
  name: string;
  enableNotifications: boolean;
  enableEmergencyBypass: boolean;
  customRingtone?: string;
  priorityLevel: 'high' | 'medium' | 'low';
  bypassDND: boolean;
  bypassSilent: boolean;
  bypassVibration: boolean;
}

export interface VIPNotificationSettings {
  sound: boolean;
  vibration: boolean;
  priority: 'high' | 'default' | 'low';
  bypassDND: boolean;
  showOnLockScreen: boolean;
}

class VIPContactService {
  private static instance: VIPContactService;
  private vipContacts: Map<string, VIPContactConfig> = new Map();
  private readonly STORAGE_KEY = 'vip_contacts_config';

  private constructor() {
    this.initializeNotifications();
    this.loadVIPConfig();
  }

  static getInstance(): VIPContactService {
    if (!VIPContactService.instance) {
      VIPContactService.instance = new VIPContactService();
    }
    return VIPContactService.instance;
  }

  private async initializeNotifications() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
    }
  }

  private async loadVIPConfig() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const configs = JSON.parse(stored);
        this.vipContacts = new Map(Object.entries(configs));
      }
    } catch (error) {
      console.error('Error loading VIP config:', error);
    }
  }

  private async saveVIPConfig() {
    try {
      const configs = Object.fromEntries(this.vipContacts);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Error saving VIP config:', error);
    }
  }

  // Add contact to VIP list with enhanced settings
  async addVIPContact(config: VIPContactConfig): Promise<boolean> {
    try {
      // Store VIP configuration
      this.vipContacts.set(config.contactId, config);
      await this.saveVIPConfig();

      // Set up system-level VIP if supported
      if (await VIPContactModule.isVIPContactsSupported()) {
        await VIPContactModule.addToSystemVIP(config.contactId, config.phoneNumber);
      }

      // Set up enhanced notifications
      if (config.enableNotifications) {
        await this.setupVIPNotifications(config);
      }

      // Set up emergency bypass if supported
      if (config.enableEmergencyBypass && await VIPContactModule.supportsEmergencyBypass()) {
        await VIPContactModule.enableEmergencyBypass(config.contactId, config.phoneNumber);
      }

      // Create custom notification channel for Android
      if (Platform.OS === 'android') {
        await this.createVIPNotificationChannel(config);
      }

      return true;
    } catch (error) {
      console.error('Error adding VIP contact:', error);
      return false;
    }
  }

  // Remove contact from VIP list
  async removeVIPContact(contactId: string): Promise<boolean> {
    try {
      const config = this.vipContacts.get(contactId);
      if (config) {
        // Remove from system VIP if supported
        if (await VIPContactModule.isVIPContactsSupported()) {
          await VIPContactModule.removeFromSystemVIP(contactId);
        }

        // Remove from local storage
        this.vipContacts.delete(contactId);
        await this.saveVIPConfig();

        // Cancel any scheduled notifications
        await Notifications.cancelScheduledNotificationAsync(contactId);
      }
      return true;
    } catch (error) {
      console.error('Error removing VIP contact:', error);
      return false;
    }
  }

  // Set up enhanced notifications for VIP contact
  private async setupVIPNotifications(config: VIPContactConfig): Promise<void> {
    const notificationSettings: VIPNotificationSettings = {
      sound: true,
      vibration: true,
      priority: 'high',
      bypassDND: config.bypassDND,
      showOnLockScreen: true,
    };

    // Schedule a test notification to verify settings
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `VIP Contact: ${config.name}`,
        body: 'This contact is marked as VIP and will bypass DND settings',
        data: { contactId: config.contactId, type: 'vip_contact' },
        sound: config.customRingtone || 'default',
        priority: notificationSettings.priority,
      },
      trigger: null, // Immediate notification for testing
    });
  }

  // Create custom notification channel for Android
  private async createVIPNotificationChannel(config: VIPContactConfig): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(`vip_${config.contactId}`, {
        name: `VIP: ${config.name}`,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
        sound: config.customRingtone || 'default',
        bypassDnd: config.bypassDND,
        enableVibrate: config.bypassVibration,
      });
    }
  }

  // Handle incoming call from VIP contact
  async handleVIPCall(phoneNumber: string): Promise<void> {
    const vipContact = Array.from(this.vipContacts.values()).find(
      config => config.phoneNumber === phoneNumber
    );

    if (vipContact) {
      // Enhanced haptic feedback
      if (Platform.OS === 'ios') {
        // Use iOS-specific haptic feedback
        await this.triggerVIPHapticFeedback();
      }

      // Show VIP notification
      await this.showVIPCallNotification(vipContact);

      // Log VIP call
      await this.logVIPInteraction(vipContact.contactId, 'call');
    }
  }

  // Enhanced haptic feedback for VIP calls
  private async triggerVIPHapticFeedback(): Promise<void> {
    // This would use iOS HapticFeedback API
    // For now, we'll use the vibration API
    const { Vibration } = require('react-native');
    Vibration.vibrate([0, 100, 50, 100, 50, 100, 50, 100]);
  }

  // Show VIP call notification
  private async showVIPCallNotification(config: VIPContactConfig): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `👑 VIP Call: ${config.name}`,
        body: 'This is a VIP contact calling you!',
        data: { contactId: config.contactId, type: 'vip_call' },
        sound: config.customRingtone || 'default',
        priority: 'high',
      },
      trigger: null,
    });
  }

  // Log VIP interactions
  private async logVIPInteraction(contactId: string, interactionType: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = {
      contactId,
      type: interactionType,
      timestamp,
      priority: 'vip',
    };

    // Store in AsyncStorage for analytics
    const logs = await AsyncStorage.getItem('vip_interaction_logs') || '[]';
    const parsedLogs = JSON.parse(logs);
    parsedLogs.push(logEntry);
    await AsyncStorage.setItem('vip_interaction_logs', JSON.stringify(parsedLogs));
  }

  // Get all VIP contacts
  getVIPContacts(): VIPContactConfig[] {
    return Array.from(this.vipContacts.values());
  }

  // Check if contact is VIP
  isVIPContact(contactId: string): boolean {
    return this.vipContacts.has(contactId);
  }

  // Get VIP configuration for contact
  getVIPConfig(contactId: string): VIPContactConfig | undefined {
    return this.vipContacts.get(contactId);
  }

  // Update VIP configuration
  async updateVIPConfig(contactId: string, updates: Partial<VIPContactConfig>): Promise<boolean> {
    try {
      const existing = this.vipContacts.get(contactId);
      if (existing) {
        const updated = { ...existing, ...updates };
        this.vipContacts.set(contactId, updated);
        await this.saveVIPConfig();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating VIP config:', error);
      return false;
    }
  }

  // Request necessary permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const results = await Promise.all([
        Notifications.requestPermissionsAsync(),
        Contacts.requestPermissionsAsync(),
      ]);

      return results.every(result => result.status === 'granted');
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Get VIP statistics
  async getVIPStats(): Promise<{
    totalVIP: number;
    withNotifications: number;
    withEmergencyBypass: number;
    recentInteractions: number;
  }> {
    const vipContacts = this.getVIPContacts();
    const logs = await AsyncStorage.getItem('vip_interaction_logs') || '[]';
    const parsedLogs = JSON.parse(logs);
    
    const recentInteractions = parsedLogs.filter((log: any) => {
      const logDate = new Date(log.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return logDate > weekAgo;
    }).length;

    return {
      totalVIP: vipContacts.length,
      withNotifications: vipContacts.filter(c => c.enableNotifications).length,
      withEmergencyBypass: vipContacts.filter(c => c.enableEmergencyBypass).length,
      recentInteractions,
    };
  }
}

export default VIPContactService; 