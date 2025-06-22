import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { Button, Card, Chip, Text, useTheme } from 'react-native-paper';
import styled from 'styled-components/native';
import { useContacts } from '../context/ContactsContext';
import VIPContactService, { VIPContactConfig } from '../services/VIPContactService';

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

const HeaderSection = styled.View`
  margin-bottom: 30px;
`;

const HeaderTitle = styled(Text)`
  font-size: 32px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
`;

const HeaderSubtitle = styled(Text)`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.3px;
`;

const SettingsCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 20px;
  elevation: 6;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 16px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const CardTitle = styled(Text)`
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16px;
  letter-spacing: 0.3px;
`;

const SettingRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

const SettingInfo = styled.View`
  flex: 1;
  margin-right: 16px;
`;

const SettingTitle = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
`;

const SettingDescription = styled(Text)`
  font-size: 14px;
  color: #666666;
  line-height: 20px;
`;

const VIPContactItem = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  background-color: #fff8e1;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid #ffd700;
`;

const VIPContactInfo = styled.View`
  flex: 1;
  margin-left: 12px;
`;

const VIPContactName = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
`;

const VIPContactPhone = styled(Text)`
  font-size: 14px;
  color: #666666;
`;

const StatsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-bottom: 20px;
`;

const StatItem = styled.View`
  align-items: center;
`;

const StatValue = styled(Text)`
  font-size: 24px;
  font-weight: 800;
  color: #FFD700;
  margin-bottom: 4px;
`;

const StatLabel = styled(Text)`
  font-size: 12px;
  color: #666666;
  text-align: center;
`;

