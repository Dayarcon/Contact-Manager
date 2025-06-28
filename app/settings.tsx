import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Card, IconButton, Snackbar, Switch, Text } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import styled from 'styled-components/native';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useContacts } from '../context/ContactsContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import GeoLocationService from '../services/GeoLocationService';
import QuickActionsService from '../services/QuickActionsService';

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`;

const HeaderGradient = styled(LinearGradient)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  z-index: -1;
`;

const ContentScroll = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const SectionCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 24px;
  elevation: 6;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 16px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const SectionHeader = styled(Text)`
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 20px;
  color: #1a1a1a;
  letter-spacing: 0.5px;
`;

const StyledButton = styled(Button)`
  margin: 12px 0;
  border-radius: 16px;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
`;

const InfoText = styled(Text)`
  font-size: 16px;
  color: #666666;
  margin-bottom: 20px;
  line-height: 24px;
  letter-spacing: 0.3px;
`;

const ExportSection = styled(Card)`
  margin-bottom: 20px;
  border-radius: 24px;
  elevation: 6;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 16px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const ExportButton = styled(Button)`
  margin: 12px 0;
  border-radius: 16px;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
`;

const FeatureCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 20px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const FeatureRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 20px;
`;

const FeatureIcon = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 6px;
`;

const FeatureInfo = styled.View`
  flex: 1;
`;

const FeatureTitle = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
  letter-spacing: 0.3px;
`;

const FeatureDescription = styled(Text)`
  font-size: 14px;
  color: #666666;
  letter-spacing: 0.2px;
`;

const GoogleSection = styled(Card)`
  margin-bottom: 20px;
  border-radius: 24px;
  elevation: 6;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 16px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 20px;
`;

const GoogleSyncButton = styled(Button)`
  margin-top: 12px;
  border-radius: 16px;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
`;

