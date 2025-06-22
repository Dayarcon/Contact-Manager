import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Button, Card, IconButton } from 'react-native-paper';
import GeoLocationService, { LocationPermissionStatus } from '../services/GeoLocationService';

interface LocationPermissionProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  showSettings?: boolean;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  showSettings = true
}) => {
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>({
    foreground: false,
    background: false,
    canAskAgain: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const geoLocationService = GeoLocationService.getInstance();

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const status = await geoLocationService.getPermissionStatus();
      setPermissionStatus(status);
      
      if (status.foreground && !isInitialized) {
        const initialized = await geoLocationService.initialize();
        setIsInitialized(initialized);
        if (initialized && onPermissionGranted) {
          onPermissionGranted();
        }
      }
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      const status = await geoLocationService.requestPermissions();
      setPermissionStatus(status);
      
      if (status.foreground) {
        const initialized = await geoLocationService.initialize();
        setIsInitialized(initialized);
        if (initialized && onPermissionGranted) {
          onPermissionGranted();
        }
      } else if (onPermissionDenied) {
        onPermissionDenied();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Permission Error',
        'Failed to request location permissions. Please try again or enable location services in your device settings.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openSettings = async () => {
    Alert.alert(
      'Location Permission Required',
      'This app needs location access to provide nearby contact suggestions and location-based features. Please enable location permissions in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: async () => {
            try {
              await Linking.openSettings();
            } catch (error) {
              console.error('Error opening settings:', error);
              Alert.alert(
                'Error',
                'Unable to open settings. Please manually enable location permissions in your device settings.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  const getPermissionStatusText = () => {
    if (permissionStatus.foreground && permissionStatus.background) {
      return 'Full location access granted';
    } else if (permissionStatus.foreground) {
      return 'Foreground location access granted';
    } else if (!permissionStatus.canAskAgain) {
      return 'Location access denied permanently';
    } else {
      return 'Location access not granted';
    }
  };

  const getPermissionStatusColor = () => {
    if (permissionStatus.foreground && permissionStatus.background) {
      return '#4CAF50'; // Green
    } else if (permissionStatus.foreground) {
      return '#FF9800'; // Orange
    } else {
      return '#F44336'; // Red
    }
  };

  const getPermissionIcon = () => {
    if (permissionStatus.foreground && permissionStatus.background) {
      return 'check-circle';
    } else if (permissionStatus.foreground) {
      return 'alert-circle';
    } else {
      return 'close-circle';
    }
  };

  if (permissionStatus.foreground && isInitialized) {
    return null; // Don't show anything if permission is granted and initialized
  }

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <IconButton
            icon={getPermissionIcon()}
            size={24}
            iconColor={getPermissionStatusColor()}
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>Location Access</Text>
            <Text style={[styles.status, { color: getPermissionStatusColor() }]}>
              {getPermissionStatusText()}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          Enable location access to get nearby contact suggestions, location-based reminders, and other location features.
        </Text>

        <View style={styles.buttonContainer}>
          {!permissionStatus.foreground && permissionStatus.canAskAgain && (
            <Button
              mode="contained"
              onPress={requestPermissions}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Grant Permission
            </Button>
          )}

          {(!permissionStatus.canAskAgain || !permissionStatus.foreground) && showSettings && (
            <Button
              mode="outlined"
              onPress={openSettings}
              style={styles.button}
            >
              Open Settings
            </Button>
          )}

          {permissionStatus.foreground && !permissionStatus.background && (
            <Button
              mode="outlined"
              onPress={requestPermissions}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Enable Background Location
            </Button>
          )}
        </View>

        {permissionStatus.foreground && !isInitialized && (
          <View style={styles.initializingContainer}>
            <Text style={styles.initializingText}>
              Initializing location services...
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    marginVertical: 4,
  },
  initializingContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
  },
  initializingText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
});

export default LocationPermission; 