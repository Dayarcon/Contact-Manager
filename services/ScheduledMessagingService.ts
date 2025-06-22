import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../context/ContactsContext';
import NotificationService from './NotificationService';

export interface ScheduledMessage {
  id: string;
  contactId: string;
  contactName: string;
  message: string;
  scheduledDate: string;
  type: 'sms' | 'whatsapp' | 'telegram' | 'email';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  notificationId?: string; // Link to scheduled notification
}

export interface MessagingSettings {
  enableAutoBirthdayMessages: boolean;
  enableAutoAnniversaryMessages: boolean;
  defaultMessageTime: string; // "09:00"
  customBirthdayMessage: string;
  customAnniversaryMessage: string;
  preferredPlatform: 'sms' | 'whatsapp' | 'telegram' | 'email';
  enableNotifications: boolean;
}

class ScheduledMessagingService {
  private static instance: ScheduledMessagingService;
  private messages: Map<string, ScheduledMessage> = new Map();
  private settings: MessagingSettings = {
    enableAutoBirthdayMessages: true,
    enableAutoAnniversaryMessages: true,
    defaultMessageTime: "09:00",
    customBirthdayMessage: 'Happy Birthday {name}! 🎉',
    customAnniversaryMessage: 'Happy Anniversary {name}! 💍',
    preferredPlatform: 'whatsapp',
    enableNotifications: true
  };

