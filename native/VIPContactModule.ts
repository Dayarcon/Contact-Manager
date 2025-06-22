import { NativeModules } from 'react-native';

interface VIPContactModuleInterface {
  // Check if VIP contacts feature is supported
  isVIPContactsSupported(): Promise<boolean>;
  
  // Add contact to system VIP list (iOS)
  addToSystemVIP(contactId: string, phoneNumber: string): Promise<boolean>;
  
  // Remove contact from system VIP list (iOS)
  removeFromSystemVIP(contactId: string): Promise<boolean>;
  
  // Get system VIP contacts
  getSystemVIPContacts(): Promise<string[]>;
  
  // Request notification permissions for VIP contacts
  requestVIPNotificationPermissions(): Promise<boolean>;
  
  // Set up VIP contact notifications
  setupVIPNotifications(contactId: string, phoneNumber: string): Promise<boolean>;
  
  // Check if device supports emergency bypass
  supportsEmergencyBypass(): Promise<boolean>;
  
  // Enable emergency bypass for VIP contact
  enableEmergencyBypass(contactId: string, phoneNumber: string): Promise<boolean>;
}

// Platform-specific implementation
const VIPContactModule: VIPContactModuleInterface = NativeModules.VIPContactModule || {
  isVIPContactsSupported: async () => false,
  addToSystemVIP: async () => false,
  removeFromSystemVIP: async () => false,
  getSystemVIPContacts: async () => [],
  requestVIPNotificationPermissions: async () => false,
  setupVIPNotifications: async () => false,
  supportsEmergencyBypass: async () => false,
  enableEmergencyBypass: async () => false,
};

export default VIPContactModule; 