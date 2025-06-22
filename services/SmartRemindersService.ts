import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../context/ContactsContext';
import NotificationService from './NotificationService';

export interface Reminder {
  id: string;
  contactId: string;
  contactName: string;
  type: 'birthday' | 'anniversary' | 'custom';
  date: string;
  title: string;
  message: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  notificationId?: string; // Link to scheduled notification
}

export interface ReminderSettings {
  enableBirthdayReminders: boolean;
  enableAnniversaryReminders: boolean;
  reminderDaysInAdvance: number;
  enableAutoMessages: boolean;
  customMessageTemplate: string;
}

class SmartRemindersService {
  private static instance: SmartRemindersService;
  private reminders: Map<string, Reminder> = new Map();
  private settings: ReminderSettings = {
    enableBirthdayReminders: true,
    enableAnniversaryReminders: true,
    reminderDaysInAdvance: 3,
    enableAutoMessages: false,
    customMessageTemplate: 'Happy {type} {name}! 🎉'
  };

  private readonly REMINDERS_STORAGE_KEY = 'smart_reminders';
  private readonly SETTINGS_STORAGE_KEY = 'reminder_settings';
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
    this.loadData();
  }

  static getInstance(): SmartRemindersService {
    if (!SmartRemindersService.instance) {
      SmartRemindersService.instance = new SmartRemindersService();
    }
    return SmartRemindersService.instance;
  }

  private async loadData() {
    try {
      // Load reminders
      const storedReminders = await AsyncStorage.getItem(this.REMINDERS_STORAGE_KEY);
      if (storedReminders) {
        const remindersArray = JSON.parse(storedReminders);
        this.reminders = new Map(Object.entries(remindersArray));
      }

      // Load settings
      const storedSettings = await AsyncStorage.getItem(this.SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error('Error loading reminder data:', error);
    }
  }

  private async saveData() {
    try {
      const remindersObject = Object.fromEntries(this.reminders);
      await AsyncStorage.setItem(this.REMINDERS_STORAGE_KEY, JSON.stringify(remindersObject));
      await AsyncStorage.setItem(this.SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving reminder data:', error);
    }
  }

  // Generate reminders for all contacts
  async generateRemindersFromContacts(contacts: Contact[]): Promise<void> {
    const newReminders: Reminder[] = [];

    contacts.forEach(contact => {
      // Birthday reminders
      if (this.settings.enableBirthdayReminders && contact.birthday) {
        const birthdayReminder = this.createBirthdayReminder(contact);
        if (birthdayReminder) {
          newReminders.push(birthdayReminder);
        }
      }

      // Anniversary reminders
      if (this.settings.enableAnniversaryReminders && contact.anniversary) {
        const anniversaryReminder = this.createAnniversaryReminder(contact);
        if (anniversaryReminder) {
          newReminders.push(anniversaryReminder);
        }
      }
    });

    // Add new reminders
    for (const reminder of newReminders) {
      await this.addReminder(reminder);
    }
  }

  private createBirthdayReminder(contact: Contact): Reminder | null {
    if (!contact.birthday) return null;

    const birthday = new Date(contact.birthday);
    const nextBirthday = this.getNextOccurrence(birthday);
    const reminderDate = new Date(nextBirthday);
    reminderDate.setDate(reminderDate.getDate() - this.settings.reminderDaysInAdvance);

    // Only create if reminder date is in the future
    if (reminderDate > new Date()) {
      return {
        id: `birthday_${contact.id}_${nextBirthday.getTime()}`,
        contactId: contact.id,
        contactName: contact.name,
        type: 'birthday',
        date: reminderDate.toISOString(),
        title: `🎂 ${contact.name}'s Birthday Coming Up!`,
        message: `${contact.name}'s birthday is in ${this.settings.reminderDaysInAdvance} days. Don't forget to send your wishes!`,
        isEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    return null;
  }

  private createAnniversaryReminder(contact: Contact): Reminder | null {
    if (!contact.anniversary) return null;

    const anniversary = new Date(contact.anniversary);
    const nextAnniversary = this.getNextOccurrence(anniversary);
    const reminderDate = new Date(nextAnniversary);
    reminderDate.setDate(reminderDate.getDate() - this.settings.reminderDaysInAdvance);

    // Only create if reminder date is in the future
    if (reminderDate > new Date()) {
      return {
        id: `anniversary_${contact.id}_${nextAnniversary.getTime()}`,
        contactId: contact.id,
        contactName: contact.name,
        type: 'anniversary',
        date: reminderDate.toISOString(),
        title: `💍 ${contact.name}'s Anniversary Coming Up!`,
        message: `${contact.name}'s anniversary is in ${this.settings.reminderDaysInAdvance} days. Time to celebrate!`,
        isEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    return null;
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

  async addReminder(reminder: Reminder): Promise<boolean> {
    try {
      // Check if reminder already exists
      if (this.reminders.has(reminder.id)) {
        return true; // Already exists
      }

      // Schedule notification if reminder is enabled
      if (reminder.isEnabled) {
        const notificationId = await this.scheduleReminderNotification(reminder);
        if (notificationId) {
          reminder.notificationId = notificationId;
        }
      }

      this.reminders.set(reminder.id, reminder);
      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error adding reminder:', error);
      return false;
    }
  }

  async removeReminder(reminderId: string): Promise<boolean> {
    try {
      const reminder = this.reminders.get(reminderId);
      if (reminder && reminder.notificationId) {
        await this.notificationService.cancelNotification(reminder.notificationId);
      }
      
      this.reminders.delete(reminderId);
      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error removing reminder:', error);
      return false;
    }
  }

  async updateReminderSettings(settings: Partial<ReminderSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveData();
    
    // Regenerate reminders with new settings
    // This would typically be called when settings change
  }

  async toggleReminder(reminderId: string, enabled: boolean): Promise<boolean> {
    try {
      const reminder = this.reminders.get(reminderId);
      if (!reminder) return false;

      reminder.isEnabled = enabled;
      reminder.updatedAt = new Date().toISOString();

      if (enabled && !reminder.notificationId) {
        // Schedule notification
        const notificationId = await this.scheduleReminderNotification(reminder);
        if (notificationId) {
          reminder.notificationId = notificationId;
        }
      } else if (!enabled && reminder.notificationId) {
        // Cancel notification
        await this.notificationService.cancelNotification(reminder.notificationId);
        reminder.notificationId = undefined;
      }

      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error toggling reminder:', error);
      return false;
    }
  }

  async cancelContactReminders(contactId: string): Promise<boolean> {
    try {
      const contactReminders = Array.from(this.reminders.values()).filter(
        reminder => reminder.contactId === contactId
      );

      for (const reminder of contactReminders) {
        if (reminder.notificationId) {
          await this.notificationService.cancelNotification(reminder.notificationId);
        }
        this.reminders.delete(reminder.id);
      }

      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error canceling contact reminders:', error);
      return false;
    }
  }

  getReminders(): Reminder[] {
    return Array.from(this.reminders.values());
  }

  getUpcomingReminders(days: number = 7): Reminder[] {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.getReminders().filter(reminder => {
      const reminderDate = new Date(reminder.date);
      return reminderDate >= now && reminderDate <= futureDate && reminder.isEnabled;
    });
  }

  getSettings(): ReminderSettings {
    return { ...this.settings };
  }

  async sendAutoMessage(reminder: Reminder): Promise<boolean> {
    // This would integrate with messaging services
    // For now, just log the message
    console.log(`Auto message for ${reminder.contactName}: ${reminder.message}`);
    return true;
  }

  // Schedule notification for a reminder
  private async scheduleReminderNotification(reminder: Reminder): Promise<string | null> {
    try {
      const reminderDate = new Date(reminder.date);
      
      if (reminder.type === 'birthday') {
        const birthday = new Date(reminder.contactId.split('_')[1]); // Extract birthday from contact
        return await this.notificationService.scheduleBirthdayReminder(
          reminder.contactName,
          reminder.contactId,
          birthday,
          this.settings.reminderDaysInAdvance
        );
      } else if (reminder.type === 'anniversary') {
        const anniversary = new Date(reminder.contactId.split('_')[1]); // Extract anniversary from contact
        return await this.notificationService.scheduleAnniversaryReminder(
          reminder.contactName,
          reminder.contactId,
          anniversary,
          this.settings.reminderDaysInAdvance
        );
      } else {
        // Custom reminder
        return await this.notificationService.scheduleNotification({
          id: reminder.id,
          title: reminder.title,
          body: reminder.message,
          type: 'reminder',
          contactId: reminder.contactId,
          contactName: reminder.contactName,
          scheduledDate: reminderDate,
          data: {
            type: reminder.type,
            contactId: reminder.contactId,
            contactName: reminder.contactName
          }
        });
      }
    } catch (error) {
      console.error('Error scheduling reminder notification:', error);
      return null;
    }
  }
}

export default SmartRemindersService; 