  private readonly MESSAGES_STORAGE_KEY = 'scheduled_messages';
  private readonly SETTINGS_STORAGE_KEY = 'messaging_settings';
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
    this.loadData();
  }

  static getInstance(): ScheduledMessagingService {
    if (!ScheduledMessagingService.instance) {
      ScheduledMessagingService.instance = new ScheduledMessagingService();
    }
    return ScheduledMessagingService.instance;
  }

  private async loadData() {
    try {
      // Load messages
      const storedMessages = await AsyncStorage.getItem(this.MESSAGES_STORAGE_KEY);
      if (storedMessages) {
        const messagesArray = JSON.parse(storedMessages);
        this.messages = new Map(Object.entries(messagesArray));
      }

      // Load settings
      const storedSettings = await AsyncStorage.getItem(this.SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error('Error loading messaging data:', error);
    }
  }

  private async saveData() {
    try {
      const messagesObject = Object.fromEntries(this.messages);
      await AsyncStorage.setItem(this.MESSAGES_STORAGE_KEY, JSON.stringify(messagesObject));
      await AsyncStorage.setItem(this.SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving messaging data:', error);
    }
  }

  // Schedule a message
  async scheduleMessage(
    contactId: string,
    contactName: string,
    message: string,
    scheduledDate: Date,
    type: 'sms' | 'whatsapp' | 'telegram' | 'email' = 'whatsapp'
  ): Promise<string | null> {
    try {
      const messageId = `message_${contactId}_${scheduledDate.getTime()}`;
      
      const scheduledMessage: ScheduledMessage = {
        id: messageId,
        contactId,
        contactName,
        message,
        scheduledDate: scheduledDate.toISOString(),
        type,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Schedule notification if enabled
      if (this.settings.enableNotifications) {
        const notificationId = await this.notificationService.scheduleMessageReminder(
          contactName,
          contactId,
          message,
          scheduledDate
        );
        if (notificationId) {
          scheduledMessage.notificationId = notificationId;
        }
      }

      this.messages.set(messageId, scheduledMessage);
      await this.saveData();
      return messageId;
    } catch (error) {
      console.error('Error scheduling message:', error);
      return null;
    }
  }

  // Schedule birthday message
  async scheduleBirthdayMessage(contact: Contact): Promise<string | null> {
    if (!this.settings.enableAutoBirthdayMessages || !contact.birthday) {
      return null;
    }

    const birthday = new Date(contact.birthday);
    const nextBirthday = this.getNextOccurrence(birthday);
    const [hour, minute] = this.settings.defaultMessageTime.split(':').map(Number);
    nextBirthday.setHours(hour, minute, 0, 0);

    const message = this.settings.customBirthdayMessage.replace('{name}', contact.name);
    
    return await this.scheduleMessage(
      contact.id,
      contact.name,
      message,
      nextBirthday,
      this.settings.preferredPlatform
    );
  }

  // Schedule anniversary message
  async scheduleAnniversaryMessage(contact: Contact): Promise<string | null> {
    if (!this.settings.enableAutoAnniversaryMessages || !contact.anniversary) {
      return null;
    }

    const anniversary = new Date(contact.anniversary);
    const nextAnniversary = this.getNextOccurrence(anniversary);
    const [hour, minute] = this.settings.defaultMessageTime.split(':').map(Number);
    nextAnniversary.setHours(hour, minute, 0, 0);

    const message = this.settings.customAnniversaryMessage.replace('{name}', contact.name);
    
    return await this.scheduleMessage(
      contact.id,
      contact.name,
      message,
      nextAnniversary,
      this.settings.preferredPlatform
    );
  }

  private getNextOccurrence(date: Date): Date {
    const now = new Date();
    const next = new Date(date);
    next.setFullYear(now.getFullYear());

    // If this year's occurrence has passed, set to next year
    if (next < now) {
      next.setFullYear(now.getFullYear() + 1);
    }

    return next;
  }

  // Cancel a scheduled message
  async cancelMessage(messageId: string): Promise<boolean> {
    try {
      const message = this.messages.get(messageId);
      if (!message) return false;

      message.status = 'cancelled';
      message.updatedAt = new Date().toISOString();

      // Cancel notification if exists
      if (message.notificationId) {
        await this.notificationService.cancelNotification(message.notificationId);
        message.notificationId = undefined;
      }

      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error canceling message:', error);
      return false;
    }
  }

  // Cancel all messages for a contact
  async cancelContactMessages(contactId: string): Promise<boolean> {
    try {
      const contactMessages = Array.from(this.messages.values()).filter(
        message => message.contactId === contactId && message.status === 'pending'
      );

      for (const message of contactMessages) {
        await this.cancelMessage(message.id);
      }

      return true;
    } catch (error) {
      console.error('Error canceling contact messages:', error);
      return false;
    }
  }

  // Get pending messages
  getPendingMessages(): ScheduledMessage[] {
    return Array.from(this.messages.values()).filter(
      message => message.status === 'pending'
    );
  }

  // Get messages for a specific contact
  getContactMessages(contactId: string): ScheduledMessage[] {
    return Array.from(this.messages.values()).filter(
      message => message.contactId === contactId
    );
  }

  // Get upcoming messages
  getUpcomingMessages(days: number = 7): ScheduledMessage[] {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.getPendingMessages().filter(message => {
      const messageDate = new Date(message.scheduledDate);
      return messageDate >= now && messageDate <= futureDate;
    });
  }

  // Update messaging settings
  async updateSettings(settings: Partial<MessagingSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveData();
  }

  // Get messaging settings
  getSettings(): MessagingSettings {
    return { ...this.settings };
  }

  // Send a message (placeholder for actual implementation)
  async sendMessage(message: ScheduledMessage): Promise<boolean> {
    try {
      // Update status to sent
      message.status = 'sent';
      message.updatedAt = new Date().toISOString();

      // Cancel notification if exists
      if (message.notificationId) {
        await this.notificationService.cancelNotification(message.notificationId);
        message.notificationId = undefined;
      }

      await this.saveData();

      // Log the message (replace with actual sending logic)
      console.log(`Sending ${message.type} message to ${message.contactName}: ${message.message}`);
      
      // Here you would integrate with actual messaging services:
      // - SMS: Use expo-sms or native SMS APIs
      // - WhatsApp: Use WhatsApp Business API or deep links
      // - Telegram: Use Telegram Bot API
      // - Email: Use expo-mail-composer

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      message.status = 'failed';
      message.updatedAt = new Date().toISOString();
      await this.saveData();
      return false;
    }
  }

  // Process scheduled messages (should be called periodically)
  async processScheduledMessages(): Promise<void> {
    const now = new Date();
    const pendingMessages = this.getPendingMessages();

    for (const message of pendingMessages) {
      const messageDate = new Date(message.scheduledDate);
      if (messageDate <= now) {
        await this.sendMessage(message);
      }
    }
  }

  // Generate messages for all contacts
  async generateMessagesFromContacts(contacts: Contact[]): Promise<void> {
    for (const contact of contacts) {
      await this.scheduleBirthdayMessage(contact);
      await this.scheduleAnniversaryMessage(contact);
    }
  }
}

export default ScheduledMessagingService; 