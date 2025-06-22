import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import { Contact } from '../context/ContactsContext';

export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  type: 'call' | 'message' | 'video' | 'email' | 'social';
  platform: 'phone' | 'whatsapp' | 'telegram' | 'facetime' | 'sms' | 'email';
  url?: string;
  isAvailable: boolean;
}

export interface QuickActionSettings {
  enableWhatsApp: boolean;
  enableTelegram: boolean;
  enableFaceTime: boolean;
  enableSMS: boolean;
  enableEmail: boolean;
  preferredCallMethod: 'phone' | 'facetime';
  preferredMessageMethod: 'whatsapp' | 'telegram' | 'sms';
  showUnavailableActions: boolean;
}

class QuickActionsService {
  private static instance: QuickActionsService;
  private settings: QuickActionSettings = {
    enableWhatsApp: true,
    enableTelegram: true,
    enableFaceTime: true,
    enableSMS: true,
    enableEmail: true,
    preferredCallMethod: 'phone',
    preferredMessageMethod: 'whatsapp',
    showUnavailableActions: false
  };

  private readonly SETTINGS_STORAGE_KEY = 'quick_actions_settings';

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): QuickActionsService {
    if (!QuickActionsService.instance) {
      QuickActionsService.instance = new QuickActionsService();
    }
    return QuickActionsService.instance;
  }

  private async loadSettings() {
    try {
      const storedSettings = await AsyncStorage.getItem(this.SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error('Error loading quick actions settings:', error);
    }
  }

  private async saveSettings() {
    try {
      await AsyncStorage.setItem(this.SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving quick actions settings:', error);
    }
  }

  // Get available quick actions for a contact
  async getQuickActions(contact: Contact): Promise<QuickAction[]> {
    const actions: QuickAction[] = [];

    // Phone call
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      actions.push({
        id: 'phone_call',
        name: 'Call',
        icon: '📞',
        type: 'call',
        platform: 'phone',
        isAvailable: true
      });
    }

    // FaceTime (iOS only)
    if (Platform.OS === 'ios' && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      actions.push({
        id: 'facetime',
        name: 'FaceTime',
        icon: '📹',
        type: 'video',
        platform: 'facetime',
        isAvailable: this.settings.enableFaceTime
      });
    }

    // WhatsApp
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      actions.push({
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: '💬',
        type: 'message',
        platform: 'whatsapp',
        isAvailable: this.settings.enableWhatsApp
      });
    }

    // Telegram
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      actions.push({
        id: 'telegram',
        name: 'Telegram',
        icon: '📱',
        type: 'message',
        platform: 'telegram',
        isAvailable: this.settings.enableTelegram
      });
    }

    // SMS
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      actions.push({
        id: 'sms',
        name: 'SMS',
        icon: '💬',
        type: 'message',
        platform: 'sms',
        isAvailable: this.settings.enableSMS
      });
    }

    // Email
    if (contact.emailAddresses && contact.emailAddresses.length > 0) {
      actions.push({
        id: 'email',
        name: 'Email',
        icon: '📧',
        type: 'email',
        platform: 'email',
        isAvailable: this.settings.enableEmail
      });
    }

    return actions.filter(action => 
      this.settings.showUnavailableActions || action.isAvailable
    );
  }

  // Execute a quick action
  async executeQuickAction(action: QuickAction, contact: Contact): Promise<boolean> {
    try {
      switch (action.platform) {
        case 'phone':
          return await this.makePhoneCall(contact);
        case 'facetime':
          return await this.makeFaceTimeCall(contact);
        case 'whatsapp':
          return await this.openWhatsApp(contact);
        case 'telegram':
          return await this.openTelegram(contact);
        case 'sms':
          return await this.sendSMS(contact);
        case 'email':
          return await this.sendEmail(contact);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error executing quick action ${action.name}:`, error);
      return false;
    }
  }

  // Make a phone call
  private async makePhoneCall(contact: Contact): Promise<boolean> {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      return false;
    }

    const phoneNumber = contact.phoneNumbers[0].number;
    const url = `tel:${phoneNumber}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
    } catch (error) {
      console.error('Error making phone call:', error);
    }
    
    return false;
  }

  // Make a FaceTime call (iOS only)
  private async makeFaceTimeCall(contact: Contact): Promise<boolean> {
    if (Platform.OS !== 'ios' || !contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      return false;
    }

    const phoneNumber = contact.phoneNumbers[0].number;
    const url = `facetime:${phoneNumber}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
    } catch (error) {
      console.error('Error making FaceTime call:', error);
    }
    
    return false;
  }

  // Open WhatsApp
  private async openWhatsApp(contact: Contact): Promise<boolean> {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      return false;
    }

    const phoneNumber = contact.phoneNumbers[0].number;
    const message = `Hi ${contact.name}! 👋`;
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        // Try opening WhatsApp Web or App Store
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
        return true;
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
    }
    
    return false;
  }

  // Open Telegram
  private async openTelegram(contact: Contact): Promise<boolean> {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      return false;
    }

    const phoneNumber = contact.phoneNumbers[0].number;
    const message = `Hi ${contact.name}! 👋`;
    const url = `tg://msg?to=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        // Try opening Telegram Web
        const webUrl = `https://t.me/${phoneNumber}`;
        await Linking.openURL(webUrl);
        return true;
      }
    } catch (error) {
      console.error('Error opening Telegram:', error);
    }
    
    return false;
  }

  // Send SMS
  private async sendSMS(contact: Contact): Promise<boolean> {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      return false;
    }

    const phoneNumber = contact.phoneNumbers[0].number;
    const message = `Hi ${contact.name}! 👋`;
    
    try {
      // Use Linking for SMS
      const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
    
    return false;
  }

  // Send Email
  private async sendEmail(contact: Contact): Promise<boolean> {
    if (!contact.emailAddresses || contact.emailAddresses.length === 0) {
      return false;
    }

    const email = contact.emailAddresses[0].email;
    const subject = `Hello ${contact.name}`;
    const body = `Hi ${contact.name},\n\nHope you're doing well!\n\nBest regards`;
    
    try {
      const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
    
    return false;
  }

  // Get preferred quick actions for a contact
  async getPreferredQuickActions(contact: Contact): Promise<QuickAction[]> {
    const allActions = await this.getQuickActions(contact);
    const preferredActions: QuickAction[] = [];

    // Add preferred call method
    const callAction = allActions.find(action => 
      action.platform === this.settings.preferredCallMethod
    );
    if (callAction) {
      preferredActions.push(callAction);
    }

    // Add preferred message method
    const messageAction = allActions.find(action => 
      action.platform === this.settings.preferredMessageMethod
    );
    if (messageAction) {
      preferredActions.push(messageAction);
    }

    // Add email if available
    const emailAction = allActions.find(action => action.platform === 'email');
    if (emailAction) {
      preferredActions.push(emailAction);
    }

    return preferredActions;
  }

  // Update quick action settings
  async updateSettings(settings: Partial<QuickActionSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();
  }

  // Get quick action settings
  getSettings(): QuickActionSettings {
    return { ...this.settings };
  }

  // Check if a specific action is available
  async isActionAvailable(action: QuickAction, contact: Contact): Promise<boolean> {
    if (!action.isAvailable) return false;

    switch (action.platform) {
      case 'phone':
        return !!(contact.phoneNumbers && contact.phoneNumbers.length > 0);
      case 'facetime':
        return Platform.OS === 'ios' && !!(contact.phoneNumbers && contact.phoneNumbers.length > 0);
      case 'whatsapp':
        return !!(contact.phoneNumbers && contact.phoneNumbers.length > 0);
      case 'telegram':
        return !!(contact.phoneNumbers && contact.phoneNumbers.length > 0);
      case 'sms':
        return !!(contact.phoneNumbers && contact.phoneNumbers.length > 0);
      case 'email':
        return !!(contact.emailAddresses && contact.emailAddresses.length > 0);
      default:
        return false;
    }
  }

  // Get contact's primary phone number
  getPrimaryPhoneNumber(contact: Contact): string | null {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      return null;
    }
    return contact.phoneNumbers[0].number;
  }

  // Get contact's primary email
  getPrimaryEmail(contact: Contact): string | null {
    if (!contact.emailAddresses || contact.emailAddresses.length === 0) {
      return null;
    }
    return contact.emailAddresses[0].email;
  }
}

export default QuickActionsService; 