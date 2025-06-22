import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Contact } from '../context/ContactsContext';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timestamp: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
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
  locationAccuracy: 'low' | 'balanced' | 'high' | 'best';
}

export interface LocationPermissionStatus {
  foreground: boolean;
  background: boolean;
  canAskAgain: boolean;
}

class GeoLocationService {
  private static instance: GeoLocationService;
  private currentLocation: LocationData | null = null;
  private geoContacts: Map<string, GeoContact> = new Map();
  private locationTriggers: Map<string, LocationTrigger> = new Map();
  private settings: GeoLocationSettings = {
    enableLocationTracking: true,
    enableGeoReminders: true,
    defaultRadius: 1000, // 1km
    maxSuggestions: 5,
    enableBackgroundLocation: false,
    locationUpdateInterval: 15,
    locationAccuracy: 'balanced'
  };

  private readonly GEOCONTACTS_STORAGE_KEY = 'geo_contacts';
  private readonly TRIGGERS_STORAGE_KEY = 'location_triggers';
  private readonly SETTINGS_STORAGE_KEY = 'geo_settings';
  private readonly LOCATION_STORAGE_KEY = 'current_location';

  private locationSubscription: Location.LocationSubscription | null = null;
  private backgroundLocationSubscription: Location.LocationSubscription | null = null;
  private isInitialized = false;

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

  // Initialize location services
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check and request permissions
      const permissionStatus = await this.requestPermissions();
      if (!permissionStatus.foreground) {
        console.warn('Location permission not granted');
        return false;
      }

      // Get current location
      await this.updateCurrentLocation();