export default function SettingsScreen() {
  const router = useRouter();
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { signIn, signOut, isSignedIn, getGoogleContactGroups, loading: googleLoading } = useGoogleAuth() || {
    signIn: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
    isSignedIn: false,
    getGoogleContactGroups: () => Promise.resolve([]),
    loading: false
  };
  const [appAvailability, setAppAvailability] = useState({
    whatsapp: false,
    telegram: false,
    facetime: false,
    sms: false,
    email: false
  });
  
  const quickActionsService = QuickActionsService.getInstance();
  const [quickActionSettings, setQuickActionSettings] = useState(quickActionsService.getSettings());

  const { contacts, importContacts, isLoading, syncGoogleContacts, isSyncing, lastSyncTimestamp } = useContacts() || {
    contacts: [],
    importContacts: () => console.warn('ContactsProvider not available'),
    isLoading: false,
    syncGoogleContacts: () => Promise.resolve(),
    isSyncing: false,
    lastSyncTimestamp: null
  };

  const geoLocationService = GeoLocationService.getInstance();
  const locationStats = geoLocationService.getLocationStats();

  const [googleGroups, setGoogleGroups] = useState<any[]>([]);
  const [showGoogleGroups, setShowGoogleGroups] = useState(false);

  useEffect(() => {
    loadAppAvailability();
    loadGoogleGroups();
  }, []);

  const loadAppAvailability = async () => {
    try {
      const availability = await quickActionsService.getAppAvailabilityStatus();
      setAppAvailability(availability);
    } catch (error) {
      console.error('Error loading app availability:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppAvailability();
    setRefreshing(false);
  };

  const handleQuickActionSettingChange = async (key: keyof typeof quickActionSettings, value: boolean) => {
    try {
      const newSettings = { ...quickActionSettings, [key]: value };
      await quickActionsService.updateSettings(newSettings);
      setQuickActionSettings(newSettings);
    } catch (error) {
      console.error('Error updating quick action settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const refreshAppAvailability = async () => {
    try {
      setSnackbar({ visible: true, message: 'Refreshing app detection...' });
      
      // Use the new force refresh method with debugging
      const availability = await quickActionsService.forceRefreshAppAvailability();
      setAppAvailability(availability);
      
      console.log('App availability refreshed:', availability);
      
      if (availability.whatsapp) {
        setSnackbar({ visible: true, message: 'WhatsApp detected successfully!' });
      } else {
        setSnackbar({ visible: true, message: 'WhatsApp not detected. Check console for details.' });
      }
    } catch (error) {
      console.error('Error refreshing app availability:', error);
      setSnackbar({ visible: true, message: 'Failed to refresh app availability' });
    }
  };

  const exportToJSON = async () => {
    try {
      setIsExporting(true);
      const data = JSON.stringify(contacts, null, 2);
      const fileName = `contacts_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, data);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Contacts'
        });
      }
      
      setSnackbar({ visible: true, message: 'Contacts exported to JSON successfully!' });
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({ visible: true, message: 'Failed to export contacts' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      let csvContent = 'Name,First Name,Last Name,Company,Job Title,Phone,Email,Group,Notes\n';
      
      contacts.forEach(contact => {
        const primaryPhone = contact.phoneNumbers?.find(p => p.isPrimary)?.number || '';
        const primaryEmail = contact.emailAddresses?.find(e => e.isPrimary)?.email || '';
        
        const row = [
          contact.name,
          contact.firstName || '',
          contact.lastName || '',
          contact.company || '',
          contact.jobTitle || '',
          primaryPhone,
          primaryEmail,
          contact.group || '',
          contact.notes || ''
        ].map(field => `"${field.replace(/"/g, '""')}"`).join(',');
        
        csvContent += row + '\n';
      });
      
      const fileName = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Contacts'
        });
      }
      
      setSnackbar({ visible: true, message: 'Contacts exported to CSV successfully!' });
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({ visible: true, message: 'Failed to export contacts' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToVCard = async () => {
    try {
      setIsExporting(true);
      let vcardContent = '';
      
      contacts.forEach(contact => {
        vcardContent += 'BEGIN:VCARD\n';
        vcardContent += 'VERSION:3.0\n';
        vcardContent += `FN:${contact.name}\n`;
        if (contact.firstName) vcardContent += `N:${contact.lastName || ''};${contact.firstName};;;\n`;
        if (contact.company) vcardContent += `ORG:${contact.company}\n`;
        if (contact.jobTitle) vcardContent += `TITLE:${contact.jobTitle}\n`;
        
        contact.phoneNumbers?.forEach(phone => {
          vcardContent += `TEL;TYPE=${phone.type.toUpperCase()}:${phone.number}\n`;
        });
        
        contact.emailAddresses?.forEach(email => {
          vcardContent += `EMAIL;TYPE=${email.type.toUpperCase()}:${email.email}\n`;
        });
        
        if (contact.notes) vcardContent += `NOTE:${contact.notes}\n`;
        vcardContent += 'END:VCARD\n\n';
      });
      
      const fileName = `contacts_${new Date().toISOString().split('T')[0]}.vcf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, vcardContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/vcard',
          dialogTitle: 'Export Contacts'
        });
      }
      
      setSnackbar({ visible: true, message: 'Contacts exported to vCard successfully!' });
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({ visible: true, message: 'Failed to export contacts' });
    } finally {
      setIsExporting(false);
    }
  };

  const backupContacts = async () => {
    try {
      setIsExporting(true);
      const backupData = {
        contacts,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const data = JSON.stringify(backupData, null, 2);
      const fileName = `contacts_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, data);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Backup Contacts'
        });
      }
      
      setSnackbar({ visible: true, message: 'Contacts backed up successfully!' });
    } catch (error) {
      console.error('Backup error:', error);
      setSnackbar({ visible: true, message: 'Failed to backup contacts' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportContacts = async () => {
    Alert.alert(
      'Import Contacts',
      'This feature will be available in the next update. For now, you can manually add contacts or use the export feature to backup your data.',
      [{ text: 'OK' }]
    );
  };

  const handleGoogleSync = async () => {
    try {
      setSnackbar({ visible: true, message: 'Syncing contacts with Google...' });
      await syncGoogleContacts(true); // Force sync for manual sync
      setSnackbar({ visible: true, message: 'Contacts synced successfully!' });
    } catch (error) {
      console.error('Error syncing contacts:', error);
      setSnackbar({ visible: true, message: 'Failed to sync contacts' });
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOut();
      setSnackbar({ visible: true, message: 'Signed out from Google' });
    } catch (error) {
      console.error('Error signing out:', error);
      setSnackbar({ visible: true, message: 'Failed to sign out' });
    }
  };

  // Load Google contact groups
  const loadGoogleGroups = async () => {
    if (isSignedIn) {
      try {
        const groups = await getGoogleContactGroups();
        setGoogleGroups(groups);
      } catch (error) {
        console.error('Error loading Google groups:', error);
      }
    }
  };

  return (
    <Container>
      <HeaderGradient
        colors={['#f0f2f5', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingTop: 60, 
        paddingHorizontal: 16, 
        paddingBottom: 20,
        backgroundColor: 'transparent'
      }}>
        <IconButton
          icon="arrow-left"
          iconColor="black"
          size={28}
          onPress={() => router.back()}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        />
        <Text style={{ 
          flex: 1, 
          color: 'black', 
          fontSize: 24, 
          fontWeight: '800', 
          marginLeft: 16,
          letterSpacing: 0.5
        }}>
          Settings
        </Text>
      </View>

      <ContentScroll showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <ExportSection>
            <Card.Content style={{ padding: 24 }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '800', 
                marginBottom: 20, 
                color: '#1a1a1a',
                letterSpacing: 0.5
              }}>
                📤 Export & Backup
              </Text>
              
              <Text style={{ 
                fontSize: 14, 
                color: '#666666', 
                marginBottom: 20,
                lineHeight: 20
              }}>
                Export your contacts in various formats or create a backup for safekeeping.
              </Text>

              <ExportButton
                mode="contained"
                onPress={backupContacts}
                icon="cloud-upload"
                loading={isExporting}
                disabled={isExporting}
                style={{ backgroundColor: '#6200ee' }}
              >
                Create Backup
              </ExportButton>

              <ExportButton
                mode="outlined"
                onPress={exportToJSON}
                icon="code-json"
                loading={isExporting}
                disabled={isExporting}
                style={{ borderColor: '#6200ee' }}
                labelStyle={{ color: '#6200ee' }}
              >
                Export as JSON
              </ExportButton>

              <ExportButton
                mode="outlined"
                onPress={exportToCSV}
                icon="file-table"
                loading={isExporting}
                disabled={isExporting}
                style={{ borderColor: '#6200ee' }}
                labelStyle={{ color: '#6200ee' }}
              >
                Export as CSV
              </ExportButton>

              <ExportButton
                mode="outlined"
                onPress={exportToVCard}
                icon="card-account-phone"
                loading={isExporting}
                disabled={isExporting}
                style={{ borderColor: '#6200ee' }}
                labelStyle={{ color: '#6200ee' }}
              >
                Export as vCard
              </ExportButton>

              <ExportButton
                mode="outlined"
                onPress={handleImportContacts}
                icon="cloud-download"
                style={{ borderColor: '#03dac6' }}
                labelStyle={{ color: '#03dac6' }}
              >
                Import Contacts
              </ExportButton>
            </Card.Content>
          </ExportSection>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <ExportSection>
            <Card.Content style={{ padding: 24 }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '800', 
                marginBottom: 20, 
                color: '#1a1a1a',
                letterSpacing: 0.5
              }}>
                📍 Location Services
              </Text>
              
              <Text style={{ 
                fontSize: 14, 
                color: '#666666', 
                marginBottom: 20,
                lineHeight: 20
              }}>
                Manage location tracking, nearby contacts, and location-based features.
              </Text>

              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-around', 
                marginBottom: 20,
                backgroundColor: '#f8f9fa',
                borderRadius: 12,
                padding: 16
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1976D2' }}>
                    {locationStats.totalGeoContacts}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Geo Contacts</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF9800' }}>
                    {locationStats.activeTriggers}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Active Triggers</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: locationStats.isTracking ? '#4CAF50' : '#F44336' }}>
                    {locationStats.isTracking ? 'Yes' : 'No'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Tracking</Text>
                </View>
              </View>

              <ExportButton
                mode="contained"
                onPress={() => router.push('/location-settings')}
                icon="cog"
                style={{ backgroundColor: '#1976D2' }}
              >
                Location Settings
              </ExportButton>

              <ExportButton
                mode="outlined"
                onPress={() => router.push('/nearby-contacts')}
                icon="map-marker-multiple"
                style={{ borderColor: '#1976D2' }}
                labelStyle={{ color: '#1976D2' }}
              >
                Nearby Contacts
              </ExportButton>
            </Card.Content>
          </ExportSection>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <ExportSection>
            <Card.Content style={{ padding: 24 }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '800', 
                marginBottom: 20, 
                color: '#1a1a1a',
                letterSpacing: 0.5
              }}>
                🔗 Google Integration
              </Text>
              
              <Text style={{ 
                fontSize: 14, 
                color: '#666666', 
                marginBottom: 20,
                lineHeight: 20
              }}>
                Sync your contacts with Google and manage your Google account connection.
              </Text>

              {isSignedIn ? (
                <View style={{ gap: 12 }}>
                  {/* Sync Status */}
                  <View style={{ 
                    backgroundColor: '#f8f9fa',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8
                  }}>
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '600', 
                      marginBottom: 8,
                      color: '#1a1a1a'
                    }}>
                      Sync Status
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#666666',
                      marginBottom: 4
                    }}>
                      {isSyncing ? 'Syncing...' : 'Ready to sync'}
                    </Text>
                    {lastSyncTimestamp && (
                      <Text style={{ 
                        fontSize: 12, 
                        color: '#666666'
                      }}>
                        Last sync: {new Date(lastSyncTimestamp).toLocaleString()}
                      </Text>
                    )}
                  </View>

                  <ExportButton
                    mode="contained"
                    onPress={handleGoogleSync}
                    icon="sync"
                    loading={isSyncing}
                    disabled={isSyncing}
                    style={{ backgroundColor: '#4285F4' }}
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Google Contacts'}
                  </ExportButton>

                  <ExportButton
                    mode="outlined"
                    onPress={handleGoogleSignOut}
                    icon="logout"
                    loading={googleLoading}
                    disabled={googleLoading || isSyncing}
                    style={{ borderColor: '#DB4437' }}
                    labelStyle={{ color: '#DB4437' }}
                  >
                    Sign Out from Google
                  </ExportButton>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#666666', 
                    marginBottom: 12,
                    lineHeight: 20
                  }}>
                    Sign in with Google to sync your contacts and enable cloud backup.
                  </Text>
                  
                  <GoogleSignInButton 
                    onSignInComplete={() => {
                      setSnackbar({ visible: true, message: 'Successfully signed in with Google!' });
                    }}
                  />
                </View>
              )}
            </Card.Content>
          </ExportSection>
        </Animated.View>

        {/* Google Contact Groups Section */}
        {isSignedIn && googleGroups.length > 0 && (
          <Animated.View entering={FadeInUp.delay(350).springify()}>
            <ExportSection>
              <Card.Content style={{ padding: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: '800', 
                    color: '#1a1a1a',
                    letterSpacing: 0.5
                  }}>
                    📋 Google Contact Groups
                  </Text>
                  <IconButton
                    icon={showGoogleGroups ? "chevron-up" : "chevron-down"}
                    iconColor="#666"
                    size={24}
                    onPress={() => setShowGoogleGroups(!showGoogleGroups)}
                  />
                </View>
                
                <Text style={{ 
                  fontSize: 14, 
                  color: '#666666', 
                  marginBottom: 20,
                  lineHeight: 20
                }}>
                  Available contact groups in your Google account. These help map group IDs to actual names.
                </Text>

                {showGoogleGroups && (
                  <View style={{ 
                    backgroundColor: '#f8f9fa',
                    borderRadius: 12,
                    padding: 16,
                    maxHeight: 200
                  }}>
                    <ScrollView showsVerticalScrollIndicator={true}>
                      {googleGroups.map((group, index) => (
                        <View key={index} style={{ 
                          flexDirection: 'row', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingVertical: 8,
                          borderBottomWidth: index < googleGroups.length - 1 ? 1 : 0,
                          borderBottomColor: '#e0e0e0'
                        }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>
                              {group.name || 'Unnamed Group'}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                              {group.resourceName}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 12, color: '#999' }}>
                            {group.memberCount || 0} contacts
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </Card.Content>
            </ExportSection>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <ExportSection>
            <Card.Content style={{ padding: 24 }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '800', 
                marginBottom: 20, 
                color: '#1a1a1a',
                letterSpacing: 0.5
              }}>
                🚀 Quick Actions
              </Text>
              
              <Text style={{ 
                fontSize: 14, 
                color: '#666666', 
                marginBottom: 20,
                lineHeight: 20
              }}>
                Manage quick actions and app preferences.
              </Text>

              {/* App Availability Status */}
              <View style={{ 
                backgroundColor: '#f8f9fa',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  marginBottom: 12,
                  color: '#1a1a1a'
                }}>
                  App Availability
                </Text>
                
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>WhatsApp</Text>
                    </View>
                    <Ionicons 
                      name={appAvailability.whatsapp ? 'checkmark-circle' : 'close-circle'} 
                      size={20} 
                      color={appAvailability.whatsapp ? '#4CAF50' : '#f44336'} 
                    />
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="paper-plane" size={20} color="#0088cc" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>Telegram</Text>
                    </View>
                    <Ionicons 
                      name={appAvailability.telegram ? 'checkmark-circle' : 'close-circle'} 
                      size={20} 
                      color={appAvailability.telegram ? '#4CAF50' : '#f44336'} 
                    />
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="videocam" size={20} color="#2196F3" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>FaceTime</Text>
                    </View>
                    <Ionicons 
                      name={appAvailability.facetime ? 'checkmark-circle' : 'close-circle'} 
                      size={20} 
                      color={appAvailability.facetime ? '#4CAF50' : '#f44336'} 
                    />
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="chatbubble" size={20} color="#FF9800" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>SMS</Text>
                    </View>
                    <Ionicons 
                      name={appAvailability.sms ? 'checkmark-circle' : 'close-circle'} 
                      size={20} 
                      color={appAvailability.sms ? '#4CAF50' : '#f44336'} 
                    />
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="mail" size={20} color="#9C27B0" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>Email</Text>
                    </View>
                    <Ionicons 
                      name={appAvailability.email ? 'checkmark-circle' : 'close-circle'} 
                      size={20} 
                      color={appAvailability.email ? '#4CAF50' : '#f44336'} 
                    />
                  </View>
                </View>
              </View>

              {/* Quick Action Preferences */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  marginBottom: 12,
                  color: '#1a1a1a'
                }}>
                  Quick Action Preferences
                </Text>
                
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>Show WhatsApp</Text>
                    </View>
                    <Switch
                      value={quickActionSettings.enableWhatsApp}
                      onValueChange={(value) => handleQuickActionSettingChange('enableWhatsApp', value)}
                      trackColor={{ false: '#767577', true: '#25D366' }}
                      thumbColor={quickActionSettings.enableWhatsApp ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="paper-plane" size={20} color="#0088cc" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>Show Telegram</Text>
                    </View>
                    <Switch
                      value={quickActionSettings.enableTelegram}
                      onValueChange={(value) => handleQuickActionSettingChange('enableTelegram', value)}
                      trackColor={{ false: '#767577', true: '#0088cc' }}
                      thumbColor={quickActionSettings.enableTelegram ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="videocam" size={20} color="#2196F3" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>Show FaceTime</Text>
                    </View>
                    <Switch
                      value={quickActionSettings.enableFaceTime}
                      onValueChange={(value) => handleQuickActionSettingChange('enableFaceTime', value)}
                      trackColor={{ false: '#767577', true: '#2196F3' }}
                      thumbColor={quickActionSettings.enableFaceTime ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="chatbubble" size={20} color="#FF9800" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>Show SMS</Text>
                    </View>
                    <Switch
                      value={quickActionSettings.enableSMS}
                      onValueChange={(value) => handleQuickActionSettingChange('enableSMS', value)}
                      trackColor={{ false: '#767577', true: '#FF9800' }}
                      thumbColor={quickActionSettings.enableSMS ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="mail" size={20} color="#9C27B0" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>Show Email</Text>
                    </View>
                    <Switch
                      value={quickActionSettings.enableEmail}
                      onValueChange={(value) => handleQuickActionSettingChange('enableEmail', value)}
                      trackColor={{ false: '#767577', true: '#9C27B0' }}
                      thumbColor={quickActionSettings.enableEmail ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="eye" size={20} color="#666" />
                      <Text style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>Show Unavailable Apps</Text>
                    </View>
                    <Switch
                      value={quickActionSettings.showUnavailableActions}
                      onValueChange={(value) => handleQuickActionSettingChange('showUnavailableActions', value)}
                      trackColor={{ false: '#767577', true: '#666' }}
                      thumbColor={quickActionSettings.showUnavailableActions ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                </View>
              </View>

              <ExportButton
                mode="outlined"
                onPress={refreshAppAvailability}
                icon="refresh"
                style={{ borderColor: '#1976D2' }}
                labelStyle={{ color: '#1976D2' }}
              >
                Refresh App Detection
              </ExportButton>

              <ExportButton
                mode="outlined"
                onPress={() => {
                  quickActionsService.overrideWhatsAppAvailability(true);
                  setAppAvailability(prev => ({ ...prev, whatsapp: true }));
                  setSnackbar({ visible: true, message: 'WhatsApp manually enabled!' });
                }}
                icon="check-circle"
                style={{ borderColor: '#25D366', marginTop: 8 }}
                labelStyle={{ color: '#25D366' }}
              >
                Force Enable WhatsApp
              </ExportButton>
            </Card.Content>
          </ExportSection>
        </Animated.View>
      </ContentScroll>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
        style={{ 
          backgroundColor: '#6200ee', 
          borderRadius: 12,
          margin: 16
        }}
        action={{
          label: 'OK',
          onPress: () => setSnackbar({ visible: false, message: '' }),
        }}
      >
        {snackbar.message}
      </Snackbar>
    </Container>
  );
} 