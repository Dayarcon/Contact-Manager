import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScheduledMessage {
  id: string;
  contactId: string;
  contactName: string;
  phoneNumber: string;
  message: string;
  scheduledDate: string;
  type: 'birthday' | 'anniversary' | 'custom';
  isSent: boolean;
  createdAt: string;
}

export interface MessagingSettings {
  enableAutoBirthdayMessages: boolean;
  enableAutoAnniversaryMessages: boolean;
  defaultMessageTime: string;
  customBirthdayMessage: string;
  customAnniversaryMessage: string;
}

class ScheduledMessagingService {
  private static instance: ScheduledMessagingService;
  private messages: Map<string, ScheduledMessage> = new Map();
  private settings: MessagingSettings = {
    enableAutoBirthdayMessages: false,
    enableAutoAnniversaryMessages: false,
    defaultMessageTime: '09:00',
    customBirthdayMessage: 'Happy Birthday {name}! 🎉 Hope you have a wonderful day!',
    customAnniversaryMessage: 'Happy Anniversary {name}! 💍 Wishing you many more years of happiness!'
  };

  private readonly MESSAGES_STORAGE_KEY = 'scheduled_messages';
  private readonly SETTINGS_STORAGE_KEY = 'messaging_settings';

  private constructor() {
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
      const storedMessages = await AsyncStorage.getItem(this.MESSAGES_STORAGE_KEY);
      if (storedMessages) {
        const messagesArray = JSON.parse(storedMessages);
        this.messages = new Map(Object.entries(messagesArray));
      }

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

  async scheduleMessage(message: ScheduledMessage): Promise<boolean> {
    try {
      this.messages.set(message.id, message);
      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error scheduling message:', error);
      return false;
    }
  }

  async cancelMessage(messageId: string): Promise<boolean> {
    try {
      this.messages.delete(messageId);
      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error canceling message:', error);
      return false;
    }
  }

  async markAsSent(messageId: string): Promise<boolean> {
    try {
      const message = this.messages.get(messageId);
      if (message) {
        message.isSent = true;
        await this.saveData();
      }
      return true;
    } catch (error) {
      console.error('Error marking message as sent:', error);
      return false;
    }
  }

  getScheduledMessages(): ScheduledMessage[] {
    return Array.from(this.messages.values());
  }

  getPendingMessages(): ScheduledMessage[] {
    return this.getScheduledMessages().filter(message => !message.isSent);
  }

  async updateSettings(settings: Partial<MessagingSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveData();
  }

  getSettings(): MessagingSettings {
    return { ...this.settings };
  }

  async sendMessage(message: ScheduledMessage): Promise<boolean> {
    // This would integrate with SMS services
    // For now, just log the message
    console.log(`Sending message to ${message.contactName}: ${message.message}`);
    return true;
  }
}

export default ScheduledMessagingService; 