export default function VIPSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { contacts } = useContacts();
  
  const [vipService] = useState(() => VIPContactService.getInstance());
  const [vipContacts, setVIPContacts] = useState<VIPContactConfig[]>([]);
  const [vipStats, setVIPStats] = useState({
    totalVIP: 0,
    withNotifications: 0,
    withEmergencyBypass: 0,
    recentInteractions: 0,
  });
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [settings, setSettings] = useState({
    enableNotifications: true,
    enableEmergencyBypass: true,
    bypassDND: true,
    bypassSilent: true,
    bypassVibration: true,
    customRingtone: false,
  });

  useEffect(() => {
    loadVIPData();
    checkPermissions();
  }, []);

  const loadVIPData = async () => {
    const contacts = vipService.getVIPContacts();
    const stats = await vipService.getVIPStats();
    setVIPContacts(contacts);
    setVIPStats(stats);
  };

  const checkPermissions = async () => {
    const granted = await vipService.requestPermissions();
    setPermissionsGranted(granted);
  };

  const handleAddVIPContact = async (contact: any) => {
    const primaryPhone = contact.phoneNumbers?.find((p: any) => p.isPrimary)?.number || 
                        contact.phoneNumbers?.[0]?.number || '';

    if (!primaryPhone) {
      Alert.alert('Error', 'Contact must have a phone number to be marked as VIP');
      return;
    }

    const config: VIPContactConfig = {
      contactId: contact.id,
      phoneNumber: primaryPhone,
      name: contact.name,
      enableNotifications: settings.enableNotifications,
      enableEmergencyBypass: settings.enableEmergencyBypass,
      priorityLevel: 'high',
      bypassDND: settings.bypassDND,
      bypassSilent: settings.bypassSilent,
      bypassVibration: settings.bypassVibration,
    };

    const success = await vipService.addVIPContact(config);
    if (success) {
      Alert.alert('Success', `${contact.name} has been added to VIP contacts!`);
      loadVIPData();
    } else {
      Alert.alert('Error', 'Failed to add contact to VIP list');
    }
  };

  const handleRemoveVIPContact = async (contactId: string) => {
    Alert.alert(
      'Remove VIP Contact',
      'Are you sure you want to remove this contact from VIP list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await vipService.removeVIPContact(contactId);
            if (success) {
              loadVIPData();
            }
          },
        },
      ]
    );
  };

  const renderVIPContact = (config: VIPContactConfig) => {
    const contact = contacts.find(c => c.id === config.contactId);
    
    return (
      <VIPContactItem key={config.contactId}>
        <Text style={{ fontSize: 24 }}>👑</Text>
        <VIPContactInfo>
          <VIPContactName>{config.name}</VIPContactName>
          <VIPContactPhone>{config.phoneNumber}</VIPContactPhone>
        </VIPContactInfo>
        <Button
          mode="outlined"
          onPress={() => handleRemoveVIPContact(config.contactId)}
          style={{ borderColor: '#f44336' }}
          textColor="#f44336"
        >
          Remove
        </Button>
      </VIPContactItem>
    );
  };

  return (
    <Container>
      <HeaderGradient
        colors={[theme.colors.primary, theme.colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <HeaderSection>
        <HeaderTitle>VIP Settings</HeaderTitle>
        <HeaderSubtitle>Configure VIP contact behavior and permissions</HeaderSubtitle>
      </HeaderSection>

      <ContentScroll>
        <StatsContainer>
          <StatItem>
            <StatValue>{vipStats.totalVIP}</StatValue>
            <StatLabel>VIP Contacts</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{vipStats.withNotifications}</StatValue>
            <StatLabel>With Notifications</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{vipStats.recentInteractions}</StatValue>
            <StatLabel>Recent Calls</StatLabel>
          </StatItem>
        </StatsContainer>

        <SettingsCard>
          <Card.Content>
            <CardTitle>🔔 Notification Settings</CardTitle>
            
            <SettingRow>
              <SettingInfo>
                <SettingTitle>Enable VIP Notifications</SettingTitle>
                <SettingDescription>
                  Show special notifications for VIP contacts
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={settings.enableNotifications}
                onValueChange={(value) => setSettings({ ...settings, enableNotifications: value })}
                trackColor={{ false: '#e0e0e0', true: '#FFD700' }}
                thumbColor={settings.enableNotifications ? '#FFA500' : '#f4f3f4'}
              />
            </SettingRow>

            <SettingRow>
              <SettingInfo>
                <SettingTitle>Bypass Do Not Disturb</SettingTitle>
                <SettingDescription>
                  Allow VIP contacts to break through DND mode
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={settings.bypassDND}
                onValueChange={(value) => setSettings({ ...settings, bypassDND: value })}
                trackColor={{ false: '#e0e0e0', true: '#FFD700' }}
                thumbColor={settings.bypassDND ? '#FFA500' : '#f4f3f4'}
              />
            </SettingRow>

            <SettingRow>
              <SettingInfo>
                <SettingTitle>Bypass Silent Mode</SettingTitle>
                <SettingDescription>
                  Allow VIP contacts to ring even in silent mode
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={settings.bypassSilent}
                onValueChange={(value) => setSettings({ ...settings, bypassSilent: value })}
                trackColor={{ false: '#e0e0e0', true: '#FFD700' }}
                thumbColor={settings.bypassSilent ? '#FFA500' : '#f4f3f4'}
              />
            </SettingRow>

            <SettingRow>
              <SettingInfo>
                <SettingTitle>Enhanced Vibration</SettingTitle>
                <SettingDescription>
                  Use special vibration pattern for VIP calls
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={settings.bypassVibration}
                onValueChange={(value) => setSettings({ ...settings, bypassVibration: value })}
                trackColor={{ false: '#e0e0e0', true: '#FFD700' }}
                thumbColor={settings.bypassVibration ? '#FFA500' : '#f4f3f4'}
              />
            </SettingRow>
          </Card.Content>
        </SettingsCard>

        <SettingsCard>
          <Card.Content>
            <CardTitle>🚨 Emergency Settings</CardTitle>
            
            <SettingRow>
              <SettingInfo>
                <SettingTitle>Emergency Bypass</SettingTitle>
                <SettingDescription>
                  Allow VIP contacts to bypass all restrictions (if supported)
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={settings.enableEmergencyBypass}
                onValueChange={(value) => setSettings({ ...settings, enableEmergencyBypass: value })}
                trackColor={{ false: '#e0e0e0', true: '#FFD700' }}
                thumbColor={settings.enableEmergencyBypass ? '#FFA500' : '#f4f3f4'}
              />
            </SettingRow>
          </Card.Content>
        </SettingsCard>

        <SettingsCard>
          <Card.Content>
            <CardTitle>👑 VIP Contacts ({vipContacts.length})</CardTitle>
            
            {vipContacts.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#666666', textAlign: 'center' }}>
                  No VIP contacts yet. Mark contacts as VIP from the main contact list.
                </Text>
              </View>
            ) : (
              vipContacts.map(renderVIPContact)
            )}
          </Card.Content>
        </SettingsCard>

        <SettingsCard>
          <Card.Content>
            <CardTitle>📱 Permissions</CardTitle>
            
            <SettingRow>
              <SettingInfo>
                <SettingTitle>Notification Permissions</SettingTitle>
                <SettingDescription>
                  Required for VIP notifications to work properly
                </SettingDescription>
              </SettingInfo>
              <Chip
                mode={permissionsGranted ? 'flat' : 'outlined'}
                textStyle={{ color: permissionsGranted ? 'white' : '#f44336' }}
                style={{ 
                  backgroundColor: permissionsGranted ? '#4CAF50' : 'transparent',
                  borderColor: permissionsGranted ? '#4CAF50' : '#f44336'
                }}
              >
                {permissionsGranted ? 'Granted' : 'Required'}
              </Chip>
            </SettingRow>

            {!permissionsGranted && (
              <Button
                mode="contained"
                onPress={checkPermissions}
                style={{ marginTop: 16, backgroundColor: '#FFD700' }}
                textColor="black"
              >
                Request Permissions
              </Button>
            )}
          </Card.Content>
        </SettingsCard>

        <Button
          mode="contained"
          onPress={() => router.back()}
          style={{ marginTop: 20, backgroundColor: theme.colors.primary }}
        >
          Done
        </Button>
      </ContentScroll>
    </Container>
  );
} 