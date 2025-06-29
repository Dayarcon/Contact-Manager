import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Checkbox, Chip, Divider, FAB, Switch, Text, useTheme } from 'react-native-paper';
import styled from 'styled-components/native';
import { Contact, useContacts } from '../context/ContactsContext';
import ContactSyncService, { SyncSettings, SyncStats } from '../services/ContactSyncService';

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`;

const HeaderGradient = styled(LinearGradient)`
  padding: 20px;
  padding-top: 60px;
`;

const HeaderTitle = styled(Text)`
  font-size: 28px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
`;

const HeaderSubtitle = styled(Text)`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
`;

const ContentScroll = styled(ScrollView)`
  flex: 1;
  padding: 20px;
`;

const SettingsCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 16px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  background-color: white;
`;

const StatsCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 16px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  background-color: white;
`;

const ContactItem = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

const ContactInfo = styled.View`
  flex: 1;
  margin-left: 12px;
`;

const ContactName = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
`;

const ContactDetails = styled(Text)`
  font-size: 14px;
  color: #666666;
  margin-top: 2px;
`;

const SyncStatus = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export default function ContactSyncSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { contacts } = useContacts();
  
  const [syncService] = useState(() => ContactSyncService.getInstance());
  const [settings, setSettings] = useState<SyncSettings>(syncService.getSettings());
  const [stats, setStats] = useState<SyncStats>(syncService.getStats());
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [systemContactsCount, setSystemContactsCount] = useState(0);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const hasPermissions = await syncService.checkPermissions();
      setPermissionsGranted(hasPermissions);
      
      if (hasPermissions) {
        const count = await syncService.getSystemContactsCount();
        setSystemContactsCount(count);
      }
      
      setStats(syncService.getStats());
      setSelectedContacts(settings.selectedContactIds);
    } catch (error) {
      console.error('Error loading sync data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const requestPermissions = async () => {
    try {
      const granted = await syncService.requestPermissions();
      setPermissionsGranted(granted);
      
      if (granted) {
        const count = await syncService.getSystemContactsCount();
        setSystemContactsCount(count);
        Alert.alert('Success', 'Contacts permission granted!');
      } else {
        Alert.alert('Permission Denied', 'Contacts permission is required for synchronization.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request contacts permission.');
    }
  };

  const updateSetting = async (key: keyof SyncSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await syncService.updateSettings(newSettings);
  };

  const updateSyncField = async (field: keyof SyncSettings['syncFields'], value: boolean) => {
    const newSettings = {
      ...settings,
      syncFields: { ...settings.syncFields, [field]: value }
    };
    setSettings(newSettings);
    await syncService.updateSettings(newSettings);
  };

  const syncAllToSystem = async () => {
    if (!permissionsGranted) {
      Alert.alert('Permission Required', 'Please grant contacts permission first.');
      return;
    }

    Alert.alert(
      'Sync to System',
      `This will sync ${settings.syncSelectedOnly ? selectedContacts.length : contacts.length} contacts to your device's contact list. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            try {
              setIsSyncing(true);
              const result = await syncService.syncAllToSystem(contacts);
              
              if (result.success) {
                Alert.alert(
                  'Sync Complete',
                  `Successfully synced ${result.syncedCount} contacts to system.`
                );
              } else {
                Alert.alert(
                  'Sync Incomplete',
                  `Synced ${result.syncedCount} contacts, ${result.failedCount} failed. Check console for details.`
                );
              }
              
              setStats(syncService.getStats());
              const count = await syncService.getSystemContactsCount();
              setSystemContactsCount(count);
            } catch (error) {
              console.error('Sync error:', error);
              Alert.alert('Sync Error', 'Failed to sync contacts to system.');
            } finally {
              setIsSyncing(false);
            }
          }
        }
      ]
    );
  };

  const syncFromSystem = async () => {
    if (!permissionsGranted) {
      Alert.alert('Permission Required', 'Please grant contacts permission first.');
      return;
    }

    Alert.alert(
      'Import from System',
      'This will import all contacts from your device\'s contact list. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            try {
              setIsSyncing(true);
              const systemContacts = await syncService.syncAllFromSystem();
              
              Alert.alert(
                'Import Complete',
                `Found ${systemContacts.length} contacts in system. You can now add them to your app.`
              );
              
              // Here you would typically add the contacts to your app's context
              // For now, we'll just show the count
            } catch (error) {
              console.error('Import error:', error);
              Alert.alert('Import Error', 'Failed to import contacts from system.');
            } finally {
              setIsSyncing(false);
            }
          }
        }
      ]
    );
  };

  const findDuplicates = async () => {
    if (!permissionsGranted) {
      Alert.alert('Permission Required', 'Please grant contacts permission first.');
      return;
    }

    try {
      setIsSyncing(true);
      const duplicates = await syncService.findDuplicates(contacts);
      
      if (duplicates.length > 0) {
        Alert.alert(
          'Duplicates Found',
          `Found ${duplicates.length} potential duplicate contacts between your app and system contacts.`
        );
        // Here you could navigate to a duplicates management screen
      } else {
        Alert.alert('No Duplicates', 'No duplicate contacts found.');
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
      Alert.alert('Error', 'Failed to check for duplicates.');
    } finally {
      setIsSyncing(false);
    }
  };

  const resetStats = async () => {
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to reset sync statistics?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await syncService.resetStats();
            setStats(syncService.getStats());
          }
        }
      ]
    );
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = selectedContacts.includes(contactId)
      ? selectedContacts.filter(id => id !== contactId)
      : [...selectedContacts, contactId];
    
    setSelectedContacts(newSelected);
    updateSetting('selectedContactIds', newSelected);
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <ContactItem>
      <Checkbox
        status={selectedContacts.includes(item.id) ? 'checked' : 'unchecked'}
        onPress={() => toggleContactSelection(item.id)}
      />
      <ContactInfo>
        <ContactName>{item.name}</ContactName>
        <ContactDetails>
          {item.phoneNumbers?.[0]?.number || 'No phone number'}
        </ContactDetails>
      </ContactInfo>
      <SyncStatus>
        <Chip
          mode="outlined"
          compact
          textStyle={{ fontSize: 12 }}
        >
          {item.isVIP ? 'VIP' : 'Regular'}
        </Chip>
      </SyncStatus>
    </ContactItem>
  );

  return (
    <Container>
      <HeaderGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <HeaderTitle>Contact Sync</HeaderTitle>
        <HeaderSubtitle>Sync your contacts with system contacts</HeaderSubtitle>
      </HeaderGradient>

      <ContentScroll
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Permissions Card */}
        <SettingsCard>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Permissions
            </Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Contacts Permission</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Required to sync contacts with system
                </Text>
              </View>
              <View style={styles.settingAction}>
                {permissionsGranted ? (
                  <Chip mode="outlined" textStyle={{ color: 'green' }}>
                    Granted
                  </Chip>
                ) : (
                  <Button mode="contained" onPress={requestPermissions}>
                    Grant
                  </Button>
                )}
              </View>
            </View>
            {permissionsGranted && (
              <Text variant="bodySmall" style={styles.statsText}>
                System contacts: {systemContactsCount}
              </Text>
            )}
          </Card.Content>
        </SettingsCard>

        {/* Sync Settings Card */}
        <SettingsCard>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Sync Settings
            </Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Auto Sync</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Automatically sync contacts when changed
                </Text>
              </View>
              <Switch
                value={settings.autoSync}
                onValueChange={(value) => updateSetting('autoSync', value)}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Sync Selected Only</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Only sync selected contacts
                </Text>
              </View>
              <Switch
                value={settings.syncSelectedOnly}
                onValueChange={(value) => updateSetting('syncSelectedOnly', value)}
              />
            </View>

            <Divider style={styles.divider} />

            <Text variant="bodyMedium" style={styles.sectionTitle}>
              Auto Sync Events
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Sync on Add</Text>
              </View>
              <Switch
                value={settings.syncOnAdd}
                onValueChange={(value) => updateSetting('syncOnAdd', value)}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Sync on Update</Text>
              </View>
              <Switch
                value={settings.syncOnUpdate}
                onValueChange={(value) => updateSetting('syncOnUpdate', value)}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Sync on Delete</Text>
              </View>
              <Switch
                value={settings.syncOnDelete}
                onValueChange={(value) => updateSetting('syncOnDelete', value)}
              />
            </View>

            <Divider style={styles.divider} />

            <Text variant="bodyMedium" style={styles.sectionTitle}>
              Sync Fields
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Name</Text>
              </View>
              <Switch
                value={settings.syncFields.name}
                onValueChange={(value) => updateSyncField('name', value)}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Phone Numbers</Text>
              </View>
              <Switch
                value={settings.syncFields.phone}
                onValueChange={(value) => updateSyncField('phone', value)}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Email Addresses</Text>
              </View>
              <Switch
                value={settings.syncFields.email}
                onValueChange={(value) => updateSyncField('email', value)}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Addresses</Text>
              </View>
              <Switch
                value={settings.syncFields.address}
                onValueChange={(value) => updateSyncField('address', value)}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Birthdays</Text>
              </View>
              <Switch
                value={settings.syncFields.birthday}
                onValueChange={(value) => updateSyncField('birthday', value)}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Notes</Text>
              </View>
              <Switch
                value={settings.syncFields.notes}
                onValueChange={(value) => updateSyncField('notes', value)}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Photos</Text>
              </View>
              <Switch
                value={settings.syncFields.photo}
                onValueChange={(value) => updateSyncField('photo', value)}
              />
            </View>
          </Card.Content>
        </SettingsCard>

        {/* Statistics Card */}
        <StatsCard>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Sync Statistics
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stats.totalContacts}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Synced
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={[styles.statNumber, { color: 'green' }]}>
                  {stats.syncedContacts}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Successful
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={[styles.statNumber, { color: 'red' }]}>
                  {stats.failedContacts}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Failed
                </Text>
              </View>
            </View>

            {stats.lastSyncTime && (
              <Text variant="bodySmall" style={styles.statsText}>
                Last sync: {stats.lastSyncTime.toLocaleString()}
              </Text>
            )}

            {stats.syncDuration > 0 && (
              <Text variant="bodySmall" style={styles.statsText}>
                Duration: {stats.syncDuration}ms
              </Text>
            )}

            <View style={styles.statsActions}>
              <Button mode="outlined" onPress={resetStats} style={styles.statsButton}>
                Reset Stats
              </Button>
            </View>
          </Card.Content>
        </StatsCard>

        {/* Actions Card */}
        <SettingsCard>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Sync Actions
            </Text>
            
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={syncAllToSystem}
                disabled={!permissionsGranted || isSyncing}
                loading={isSyncing}
                style={styles.actionButton}
              >
                Sync to System
              </Button>
              
              <Button
                mode="outlined"
                onPress={syncFromSystem}
                disabled={!permissionsGranted || isSyncing}
                style={styles.actionButton}
              >
                Import from System
              </Button>
              
              <Button
                mode="outlined"
                onPress={findDuplicates}
                disabled={!permissionsGranted || isSyncing}
                style={styles.actionButton}
              >
                Find Duplicates
              </Button>
            </View>
          </Card.Content>
        </SettingsCard>

        {/* Contact Selector */}
        {settings.syncSelectedOnly && (
          <SettingsCard>
            <Card.Content>
              <View style={styles.selectorHeader}>
                <Text variant="titleLarge" style={styles.cardTitle}>
                  Select Contacts
                </Text>
                <Text variant="bodySmall" style={styles.selectorSubtitle}>
                  {selectedContacts.length} of {contacts.length} selected
                </Text>
              </View>
              
              <Button
                mode="outlined"
                onPress={() => setShowContactSelector(!showContactSelector)}
                style={styles.selectorButton}
              >
                {showContactSelector ? 'Hide Contacts' : 'Show Contacts'}
              </Button>
              
              {showContactSelector && (
                <View style={styles.contactList}>
                  <FlatList
                    data={contacts}
                    renderItem={renderContactItem}
                    keyExtractor={(item) => item.id}
                    style={styles.flatList}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              )}
            </Card.Content>
          </SettingsCard>
        )}
      </ContentScroll>

      <FAB
        icon="arrow-left"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.back()}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    color: '#666666',
    marginTop: 2,
  },
  settingAction: {
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#1a1a1a',
  },
  divider: {
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    color: '#666666',
    marginTop: 4,
  },
  statsText: {
    color: '#666666',
    marginTop: 8,
  },
  statsActions: {
    marginTop: 16,
  },
  statsButton: {
    alignSelf: 'flex-start',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  selectorHeader: {
    marginBottom: 16,
  },
  selectorSubtitle: {
    color: '#666666',
    marginTop: 4,
  },
  selectorButton: {
    marginBottom: 16,
  },
  contactList: {
    maxHeight: 300,
  },
  flatList: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    bottom: 0,
    left: 0,
  },
}); 