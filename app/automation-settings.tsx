import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Switch } from 'react-native';
import { Button, Card, Chip, Divider, Text, useTheme } from 'react-native-paper';
import styled from 'styled-components/native';
import { useContacts } from '../context/ContactsContext';
import AutoTaggingService, { TagRule } from '../services/AutoTaggingService';
import GeoLocationService, { GeoLocationSettings } from '../services/GeoLocationService';
import ScheduledMessagingService, { MessagingSettings } from '../services/ScheduledMessagingService';
import SmartRemindersService, { ReminderSettings } from '../services/SmartRemindersService';

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
  color: #6200ee;
  margin-bottom: 4px;
`;

const StatLabel = styled(Text)`
  font-size: 12px;
  color: #666666;
  text-align: center;
`;

const TagRuleItem = styled.View`
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 12px;
  border-left-width: 4px;
  border-left-color: #6200ee;
`;

const TagRuleName = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
`;

const TagRuleDescription = styled(Text)`
  font-size: 14px;
  color: #666666;
  margin-bottom: 8px;
`;

const TagRuleStatus = styled.View`
  flex-direction: row;
  align-items: center;
`;

const StatusChip = styled(Chip)`
  margin-right: 8px;
`;

export default function AutomationSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { contacts, runBatchAutomation } = useContacts();
  
  // Initialize services
  const [remindersService] = useState(() => SmartRemindersService.getInstance());
  const [taggingService] = useState(() => AutoTaggingService.getInstance());
  const [messagingService] = useState(() => ScheduledMessagingService.getInstance());
  const [geoService] = useState(() => GeoLocationService.getInstance());

  // State for settings
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enableBirthdayReminders: true,
    enableAnniversaryReminders: true,
    reminderDaysInAdvance: 3,
    enableAutoMessages: false,
    customMessageTemplate: 'Happy {type} {name}! 🎉'
  });

  const [messagingSettings, setMessagingSettings] = useState<MessagingSettings>({
    enableAutoBirthdayMessages: true,
    enableAutoAnniversaryMessages: true,
    defaultMessageTime: "09:00",
    customBirthdayMessage: 'Happy Birthday {name}! 🎉',
    customAnniversaryMessage: 'Happy Anniversary {name}! 💍'
  });

  const [geoSettings, setGeoSettings] = useState<GeoLocationSettings>({
    enableLocationTracking: true,
    enableGeoReminders: true,
    defaultRadius: 1000,
    maxSuggestions: 5,
    enableBackgroundLocation: false,
    locationUpdateInterval: 15,
    locationAccuracy: 'balanced'
  });

  const [tagRules, setTagRules] = useState<TagRule[]>([]);
  const [stats, setStats] = useState({
    totalReminders: 0,
    totalScheduledMessages: 0,
    totalTagRules: 0,
    totalGeoContacts: 0,
    upcomingReminders: 0,
    upcomingMessages: 0
  });

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const reminderSettings = remindersService.getSettings();
      const messagingSettings = messagingService.getSettings();
      const geoSettings = geoService.getSettings();
      const tagRules = taggingService.getTagRules();

      setReminderSettings(reminderSettings);
      setMessagingSettings(messagingSettings);
      setGeoSettings(geoSettings);
      setTagRules(tagRules);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const reminders = remindersService.getReminders();
      const scheduledMessages = messagingService.getScheduledMessages();
      const upcomingReminders = remindersService.getUpcomingReminders();
      const upcomingMessages = messagingService.getPendingMessages();
      const geoContacts = geoService.getGeoContacts();

      setStats({
        totalReminders: reminders.length,
        totalScheduledMessages: scheduledMessages.length,
        totalTagRules: tagRules.length,
        totalGeoContacts: geoContacts.length,
        upcomingReminders: upcomingReminders.length,
        upcomingMessages: upcomingMessages.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleReminderSettingChange = async (key: keyof ReminderSettings, value: any) => {
    const updatedSettings = { ...reminderSettings, [key]: value };
    setReminderSettings(updatedSettings);
    await remindersService.updateReminderSettings(updatedSettings);
  };

  const handleMessagingSettingChange = async (key: keyof MessagingSettings, value: any) => {
    const updatedSettings = { ...messagingSettings, [key]: value };
    setMessagingSettings(updatedSettings);
    await messagingService.updateSettings(updatedSettings);
  };

  const handleGeoSettingChange = async (key: keyof GeoLocationSettings, value: any) => {
    const updatedSettings = { ...geoSettings, [key]: value };
    setGeoSettings(updatedSettings);
    await geoService.updateSettings(updatedSettings);
  };

  const handleRunBatchAutomation = async () => {
    try {
      Alert.alert(
        'Run Batch Automation',
        'This will process all contacts and apply automation features. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Run',
            onPress: async () => {
              await runBatchAutomation();
              loadStats();
              Alert.alert('Success', 'Batch automation completed successfully!');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error running batch automation:', error);
      Alert.alert('Error', 'Failed to run batch automation');
    }
  };

  const renderTagRule = (rule: TagRule) => (
    <TagRuleItem key={rule.id}>
      <TagRuleName>{rule.name}</TagRuleName>
      <TagRuleDescription>{rule.description}</TagRuleDescription>
      <TagRuleStatus>
        <StatusChip
          mode={rule.isEnabled ? 'flat' : 'outlined'}
          textStyle={{ color: rule.isEnabled ? 'white' : '#666666' }}
          style={{ 
            backgroundColor: rule.isEnabled ? '#4CAF50' : 'transparent',
            borderColor: rule.isEnabled ? '#4CAF50' : '#666666'
          }}
        >
          {rule.isEnabled ? 'Enabled' : 'Disabled'}
        </StatusChip>
        <StatusChip
          mode={rule.autoApply ? 'flat' : 'outlined'}
          textStyle={{ color: rule.autoApply ? 'white' : '#666666' }}
          style={{ 
            backgroundColor: rule.autoApply ? '#2196F3' : 'transparent',
            borderColor: rule.autoApply ? '#2196F3' : '#666666'
          }}
        >
          {rule.autoApply ? 'Auto-Apply' : 'Manual'}
        </StatusChip>
      </TagRuleStatus>
    </TagRuleItem>
  );

  return (
    <Container>
      <HeaderGradient
        colors={[theme.colors.primary, theme.colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <HeaderSection>
        <HeaderTitle>Automation Settings</HeaderTitle>
        <HeaderSubtitle>Configure smart features and automation</HeaderSubtitle>
      </HeaderSection>

      <ContentScroll>
        <StatsContainer>
          <StatItem>
            <StatValue>{stats.totalReminders}</StatValue>
            <StatLabel>Reminders</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.totalScheduledMessages}</StatValue>
            <StatLabel>Scheduled Messages</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.totalTagRules}</StatValue>
            <StatLabel>Tag Rules</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.totalGeoContacts}</StatValue>
            <StatLabel>Geo Contacts</StatLabel>
          </StatItem>
        </StatsContainer>

        <SettingsCard>
          <Card.Content>
            <CardTitle>🔔 Smart Reminders</CardTitle>
            
            <SettingRow>
              <SettingInfo>
                <SettingTitle>Birthday Reminders</SettingTitle>
                <SettingDescription>
                  Automatically create reminders for upcoming birthdays
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={reminderSettings.enableBirthdayReminders}
                onValueChange={(value) => handleReminderSettingChange('enableBirthdayReminders', value)}
                trackColor={{ false: '#e0e0e0', true: '#6200ee' }}
                thumbColor={reminderSettings.enableBirthdayReminders ? '#ffffff' : '#f4f3f4'}
              />
            </SettingRow>

            <SettingRow>
              <SettingInfo>
                <SettingTitle>Anniversary Reminders</SettingTitle>
                <SettingDescription>
                  Automatically create reminders for upcoming anniversaries
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={reminderSettings.enableAnniversaryReminders}
                onValueChange={(value) => handleReminderSettingChange('enableAnniversaryReminders', value)}
                trackColor={{ false: '#e0e0e0', true: '#6200ee' }}
                thumbColor={reminderSettings.enableAnniversaryReminders ? '#ffffff' : '#f4f3f4'}
              />
            </SettingRow>

            <SettingRow>
              <SettingInfo>
                <SettingTitle>Auto Messages</SettingTitle>
                <SettingDescription>
                  Automatically send birthday/anniversary messages
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={reminderSettings.enableAutoMessages}
                onValueChange={(value) => handleReminderSettingChange('enableAutoMessages', value)}
                trackColor={{ false: '#e0e0e0', true: '#6200ee' }}
                thumbColor={reminderSettings.enableAutoMessages ? '#ffffff' : '#f4f3f4'}
              />
            </SettingRow>
          </Card.Content>
        </SettingsCard>

        <SettingsCard>
          <Card.Content>
            <CardTitle>🏷️ Auto Tagging</CardTitle>
            
            <SettingRow>
              <SettingInfo>
                <SettingTitle>Smart Tagging</SettingTitle>
                <SettingDescription>
                  Automatically assign labels based on contact information
                </SettingDescription>
              </SettingInfo>
              <Chip mode="flat" style={{ backgroundColor: '#4CAF50' }}>
                <Text style={{ color: 'white' }}>Active</Text>
              </Chip>
            </SettingRow>

            <Divider style={{ marginVertical: 16 }} />

            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
              Tag Rules ({tagRules.filter(r => r.isEnabled).length} active)
            </Text>

            {tagRules.slice(0, 3).map(renderTagRule)}
            
            {tagRules.length > 3 && (
              <Button
                mode="text"
                onPress={() => {/* Navigate to tag rules screen */}}
                style={{ marginTop: 8 }}
              >
                View All {tagRules.length} Rules
              </Button>
            )}
          </Card.Content>
        </SettingsCard>

        <SettingsCard>
          <Card.Content>
            <CardTitle>📱 Scheduled Messaging</CardTitle>
            
            <SettingRow>
              <SettingInfo>
                <SettingTitle>Birthday Messages</SettingTitle>
                <SettingDescription>
                  Automatically schedule birthday messages
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={messagingSettings.enableAutoBirthdayMessages}
                onValueChange={(value) => handleMessagingSettingChange('enableAutoBirthdayMessages', value)}
                trackColor={{ false: '#e0e0e0', true: '#6200ee' }}
                thumbColor={messagingSettings.enableAutoBirthdayMessages ? '#ffffff' : '#f4f3f4'}
              />
            </SettingRow>

            <SettingRow>
              <SettingInfo>
                <SettingTitle>Anniversary Messages</SettingTitle>
                <SettingDescription>
                  Automatically schedule anniversary messages
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={messagingSettings.enableAutoAnniversaryMessages}
                onValueChange={(value) => handleMessagingSettingChange('enableAutoAnniversaryMessages', value)}
                trackColor={{ false: '#e0e0e0', true: '#6200ee' }}
                thumbColor={messagingSettings.enableAutoAnniversaryMessages ? '#ffffff' : '#f4f3f4'}
              />
            </SettingRow>

            <SettingRow>
              <SettingInfo>
                <SettingTitle>Default Message Time</SettingTitle>
                <SettingDescription>
                  Time to send scheduled messages
                </SettingDescription>
              </SettingInfo>
              <Chip mode="outlined">
                <Text>{messagingSettings.defaultMessageTime}</Text>
              </Chip>
            </SettingRow>
          </Card.Content>
        </SettingsCard>

        <SettingsCard>
          <Card.Content>
            <CardTitle>📍 Location Services</CardTitle>
            
            <SettingRow>
              <SettingInfo>
                <SettingTitle>Location Tracking</SettingTitle>
                <SettingDescription>
                  Track location for geo-based suggestions
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={geoSettings.enableLocationTracking}
                onValueChange={(value) => handleGeoSettingChange('enableLocationTracking', value)}
                trackColor={{ false: '#e0e0e0', true: '#6200ee' }}
                thumbColor={geoSettings.enableLocationTracking ? '#ffffff' : '#f4f3f4'}
              />
            </SettingRow>

            <SettingRow>
              <SettingInfo>
                <SettingTitle>Geo Reminders</SettingTitle>
                <SettingDescription>
                  Suggest contacts when near their locations
                </SettingDescription>
              </SettingInfo>
              <Switch
                value={geoSettings.enableGeoReminders}
                onValueChange={(value) => handleGeoSettingChange('enableGeoReminders', value)}
                trackColor={{ false: '#e0e0e0', true: '#6200ee' }}
                thumbColor={geoSettings.enableGeoReminders ? '#ffffff' : '#f4f3f4'}
              />
            </SettingRow>

            <SettingRow>
              <SettingInfo>
                <SettingTitle>Default Radius</SettingTitle>
                <SettingDescription>
                  Distance for nearby contact suggestions
                </SettingDescription>
              </SettingInfo>
              <Chip mode="outlined">
                <Text>{(geoSettings.defaultRadius / 1000).toFixed(1)} km</Text>
              </Chip>
            </SettingRow>
          </Card.Content>
        </SettingsCard>

        <SettingsCard>
          <Card.Content>
            <CardTitle>⚡ Batch Operations</CardTitle>
            
            <Text style={{ fontSize: 14, color: '#666666', marginBottom: 16, lineHeight: 20 }}>
              Process all contacts and apply automation features. This will generate reminders, 
              schedule messages, and apply tags to all your contacts.
            </Text>

            <Button
              mode="contained"
              onPress={handleRunBatchAutomation}
              style={{ backgroundColor: '#6200ee' }}
              contentStyle={{ height: 48 }}
            >
              Run Batch Automation
            </Button>
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