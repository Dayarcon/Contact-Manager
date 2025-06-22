import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../context/ContactsContext';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timestamp: number;
}

export interface GeoContact {
  contactId: string;
  contactName: string;
  location: LocationData;
  distance?: number; // in meters
  lastVisit?: number;
  visitCount: number;
  isFavorite: boolean;
  isVIP: boolean;
}

export interface LocationTrigger {
  id: string;
  name: string;
  location: LocationData;
  radius: number; // in meters
  contacts: string[]; // contact IDs to suggest
  isEnabled: boolean;
  triggerType: 'arrival' | 'departure' | 'both';
  message?: string;
  createdAt: string;
}

export interface GeoLocationSettings {
  enableLocationTracking: boolean;
  enableGeoReminders: boolean;
  defaultRadius: number; // in meters
  maxSuggestions: number;
  enableBackgroundLocation: boolean;
  locationUpdateInterval: number; // in minutes
}

class GeoLocationService {
  private static instance: GeoLocationService;
  private currentLocation: LocationData | null = null;
  private geoContacts: Map<string, GeoContact> = new Map();
  private locationTriggers: Map<string, LocationTrigger> = new Map();
  private settings: GeoLocationSettings = {
    enableLocationTracking: false, // Disabled by default
    enableGeoReminders: false, // Disabled by default
    defaultRadius: 1000, // 1km
    maxSuggestions: 5,
    enableBackgroundLocation: false,
    locationUpdateInterval: 15
  };

  private readonly GEOCONTACTS_STORAGE_KEY = 'geo_contacts';
  private readonly TRIGGERS_STORAGE_KEY = 'location_triggers';
  private readonly SETTINGS_STORAGE_KEY = 'geo_settings';
  private readonly LOCATION_STORAGE_KEY = 'current_location';

  private constructor() {
    this.loadData();
  }

  static getInstance(): GeoLocationService {
    if (!GeoLocationService.instance) {
      GeoLocationService.instance = new GeoLocationService();
    }
    return GeoLocationService.instance;
  }

  private async loadData() {
    try {
      // Load geo contacts
      const storedGeoContacts = await AsyncStorage.getItem(this.GEOCONTACTS_STORAGE_KEY);
      if (storedGeoContacts) {
        const contactsArray = JSON.parse(storedGeoContacts);
        this.geoContacts = new Map(Object.entries(contactsArray));
      }

      // Load location triggers
      const storedTriggers = await AsyncStorage.getItem(this.TRIGGERS_STORAGE_KEY);
      if (storedTriggers) {
        const triggersArray = JSON.parse(storedTriggers);
        this.locationTriggers = new Map(Object.entries(triggersArray));
      }

      // Load settings
      const storedSettings = await AsyncStorage.getItem(this.SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }

      // Load current location
      const storedLocation = await AsyncStorage.getItem(this.LOCATION_STORAGE_KEY);
      if (storedLocation) {
        this.currentLocation = JSON.parse(storedLocation);
      }
    } catch (error) {
      console.error('Error loading geo location data:', error);
    }
  }

  private async saveData() {
    try {
      const geoContactsObject = Object.fromEntries(this.geoContacts);
      await AsyncStorage.setItem(this.GEOCONTACTS_STORAGE_KEY, JSON.stringify(geoContactsObject));
      
      const triggersObject = Object.fromEntries(this.locationTriggers);
      await AsyncStorage.setItem(this.TRIGGERS_STORAGE_KEY, JSON.stringify(triggersObject));
      
      await AsyncStorage.setItem(this.SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      
      if (this.currentLocation) {
        await AsyncStorage.setItem(this.LOCATION_STORAGE_KEY, JSON.stringify(this.currentLocation));
      }
    } catch (error) {
      console.error('Error saving geo location data:', error);
    }
  }

  // Simplified distance calculation using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async addGeoContact(contact: Contact, location: LocationData): Promise<boolean> {
    try {
      const geoContact: GeoContact = {
        contactId: contact.id,
        contactName: contact.name,
        location,
        visitCount: 0,
        isFavorite: contact.isFavorite || false,
        isVIP: contact.isVIP || false,
        timestamp: Date.now()
      };

      this.geoContacts.set(contact.id, geoContact);
      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error adding geo contact:', error);
      return false;
    }
  }

  async updateContactLocation(contactId: string, location: LocationData): Promise<boolean> {
    try {
      const contact = this.geoContacts.get(contactId);
      if (contact) {
        contact.location = location;
        contact.lastVisit = Date.now();
        contact.visitCount += 1;
        await this.saveData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating contact location:', error);
      return false;
    }
  }

  getNearbyContacts(radius: number = this.settings.defaultRadius): GeoContact[] {
    if (!this.currentLocation) return [];

    return Array.from(this.geoContacts.values())
      .map(contact => ({
        ...contact,
        distance: this.calculateDistance(
          this.currentLocation!.latitude,
          this.currentLocation!.longitude,
          contact.location.latitude,
          contact.location.longitude
        )
      }))
      .filter(contact => contact.distance! <= radius)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, this.settings.maxSuggestions);
  }

  getContactsInArea(location: LocationData, radius: number): GeoContact[] {
    return Array.from(this.geoContacts.values())
      .map(contact => ({
        ...contact,
        distance: this.calculateDistance(
          location.latitude,
          location.longitude,
          contact.location.latitude,
          contact.location.longitude
        )
      }))
      .filter(contact => contact.distance! <= radius)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  async addLocationTrigger(trigger: Omit<LocationTrigger, 'id' | 'createdAt'>): Promise<string> {
    const newTrigger: LocationTrigger = {
      ...trigger,
      id: `trigger_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    this.locationTriggers.set(newTrigger.id, newTrigger);
    await this.saveData();
    return newTrigger.id;
  }

  async updateLocationTrigger(triggerId: string, updates: Partial<LocationTrigger>): Promise<boolean> {
    try {
      const trigger = this.locationTriggers.get(triggerId);
      if (trigger) {
        const updatedTrigger = { ...trigger, ...updates };
        this.locationTriggers.set(triggerId, updatedTrigger);
        await this.saveData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating location trigger:', error);
      return false;
    }
  }

  async removeLocationTrigger(triggerId: string): Promise<boolean> {
    try {
      this.locationTriggers.delete(triggerId);
      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error removing location trigger:', error);
      return false;
    }
  }

  getLocationTriggers(): LocationTrigger[] {
    return Array.from(this.locationTriggers.values());
  }

  getCurrentLocation(): LocationData | null {
    return this.currentLocation;
  }

  async updateSettings(settings: Partial<GeoLocationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveData();
  }

  getSettings(): GeoLocationSettings {
    return { ...this.settings };
  }

  getGeoContacts(): GeoContact[] {
    return Array.from(this.geoContacts.values());
  }

  async removeGeoContact(contactId: string): Promise<boolean> {
    try {
      this.geoContacts.delete(contactId);
      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error removing geo contact:', error);
      return false;
    }
  }

  // Mock location update for testing
  async setMockLocation(latitude: number, longitude: number): Promise<void> {
    this.currentLocation = {
      latitude,
      longitude,
      timestamp: Date.now()
    };
    await this.saveData();
  }

  cleanup() {
    // Cleanup method for when service is no longer needed
  }
}

export default GeoLocationService; 