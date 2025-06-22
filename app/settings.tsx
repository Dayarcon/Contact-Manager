import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Card, IconButton, Snackbar, Text } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import styled from 'styled-components/native';
import { useContacts } from '../context/ContactsContext';

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

export default function SettingsScreen() {
  const router = useRouter();
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { contacts, importContacts, isLoading } = useContacts() || {
    contacts: [],
    importContacts: () => console.warn('Context not available'),
    isLoading: true
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

  return (
    <Container>
      <HeaderGradient
        colors={['#6200ee', '#7c4dff', '#9c27b0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
          iconColor="white"
          size={28}
          onPress={() => router.back()}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        />
        <Text style={{ 
          flex: 1, 
          color: 'white', 
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