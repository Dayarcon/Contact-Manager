import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Divider, List, Switch } from 'react-native-paper';
import GeoLocationService, { GeoLocationSettings, LocationPermissionStatus } from '../services/GeoLocationService';
import LocationPermission from './LocationPermission';

const LocationSettings: React.FC = () => {
  const [settings, setSettings] = useState<GeoLocationSettings>({
    enableLocationTracking: true,
    enableGeoReminders: true,
    defaultRadius: 1000,
    maxSuggestions: 5,
    enableBackgroundLocation: false,
    locationUpdateInterval: 15,
    locationAccuracy: 'balanced'
  });
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>({
    foreground: false,
    background: false,
    canAskAgain: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const geoLocationService = GeoLocationService.getInstance();

  useEffect(() => {
    loadSettings();
    checkPermissionStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = geoLocationService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading location settings:', error);
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const status = await geoLocationService.getPermissionStatus();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const updateSetting = async (key: keyof GeoLocationSettings, value: any) => {
    setIsLoading(true);
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await geoLocationService.updateSettings({ [key]: value });
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
      // Revert the change
      setSettings(settings);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccuracyLabel = (accuracy: string) => {
    switch (accuracy) {
      case 'low':
        return 'Low (Battery Saver)';
      case 'balanced':
        return 'Balanced (Recommended)';
      case 'high':
        return 'High (More Accurate)';
      case 'best':
        return 'Best (Navigation)';
      default:
        return 'Balanced';
    }
  };

  const getAccuracyDescription = (accuracy: string) => {
    switch (accuracy) {
      case 'low':
        return 'Uses less battery, less accurate location';
      case 'balanced':
        return 'Good balance of accuracy and battery life';
      case 'high':
        return 'More accurate location, uses more battery';
      case 'best':
        return 'Most accurate, uses significant battery';
      default:
        return 'Good balance of accuracy and battery life';
    }
  };

  const handleBackgroundLocationToggle = async (enabled: boolean) => {
    if (enabled && !permissionStatus.background) {
      Alert.alert(
        'Background Location Permission',
        'Background location access is required for this feature. This will allow the app to track your location even when it\'s not in use.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                const success = await geoLocationService.startBackgroundLocationTracking();
                if (success) {
                  await updateSetting('enableBackgroundLocation', true);
                  await checkPermissionStatus();
                } else {
                  Alert.alert(
                    'Permission Denied',
                    'Background location permission is required for this feature. Please enable it in your device settings.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Open Settings', 
                        onPress: async () => {
                          try {
                            await Linking.openSettings();
                          } catch (error) {
                            console.error('Error opening settings:', error);
                          }
                        }
                      }
                    ]
                  );
                }
              } catch (error) {
                console.error('Error enabling background location:', error);
                Alert.alert(
                  'Error',
                  'Failed to enable background location. Please try again or check your device settings.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } else {
      await updateSetting('enableBackgroundLocation', enabled);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LocationPermission
        onPermissionGranted={checkPermissionStatus}
        onPermissionDenied={checkPermissionStatus}
      />

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Location Tracking</Text>
          
          <List.Item
            title="Enable Location Tracking"
            description="Track your location to provide nearby contact suggestions"
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={() => (
              <Switch
                value={settings.enableLocationTracking}
                onValueChange={(value) => updateSetting('enableLocationTracking', value)}
                disabled={isLoading || !permissionStatus.foreground}
              />
            )}
          />

          <List.Item
            title="Background Location"
            description="Track location even when app is not in use"
            left={(props) => <List.Icon {...props} icon="map-marker-radius" />}
            right={() => (
              <Switch
                value={settings.enableBackgroundLocation}
                onValueChange={handleBackgroundLocationToggle}
                disabled={isLoading || !permissionStatus.foreground}
              />
            )}
          />

          <List.Item
            title="Geo Reminders"
            description="Get reminders when near specific locations"
            left={(props) => <List.Icon {...props} icon="bell-ring" />}
            right={() => (
              <Switch
                value={settings.enableGeoReminders}
                onValueChange={(value) => updateSetting('enableGeoReminders', value)}
                disabled={isLoading}
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Location Accuracy</Text>
          
          <View style={styles.accuracyContainer}>
            <Text style={styles.accuracyLabel}>
              {getAccuracyLabel(settings.locationAccuracy)}
            </Text>
            <Text style={styles.accuracyDescription}>
              {getAccuracyDescription(settings.locationAccuracy)}
            </Text>
            
            <View style={styles.accuracyButtons}>
              {(['low', 'balanced', 'high', 'best'] as const).map((accuracy) => (
                <Button
                  key={accuracy}
                  mode={settings.locationAccuracy === accuracy ? 'contained' : 'outlined'}
                  onPress={() => updateSetting('locationAccuracy', accuracy)}
                  disabled={isLoading}
                  style={styles.accuracyButton}
                  compact
                >
                  {accuracy.charAt(0).toUpperCase() + accuracy.slice(1)}
                </Button>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Nearby Contacts</Text>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Default Radius: {settings.defaultRadius}m
            </Text>
            <Slider
              value={settings.defaultRadius}
              onValueChange={(value: number) => updateSetting('defaultRadius', Math.round(value))}
              minimumValue={100}
              maximumValue={10000}
              step={100}
              disabled={isLoading}
              style={styles.slider}
            />
            <Text style={styles.sliderDescription}>
              Distance to search for nearby contacts
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Max Suggestions: {settings.maxSuggestions}
            </Text>
            <Slider
              value={settings.maxSuggestions}
              onValueChange={(value: number) => updateSetting('maxSuggestions', Math.round(value))}
              minimumValue={1}
              maximumValue={20}
              step={1}
              disabled={isLoading}
              style={styles.slider}
            />
            <Text style={styles.sliderDescription}>
              Maximum number of nearby contacts to suggest
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Update Frequency</Text>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Update Interval: {settings.locationUpdateInterval} minutes
            </Text>
            <Slider
              value={settings.locationUpdateInterval}
              onValueChange={(value: number) => updateSetting('locationUpdateInterval', Math.round(value))}
              minimumValue={1}
              maximumValue={60}
              step={1}
              disabled={isLoading}
              style={styles.slider}
            />
            <Text style={styles.sliderDescription}>
              How often to update your location (affects battery usage)
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Location Statistics</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {geoLocationService.getLocationStats().totalGeoContacts}
              </Text>
              <Text style={styles.statLabel}>Geo Contacts</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {geoLocationService.getLocationStats().activeTriggers}
              </Text>
              <Text style={styles.statLabel}>Active Triggers</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {geoLocationService.getLocationStats().isTracking ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.statLabel}>Currently Tracking</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  accuracyContainer: {
    marginBottom: 16,
  },
  accuracyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accuracyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  accuracyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accuracyButton: {
    flex: 1,
    minWidth: 80,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  slider: {
    marginVertical: 8,
  },
  sliderDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default LocationSettings; 