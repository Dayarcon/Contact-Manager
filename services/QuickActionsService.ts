import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Alert, Linking, Platform } from 'react-native';
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
  private readonly APP_AVAILABILITY_CACHE_KEY = 'app_availability_cache';
  private appAvailabilityCache: Map<string, boolean> = new Map();

  private constructor() {
    this.loadSettings();
    this.loadAppAvailabilityCache();
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

  private async loadAppAvailabilityCache() {
    try {
      const storedCache = await AsyncStorage.getItem(this.APP_AVAILABILITY_CACHE_KEY);
      if (storedCache) {
        this.appAvailabilityCache = new Map(JSON.parse(storedCache));
      }
    } catch (error) {
      console.error('Error loading app availability cache:', error);
    }
  }

  private async saveAppAvailabilityCache() {
    try {
      const cacheArray = Array.from(this.appAvailabilityCache.entries());
      await AsyncStorage.setItem(this.APP_AVAILABILITY_CACHE_KEY, JSON.stringify(cacheArray));
    } catch (error) {
      console.error('Error saving app availability cache:', error);
    }
  }

  // Check if an app is available on the device
  private async checkAppAvailability(appScheme: string): Promise<boolean> {
    // Check cache first
    if (this.appAvailabilityCache.has(appScheme)) {
      return this.appAvailabilityCache.get(appScheme)!;
    }

    try {
      const isAvailable = await Linking.canOpenURL(appScheme);
      // Cache the result
      this.appAvailabilityCache.set(appScheme, isAvailable);
      await this.saveAppAvailabilityCache();
      return isAvailable;
    } catch (error) {
      console.error(`Error checking app availability for ${appScheme}:`, error);
      this.appAvailabilityCache.set(appScheme, false);
      await this.saveAppAvailabilityCache();
      return false;
    }
  }

  // Check availability for multiple apps with improved detection
  private async checkMultipleAppAvailability(): Promise<{
    whatsapp: boolean;
    telegram: boolean;
    facetime: boolean;
    sms: boolean;
    email: boolean;
  }> {
    // Try multiple URL schemes for better detection
    const [whatsapp1, whatsapp2, telegram, facetime, sms, email] = await Promise.all([
      this.checkAppAvailability('whatsapp://'),
      this.checkAppAvailability('whatsapp://send'),
      this.checkAppAvailability('tg://'),
      this.checkAppAvailability('facetime://'),
      this.checkAppAvailability('sms:'),
      this.checkAppAvailability('mailto:')
    ]);

    // WhatsApp is available if either scheme works
    const whatsapp = whatsapp1 || whatsapp2;

    return {
      whatsapp,
      telegram,
      facetime: Platform.OS === 'ios' && facetime,
      sms,
      email
    };
  }

  // Get available quick actions for a contact
  async getQuickActions(contact: Contact): Promise<QuickAction[]> {
    const actions: QuickAction[] = [];
    const appAvailability = await this.checkMultipleAppAvailability();

    // Phone call (always available if phone numbers exist)
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

    // FaceTime (iOS only, if available)
    if (Platform.OS === 'ios' && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      actions.push({
        id: 'facetime',
        name: 'FaceTime',
        icon: '📹',
        type: 'video',
        platform: 'facetime',
        isAvailable: this.settings.enableFaceTime && appAvailability.facetime
      });
    }

    // WhatsApp (if available)
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      actions.push({
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: '💬',
        type: 'message',
        platform: 'whatsapp',
        isAvailable: this.settings.enableWhatsApp && appAvailability.whatsapp
      });
    }

    // Telegram (if available)
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      actions.push({
        id: 'telegram',
        name: 'Telegram',
        icon: '📱',
        type: 'message',
        platform: 'telegram',
        isAvailable: this.settings.enableTelegram && appAvailability.telegram
      });
    }

    // SMS (if available)
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      actions.push({
        id: 'sms',
        name: 'SMS',
        icon: '💬',
        type: 'message',
        platform: 'sms',
        isAvailable: this.settings.enableSMS && appAvailability.sms
      });
    }

    // Email (if available)
    if (contact.emailAddresses && contact.emailAddresses.length > 0) {
      actions.push({
        id: 'email',
        name: 'Email',
        icon: '📧',
        type: 'email',
        platform: 'email',
        isAvailable: this.settings.enableEmail && appAvailability.email
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
      console.log('No phone numbers available for contact:', contact.name);
      return false;
    }

    const phoneNumber = contact.phoneNumbers[0].number;
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, ''); // Remove non-digit characters except +
    
    console.log('=== PHONE CALL DEBUG ===');
    console.log('Contact:', contact.name);
    console.log('Original phone number:', phoneNumber);
    console.log('Clean phone number:', cleanNumber);
    console.log('Platform:', Platform.OS);
    
    // Try different URL schemes directly without checking canOpenURL first
    const urlSchemes = [
      `tel:${cleanNumber}`,
      `tel://${cleanNumber}`,
      `call:${cleanNumber}`,
      `callto:${cleanNumber}`
    ];
    
    for (const url of urlSchemes) {
      try {
        console.log('Trying to open URL directly:', url);
        await Linking.openURL(url);
        console.log('Successfully opened URL:', url);
        return true;
      } catch (error) {
        console.log('Failed to open URL:', url, error.message);
        // Continue to next URL scheme
      }
    }
    
    // If all URL schemes fail, try a different approach
    try {
      console.log('Trying fallback approach with Intent...');
      // For Android, try using the Intent approach
      if (Platform.OS === 'android') {
        const intentUrl = `intent://dial/${cleanNumber}#Intent;scheme=tel;package=com.android.dialer;end`;
        await Linking.openURL(intentUrl);
        console.log('Successfully opened Intent URL');
        return true;
      }
    } catch (error) {
      console.log('Intent approach also failed:', error.message);
    }
    
    // Final fallback: Show user the phone number and let them dial manually
    console.log('All automatic methods failed, showing manual dial option');
    Alert.alert(
      'Phone Dialer Not Available',
      `Phone number: ${phoneNumber}\n\nThis device doesn't support automatic phone dialing. Please dial the number manually.`,
      [
        { 
          text: 'Copy Number', 
          onPress: () => {
            Clipboard.setString(phoneNumber);
          }
        },
        { text: 'OK', style: 'cancel' }
      ]
    );
    
    console.log('=== END PHONE CALL DEBUG ===');
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

  // Refresh app availability cache
  async refreshAppAvailability(): Promise<void> {
    this.appAvailabilityCache.clear();
    await this.saveAppAvailabilityCache();
    // Force re-check on next getQuickActions call
  }

  // Force refresh app availability with debugging
  async forceRefreshAppAvailability(): Promise<{
    whatsapp: boolean;
    telegram: boolean;
    facetime: boolean;
    sms: boolean;
    email: boolean;
  }> {
    console.log('Force refreshing app availability...');
    
    // Clear cache first
    this.appAvailabilityCache.clear();
    await this.saveAppAvailabilityCache();
    
    // Test individual schemes with logging
    const schemes = [
      { name: 'WhatsApp (basic)', scheme: 'whatsapp://' },
      { name: 'WhatsApp (send)', scheme: 'whatsapp://send' },
      { name: 'Telegram', scheme: 'tg://' },
      { name: 'FaceTime', scheme: 'facetime://' },
      { name: 'SMS', scheme: 'sms:' },
      { name: 'Email', scheme: 'mailto:' }
    ];

    const results: { [key: string]: boolean } = {};
    
    for (const { name, scheme } of schemes) {
      try {
        const isAvailable = await Linking.canOpenURL(scheme);
        results[name] = isAvailable;
        console.log(`${name}: ${isAvailable ? 'Available' : 'Not Available'}`);
        
        // Cache the result
        this.appAvailabilityCache.set(scheme, isAvailable);
      } catch (error) {
        console.error(`Error checking ${name}:`, error);
        results[name] = false;
        this.appAvailabilityCache.set(scheme, false);
      }
    }
    
    await this.saveAppAvailabilityCache();
    
    // Return the final results
    const whatsapp = results['WhatsApp (basic)'] || results['WhatsApp (send)'];
    
    return {
      whatsapp,
      telegram: results['Telegram'],
      facetime: Platform.OS === 'ios' && results['FaceTime'],
      sms: results['SMS'],
      email: results['Email']
    };
  }

  // Manual override for WhatsApp availability (in case detection fails)
  async overrideWhatsAppAvailability(isAvailable: boolean): Promise<void> {
    this.appAvailabilityCache.set('whatsapp://', isAvailable);
    this.appAvailabilityCache.set('whatsapp://send', isAvailable);
    await this.saveAppAvailabilityCache();
    console.log(`WhatsApp availability manually set to: ${isAvailable}`);
  }

  // Get current app availability status
  async getAppAvailabilityStatus(): Promise<{
    whatsapp: boolean;
    telegram: boolean;
    facetime: boolean;
    sms: boolean;
    email: boolean;
  }> {
    return await this.checkMultipleAppAvailability();
  }
}

export default QuickActionsService; 