import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledDate?: Date;
  type: 'reminder' | 'message' | 'location' | 'custom';
  contactId?: string;
  contactName?: string;
}

export interface NotificationSettings {
  enableReminders: boolean;
  enableMessages: boolean;
  enableLocationAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
}

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = {
    enableReminders: true,
    enableMessages: true,
    enableLocationAlerts: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00"
  };

  private readonly SETTINGS_STORAGE_KEY = 'notification_settings';
  private readonly SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';

  private constructor() {
    this.initializeNotifications();
    this.loadSettings();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeNotifications() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: this.settings.soundEnabled,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Request permissions
    await this.requestPermissions();
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Only needed for remote push notifications:
      // if (Platform.OS !== 'web') {
      //   const token = await Notifications.getExpoPushTokenAsync({
      //     projectId: 'your-project-id',
      //   });
      //   console.log('Push token:', token.data);
      // }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  private async loadSettings() {
    try {
      const storedSettings = await AsyncStorage.getItem(this.SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  private async saveSettings() {
    try {
      await AsyncStorage.setItem(this.SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  // Schedule a notification
  async scheduleNotification(notification: NotificationData): Promise<string | null> {
    try {
      if (!this.settings.enableReminders && notification.type === 'reminder') {
        console.log('Reminders disabled, skipping notification');
        return null;
      }

      if (!this.settings.enableMessages && notification.type === 'message') {
        console.log('Messages disabled, skipping notification');
        return null;
      }

      if (!this.settings.enableLocationAlerts && notification.type === 'location') {
        console.log('Location alerts disabled, skipping notification');
        return null;
      }

      // Check quiet hours
      if (this.settings.quietHoursEnabled && this.isInQuietHours()) {
        console.log('In quiet hours, scheduling for later');
        return await this.scheduleForAfterQuietHours(notification);
      }

      const trigger: Notifications.DateTriggerInput | Notifications.TimeIntervalTriggerInput = notification.scheduledDate 
        ? { type: SchedulableTriggerInputTypes.DATE, date: notification.scheduledDate }
        : { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: this.settings.soundEnabled ? 'default' : undefined,
        },
        trigger,
      });

      // Store the scheduled notification
      await this.storeScheduledNotification(notificationId, notification);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Schedule birthday reminder
  async scheduleBirthdayReminder(contactName: string, contactId: string, birthday: Date, daysInAdvance: number = 3): Promise<string | null> {
    const reminderDate = new Date(birthday);
    reminderDate.setDate(reminderDate.getDate() - daysInAdvance);

    // Only schedule if reminder date is in the future
    if (reminderDate <= new Date()) {
      return null;
    }

    return await this.scheduleNotification({
      id: `birthday_${contactId}_${reminderDate.getTime()}`,
      title: `🎂 ${contactName}'s Birthday Coming Up!`,
      body: `${contactName}'s birthday is in ${daysInAdvance} days. Don't forget to send your wishes!`,
      type: 'reminder',
      contactId,
      contactName,
      scheduledDate: reminderDate,
      data: {
        type: 'birthday',
        contactId,
        contactName,
        daysInAdvance
      }
    });
  }

  // Schedule anniversary reminder
  async scheduleAnniversaryReminder(contactName: string, contactId: string, anniversary: Date, daysInAdvance: number = 3): Promise<string | null> {
    const reminderDate = new Date(anniversary);
    reminderDate.setDate(reminderDate.getDate() - daysInAdvance);

    // Only schedule if reminder date is in the future
    if (reminderDate <= new Date()) {
      return null;
    }

    return await this.scheduleNotification({
      id: `anniversary_${contactId}_${reminderDate.getTime()}`,
      title: `💍 ${contactName}'s Anniversary Coming Up!`,
      body: `${contactName}'s anniversary is in ${daysInAdvance} days. Time to celebrate!`,
      type: 'reminder',
      contactId,
      contactName,
      scheduledDate: reminderDate,
      data: {
        type: 'anniversary',
        contactId,
        contactName,
        daysInAdvance
      }
    });
  }

  // Schedule location-based notification
  async scheduleLocationNotification(contactName: string, locationName: string, distance: number): Promise<string | null> {
    return await this.scheduleNotification({
      id: `location_${Date.now()}`,
      title: `📍 Near ${contactName}`,
      body: `You're ${Math.round(distance)}m away from ${locationName}. ${contactName} might be nearby!`,
      type: 'location',
      contactName,
      scheduledDate: new Date(), // Immediate notification
      data: {
        type: 'location',
        contactName,
        locationName,
        distance
      }
    });
  }

  // Schedule message reminder
  async scheduleMessageReminder(contactName: string, contactId: string, message: string, scheduledDate: Date): Promise<string | null> {
    return await this.scheduleNotification({
      id: `message_${contactId}_${scheduledDate.getTime()}`,
      title: `💬 Message for ${contactName}`,
      body: `Time to send your scheduled message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
      type: 'message',
      contactId,
      contactName,
      scheduledDate,
      data: {
        type: 'message',
        contactId,
        contactName,
        message
      }
    });
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeScheduledNotification(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  }

  // Cancel all notifications for a contact
  async cancelContactNotifications(contactId: string): Promise<boolean> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const contactNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.contactId === contactId
      );

      for (const notification of contactNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      await this.removeContactScheduledNotifications(contactId);
      return true;
    } catch (error) {
      console.error('Error canceling contact notifications:', error);
      return false;
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await this.clearScheduledNotifications();
      return true;
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return false;
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Update notification settings
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();
  }

  // Get notification settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Check if currently in quiet hours
  private isInQuietHours(): boolean {
    if (!this.settings.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = this.settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = this.settings.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Schedule notification for after quiet hours
  private async scheduleForAfterQuietHours(notification: NotificationData): Promise<string | null> {
    const [endHour, endMinute] = this.settings.quietHoursEnd.split(':').map(Number);
    const afterQuietHours = new Date();
    afterQuietHours.setHours(endHour, endMinute, 0, 0);
    
    // If it's already past the end time today, schedule for tomorrow
    if (afterQuietHours <= new Date()) {
      afterQuietHours.setDate(afterQuietHours.getDate() + 1);
    }

    notification.scheduledDate = afterQuietHours;
    return await this.scheduleNotification(notification);
  }

  // Store scheduled notification metadata
  private async storeScheduledNotification(notificationId: string, notification: NotificationData): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.SCHEDULED_NOTIFICATIONS_KEY);
      const notifications = stored ? JSON.parse(stored) : {};
      notifications[notificationId] = notification;
      await AsyncStorage.setItem(this.SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing scheduled notification:', error);
    }
  }

  // Remove scheduled notification metadata
  private async removeScheduledNotification(notificationId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.SCHEDULED_NOTIFICATIONS_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        delete notifications[notificationId];
        await AsyncStorage.setItem(this.SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error removing scheduled notification:', error);
    }
  }

  // Remove all scheduled notifications for a contact
  private async removeContactScheduledNotifications(contactId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.SCHEDULED_NOTIFICATIONS_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        const filteredNotifications = Object.fromEntries(
          Object.entries(notifications).filter(([_, notification]: [string, any]) => 
            notification.contactId !== contactId
          )
        );
        await AsyncStorage.setItem(this.SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(filteredNotifications));
      }
    } catch (error) {
      console.error('Error removing contact scheduled notifications:', error);
    }
  }

  // Clear all scheduled notification metadata
  private async clearScheduledNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SCHEDULED_NOTIFICATIONS_KEY);
    } catch (error) {
      console.error('Error clearing scheduled notifications:', error);
    }
  }
}

export default NotificationService; 