import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Contact } from '../context/ContactsContext';
import QuickActionsService, { QuickAction } from '../services/QuickActionsService';

interface QuickActionsProps {
  contact: Contact;
  onActionExecuted?: () => void;
  showUnavailable?: boolean;
  maxActions?: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  contact,
  onActionExecuted,
  showUnavailable = false,
  maxActions = 6
}) => {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const quickActionsService = QuickActionsService.getInstance();

  useEffect(() => {
    loadQuickActions();
  }, [contact]);

  const loadQuickActions = async () => {
    try {
      setLoading(true);
      const availableActions = await quickActionsService.getQuickActions(contact);
      
      // Filter actions based on showUnavailable setting
      const filteredActions = showUnavailable 
        ? availableActions 
        : availableActions.filter(action => action.isAvailable);
      
      // Limit the number of actions shown
      const limitedActions = filteredActions.slice(0, maxActions);
      
      setActions(limitedActions);
    } catch (error) {
      console.error('Error loading quick actions:', error);
      Alert.alert('Error', 'Failed to load quick actions');
    } finally {
      setLoading(false);
    }
  };

  const handleActionPress = async (action: QuickAction) => {
    console.log('=== QUICK ACTION DEBUG ===');
    console.log('Action pressed:', action.name);
    console.log('Action ID:', action.id);
    console.log('Action platform:', action.platform);
    console.log('Action available:', action.isAvailable);
    console.log('Contact:', contact.name);
    console.log('Contact phone numbers:', contact.phoneNumbers);
    
    if (!action.isAvailable) {
      console.log('Action not available, showing alert');
      Alert.alert(
        'App Not Available',
        `${action.name} is not installed on your device.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Install', onPress: () => openAppStore(action.platform) }
        ]
      );
      return;
    }

    try {
      setExecutingAction(action.id);
      console.log('Executing action via service...');
      const success = await quickActionsService.executeQuickAction(action, contact);
      console.log('Action execution result:', success);
      
      if (success) {
        console.log('Action executed successfully');
        onActionExecuted?.();
      } else {
        console.log('Action execution failed');
        Alert.alert('Error', `Failed to open ${action.name}`);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      console.log('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `Failed to execute ${action.name}`);
    } finally {
      setExecutingAction(null);
      console.log('=== END QUICK ACTION DEBUG ===');
    }
  };

  const openAppStore = (platform: string) => {
    const appStoreUrls = {
      whatsapp: 'https://apps.apple.com/app/whatsapp-messenger/id310633997',
      telegram: 'https://apps.apple.com/app/telegram/id686449807',
      facetime: null, // Built into iOS
      sms: null, // Built into device
      email: null // Built into device
    };

    const url = appStoreUrls[platform as keyof typeof appStoreUrls];
    if (url) {
      // You can use Linking.openURL(url) here if you want to open the app store
      Alert.alert('Install App', `Please install ${platform} from the App Store.`);
    }
  };

  const getActionIcon = (action: QuickAction) => {
    const iconMap: { [key: string]: string } = {
      phone_call: 'call',
      facetime: 'videocam',
      whatsapp: 'logo-whatsapp',
      telegram: 'paper-plane',
      sms: 'chatbubble',
      email: 'mail'
    };

    return iconMap[action.id] || 'ellipsis-horizontal';
  };

  const getActionColor = (action: QuickAction) => {
    if (!action.isAvailable) {
      return '#ccc';
    }

    const colorMap: { [key: string]: string } = {
      phone_call: '#4CAF50',
      facetime: '#2196F3',
      whatsapp: '#25D366',
      telegram: '#0088cc',
      sms: '#FF9800',
      email: '#9C27B0'
    };

    return colorMap[action.id] || '#666';
  };

  const getActionBackground = (action: QuickAction) => {
    if (!action.isAvailable) {
      return '#f8f9fa';
    }

    const backgroundMap: { [key: string]: string } = {
      phone_call: '#f1f8e9',
      facetime: '#e3f2fd',
      whatsapp: '#e8f5e8',
      telegram: '#e1f5fe',
      sms: '#fff3e0',
      email: '#f3e5f5'
    };

    return backgroundMap[action.id] || '#f8f9fa';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading quick actions...</Text>
      </View>
    );
  }

  if (actions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No quick actions available</Text>
        <Text style={styles.emptySubtext}>
          Add phone numbers or email addresses to enable quick actions
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsContainer}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton,
              {
                backgroundColor: getActionBackground(action),
                borderColor: action.isAvailable ? getActionColor(action) : '#e0e0e0',
                opacity: action.isAvailable ? 1 : 0.6,
              }
            ]}
            onPress={() => handleActionPress(action)}
            disabled={executingAction === action.id}
            activeOpacity={0.8}
          >
            <View style={styles.actionContent}>
              {executingAction === action.id ? (
                <ActivityIndicator size="small" color={getActionColor(action)} />
              ) : (
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: action.isAvailable ? getActionColor(action) : '#e0e0e0' }
                ]}>
                  <Ionicons
                    name={getActionIcon(action) as any}
                    size={20}
                    color="white"
                  />
                </View>
              )}
              <Text style={[
                styles.actionText,
                { color: action.isAvailable ? '#333' : '#999' }
              ]}>
                {action.name}
              </Text>
            </View>
            {!action.isAvailable && (
              <View style={styles.unavailableBadge}>
                <Ionicons name="close" size={12} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {showUnavailable && actions.some(action => !action.isAvailable) && (
        <View style={styles.availabilityInfo}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.availabilityText}>
            Some apps are not installed. Tap to install from App Store.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 100,
    minHeight: 80,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  unavailableBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 6,
  },
  availabilityText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});

export default QuickActions; 