      // Start location tracking if enabled
      if (this.settings.enableLocationTracking) {
        await this.startLocationTracking();
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing location services:', error);
      return false;
    }
  }

  // Request location permissions
  async requestPermissions(): Promise<LocationPermissionStatus> {
    try {
      const foregroundPermission = await Location.requestForegroundPermissionsAsync();
      let backgroundPermission: { status: 'granted' | 'denied'; canAskAgain: boolean } = { status: 'denied', canAskAgain: false };

      // Request background location permission if needed
      if (this.settings.enableBackgroundLocation) {
        try {
          const bgPermission = await Location.requestBackgroundPermissionsAsync();
          backgroundPermission = {
            status: bgPermission.status as 'granted' | 'denied',
            canAskAgain: bgPermission.canAskAgain
          };
        } catch (error) {
          console.log('Background permissions not available:', error);
        }
      }

      return {
        foreground: foregroundPermission.status === 'granted',
        background: backgroundPermission.status === 'granted',
        canAskAgain: foregroundPermission.canAskAgain
      };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return {
        foreground: false,
        background: false,
        canAskAgain: false
      };
    }
  }

  // Check current permission status
  async getPermissionStatus(): Promise<LocationPermissionStatus> {
    try {
      const foregroundPermission = await Location.getForegroundPermissionsAsync();
      let backgroundPermission: { status: 'granted' | 'denied'; canAskAgain: boolean } = { status: 'denied', canAskAgain: false };

      try {
        const bgPermission = await Location.getBackgroundPermissionsAsync();
        backgroundPermission = {
          status: bgPermission.status as 'granted' | 'denied',
          canAskAgain: bgPermission.canAskAgain
        };
      } catch (error) {
        // Background permissions might not be available on all platforms
        console.log('Background permissions not available:', error);
      }

      return {
        foreground: foregroundPermission.status === 'granted',
        background: backgroundPermission.status === 'granted',
        canAskAgain: foregroundPermission.canAskAgain
      };
    } catch (error) {
      console.error('Error getting permission status:', error);
      return {
        foreground: false,
        background: false,
        canAskAgain: false
      };
    }
  }

  // Update current location with reverse geocoding
  private async updateCurrentLocation(): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: this.getLocationAccuracy(),
        timeInterval: 5000,
        distanceInterval: 10,
      });

      // Get address information
      let addressInfo = {};
      try {
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (address.length > 0) {
          addressInfo = {
            address: address[0].street || '',
            city: address[0].city || '',
            state: address[0].region || '',
            country: address[0].country || '',
          };
        }
      } catch (geocodeError) {
        console.warn('Error getting address:', geocodeError);
      }

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: Date.now(),
        ...addressInfo
      };

      await this.saveData();
      this.checkLocationTriggers();
    } catch (error) {
      console.error('Error updating current location:', error);
    }
  }

  // Start location tracking
  private async startLocationTracking(): Promise<void> {
    try {
      if (this.locationSubscription) {
        this.locationSubscription.remove();
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: this.getLocationAccuracy(),
          timeInterval: this.settings.locationUpdateInterval * 60 * 1000, // Convert minutes to milliseconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy || undefined,
            altitude: location.coords.altitude || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
          };
          this.saveData();
          this.checkLocationTriggers();
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }

  // Start background location tracking
  async startBackgroundLocationTracking(): Promise<boolean> {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      if (this.backgroundLocationSubscription) {
        this.backgroundLocationSubscription.remove();
      }

      this.backgroundLocationSubscription = await Location.watchPositionAsync(
        {
          accuracy: this.getLocationAccuracy(),
          timeInterval: this.settings.locationUpdateInterval * 60 * 1000,
          distanceInterval: 50, // Update every 50 meters for background
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy || undefined,
            altitude: location.coords.altitude || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
          };
          this.saveData();
          this.checkLocationTriggers();
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting background location tracking:', error);
      return false;
    }
  }

  // Stop location tracking
  stopLocationTracking(): void {
    try {
      if (this.locationSubscription && typeof this.locationSubscription.remove === 'function') {
        this.locationSubscription.remove();
      }
      this.locationSubscription = null;
      
      if (this.backgroundLocationSubscription && typeof this.backgroundLocationSubscription.remove === 'function') {
        this.backgroundLocationSubscription.remove();
      }
      this.backgroundLocationSubscription = null;
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  // Check location triggers
  private checkLocationTriggers(): void {
    if (!this.currentLocation) return;

    this.locationTriggers.forEach(trigger => {
      if (!trigger.isEnabled) return;

      const distance = this.calculateDistance(
        this.currentLocation!.latitude,
        this.currentLocation!.longitude,
        trigger.location.latitude,
        trigger.location.longitude
      );

      if (distance <= trigger.radius) {
        this.triggerLocationAlert(trigger, distance);
      }
    });
  }

  // Trigger location alert
  private triggerLocationAlert(trigger: LocationTrigger, distance: number): void {
    // In a real app, you would show a notification or alert
    console.log(`Location trigger activated: ${trigger.name}`);
    console.log(`Distance: ${Math.round(distance)}m`);
    console.log(`Contacts to suggest: ${trigger.contacts.length}`);
    
    // You could integrate with notification services here
    // Notifications.scheduleNotificationAsync({
    //   content: {
    //     title: `📍 ${trigger.name}`,
    //     body: `You're near ${trigger.name}. ${trigger.message || 'Check your nearby contacts!'}`,
    //   },
    //   trigger: null,
    // });
  }

  // Get location accuracy setting
  private getLocationAccuracy(): Location.Accuracy {
    switch (this.settings.locationAccuracy) {
      case 'low':
        return Location.Accuracy.Low;
      case 'high':
        return Location.Accuracy.High;
      case 'best':
        return Location.Accuracy.BestForNavigation;
      case 'balanced':
      default:
        return Location.Accuracy.Balanced;
    }
  }

  // Calculate distance between two points using Haversine formula
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

  // Add a contact with location data
  async addGeoContact(contact: Contact, location: LocationData): Promise<boolean> {
    try {
      const geoContact: GeoContact = {
        contactId: contact.id,
        contactName: contact.name,
        location,
        visitCount: 1,
        lastVisit: Date.now(),
        isFavorite: contact.isFavorite || false,
        isVIP: contact.isVIP || false,
      };

      this.geoContacts.set(contact.id, geoContact);
      await this.saveData();
      return true;
    } catch (error) {
      console.error('Error adding geo contact:', error);
      return false;
    }
  }

  // Update contact location
  async updateContactLocation(contactId: string, location: LocationData): Promise<boolean> {
    try {
      const geoContact = this.geoContacts.get(contactId);
      if (geoContact) {
        geoContact.location = location;
        geoContact.lastVisit = Date.now();
        geoContact.visitCount += 1;
        await this.saveData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating contact location:', error);
      return false;
    }
  }

  // Get nearby contacts
  getNearbyContacts(radius: number = this.settings.defaultRadius): GeoContact[] {
    if (!this.currentLocation) return [];

    const nearby: GeoContact[] = [];

    this.geoContacts.forEach(geoContact => {
      const distance = this.calculateDistance(
        this.currentLocation!.latitude,
        this.currentLocation!.longitude,
        geoContact.location.latitude,
        geoContact.location.longitude
      );

      if (distance <= radius) {
        nearby.push({
          ...geoContact,
          distance: Math.round(distance)
        });
      }
    });

    // Sort by distance and priority (VIP/Favorite first)
    return nearby.sort((a, b) => {
      // VIP contacts first
      if (a.isVIP && !b.isVIP) return -1;
      if (!a.isVIP && b.isVIP) return 1;
      
      // Favorite contacts second
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      // Then by distance
      return (a.distance || 0) - (b.distance || 0);
    }).slice(0, this.settings.maxSuggestions);
  }

  // Get contacts in a specific area
  getContactsInArea(location: LocationData, radius: number): GeoContact[] {
    const inArea: GeoContact[] = [];

    this.geoContacts.forEach(geoContact => {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        geoContact.location.latitude,
        geoContact.location.longitude
      );

      if (distance <= radius) {
        inArea.push({
          ...geoContact,
          distance: Math.round(distance)
        });
      }
    });

    return inArea.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // Add a location trigger
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

  // Update location trigger
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

  // Remove location trigger
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

  // Get all location triggers
  getLocationTriggers(): LocationTrigger[] {
    return Array.from(this.locationTriggers.values());
  }

  // Get current location
  getCurrentLocation(): LocationData | null {
    return this.currentLocation;
  }

  // Update settings
  async updateSettings(settings: Partial<GeoLocationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveData();
    
    // Restart location tracking if needed
    if (settings.enableLocationTracking !== undefined) {
      if (settings.enableLocationTracking) {
        await this.initialize();
      } else {
        this.stopLocationTracking();
      }
    }

    if (settings.enableBackgroundLocation !== undefined) {
      if (settings.enableBackgroundLocation) {
        await this.startBackgroundLocationTracking();
      } else if (this.backgroundLocationSubscription) {
        this.backgroundLocationSubscription.remove();
        this.backgroundLocationSubscription = null;
      }
    }
  }

  // Get settings
  getSettings(): GeoLocationSettings {
    return { ...this.settings };
  }

  // Get geo contacts
  getGeoContacts(): GeoContact[] {
    return Array.from(this.geoContacts.values());
  }

  // Remove geo contact
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

  // Get location statistics
  getLocationStats(): {
    totalGeoContacts: number;
    activeTriggers: number;
    lastLocationUpdate: number | null;
    isTracking: boolean;
  } {
    return {
      totalGeoContacts: this.geoContacts.size,
      activeTriggers: Array.from(this.locationTriggers.values()).filter(t => t.isEnabled).length,
      lastLocationUpdate: this.currentLocation?.timestamp || null,
      isTracking: !!(this.locationSubscription || this.backgroundLocationSubscription)
    };
  }

  // Cleanup
  cleanup() {
    try {
      if (this.locationSubscription && typeof this.locationSubscription.remove === 'function') {
        this.locationSubscription.remove();
      }
      this.locationSubscription = null;
      
      if (this.backgroundLocationSubscription && typeof this.backgroundLocationSubscription.remove === 'function') {
        this.backgroundLocationSubscription.remove();
      }
      this.backgroundLocationSubscription = null;
      
      this.isInitialized = false;
    } catch (error) {
      console.error('Error during location service cleanup:', error);
    }
  }
}

export default GeoLocationService; 