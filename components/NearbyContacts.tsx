import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, FAB, Modal, Portal, TextInput } from 'react-native-paper';
import { Contact } from '../context/ContactsContext';
import GeoLocationService, { GeoContact, LocationData } from '../services/GeoLocationService';
import LocationPermission from './LocationPermission';

interface NearbyContactsProps {
  onContactPress?: (contact: Contact) => void;
  onAddLocation?: (contact: Contact) => void;
}

const NearbyContacts: React.FC<NearbyContactsProps> = ({
  onContactPress,
  onAddLocation
}) => {
  const [nearbyContacts, setNearbyContacts] = useState<GeoContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [locationInput, setLocationInput] = useState({
    latitude: '',
    longitude: '',
    address: ''
  });

  const geoLocationService = GeoLocationService.getInstance();

  useEffect(() => {
    loadNearbyContacts();
    // Set up periodic refresh
    const interval = setInterval(loadNearbyContacts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNearbyContacts = async () => {
    try {
      setIsLoading(true);
      const nearby = geoLocationService.getNearbyContacts();
      setNearbyContacts(nearby);
    } catch (error) {
      console.error('Error loading nearby contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNearbyContacts();
    setRefreshing(false);
  };

  const handleAddLocation = (contact: Contact) => {
    setSelectedContact(contact);
    setShowAddLocationModal(true);
  };

  const handleSaveLocation = async () => {
    if (!selectedContact) return;

    const lat = parseFloat(locationInput.latitude);
    const lng = parseFloat(locationInput.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid Location', 'Please enter valid latitude and longitude coordinates.');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Invalid Coordinates', 'Latitude must be between -90 and 90, longitude between -180 and 180.');
      return;
    }

    try {
      const locationData: LocationData = {
        latitude: lat,
        longitude: lng,
        address: locationInput.address || undefined,
        timestamp: Date.now()
      };

      const success = await geoLocationService.addGeoContact(selectedContact, locationData);
      if (success) {
        Alert.alert('Success', 'Location added successfully!');
        setShowAddLocationModal(false);
        setSelectedContact(null);
        setLocationInput({ latitude: '', longitude: '', address: '' });
        loadNearbyContacts();
      } else {
        Alert.alert('Error', 'Failed to add location. Please try again.');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      Alert.alert('Error', 'Failed to add location. Please try again.');
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!selectedContact) return;

    try {
      const currentLocation = geoLocationService.getCurrentLocation();
      if (currentLocation) {
        const success = await geoLocationService.addGeoContact(selectedContact, currentLocation);
        if (success) {
          Alert.alert('Success', 'Current location added successfully!');
          setShowAddLocationModal(false);
          setSelectedContact(null);
          loadNearbyContacts();
        } else {
          Alert.alert('Error', 'Failed to add current location. Please try again.');
        }
      } else {
        Alert.alert('Location Unavailable', 'Current location is not available. Please enable location services.');
      }
    } catch (error) {
      console.error('Error using current location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    }
  };

  const getDistanceText = (distance: number) => {
    if (distance < 1000) {
      return `${distance}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const getLastVisitText = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const renderContact = ({ item }: { item: GeoContact }) => (
    <Card style={styles.contactCard} onPress={() => onContactPress?.({ id: item.contactId, name: item.contactName } as Contact)}>
      <Card.Content>
        <View style={styles.contactHeader}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.contactName}</Text>
            <View style={styles.contactMeta}>
              <Text style={styles.distanceText}>
                📍 {getDistanceText(item.distance || 0)}
              </Text>
              {item.lastVisit && (
                <Text style={styles.lastVisitText}>
                  🕒 {getLastVisitText(item.lastVisit)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.contactBadges}>
            {item.isVIP && <Chip icon="star" style={styles.vipChip}>VIP</Chip>}
            {item.isFavorite && <Chip icon="heart" style={styles.favoriteChip}>Favorite</Chip>}
            <Chip icon="map-marker" style={styles.visitChip}>
              {item.visitCount} visits
            </Chip>
          </View>
        </View>
        
        {item.location.address && (
          <Text style={styles.addressText}>
            📍 {item.location.address}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Nearby Contacts</Text>
      <Text style={styles.emptyStateDescription}>
        No contacts with location data found nearby. Add location data to your contacts to see them here.
      </Text>
      <Button
        mode="contained"
        onPress={() => setShowAddLocationModal(true)}
        style={styles.addLocationButton}
      >
        Add Location to Contact
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <LocationPermission />
      
      <FlatList
        data={nearbyContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.contactId}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
      />

      <Portal>
        <Modal
          visible={showAddLocationModal}
          onDismiss={() => setShowAddLocationModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Add Location</Text>
          
          {selectedContact && (
            <Text style={styles.modalSubtitle}>
              Adding location for: {selectedContact.name}
            </Text>
          )}

          <TextInput
            label="Latitude"
            value={locationInput.latitude}
            onChangeText={(text) => setLocationInput({ ...locationInput, latitude: text })}
            keyboardType="numeric"
            style={styles.input}
            placeholder="e.g., 37.7749"
          />

          <TextInput
            label="Longitude"
            value={locationInput.longitude}
            onChangeText={(text) => setLocationInput({ ...locationInput, longitude: text })}
            keyboardType="numeric"
            style={styles.input}
            placeholder="e.g., -122.4194"
          />

          <TextInput
            label="Address (Optional)"
            value={locationInput.address}
            onChangeText={(text) => setLocationInput({ ...locationInput, address: text })}
            style={styles.input}
            placeholder="e.g., 123 Main St, City, State"
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={handleUseCurrentLocation}
              style={styles.modalButton}
            >
              Use Current Location
            </Button>
            
            <Button
              mode="contained"
              onPress={handleSaveLocation}
              style={styles.modalButton}
            >
              Save Location
            </Button>
          </View>

          <Button
            mode="text"
            onPress={() => setShowAddLocationModal(false)}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddLocationModal(true)}
        label="Add Location"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  contactCard: {
    marginBottom: 12,
    elevation: 2,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  distanceText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  lastVisitText: {
    fontSize: 14,
    color: '#666',
  },
  contactBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  vipChip: {
    backgroundColor: '#FFD700',
  },
  favoriteChip: {
    backgroundColor: '#FF69B4',
  },
  visitChip: {
    backgroundColor: '#E3F2FD',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  addLocationButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default NearbyContacts; 