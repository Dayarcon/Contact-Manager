import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { Contact } from '../context/ContactsContext';
import QuickActionsService, { QuickAction } from '../services/QuickActionsService';

interface QuickActionsProps {
  contact: Contact;
  onActionPress?: (action: QuickAction) => void;
  showLabels?: boolean;
  maxActions?: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  contact,
  onActionPress,
  showLabels = true,
  maxActions = 4
}) => {
  const theme = useTheme();
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const quickActionsService = QuickActionsService.getInstance();

  useEffect(() => {
    loadQuickActions();
  }, [contact]);

  const loadQuickActions = async () => {
    try {
      setLoading(true);
      const availableActions = await quickActionsService.getQuickActions(contact);
      const preferredActions = await quickActionsService.getPreferredQuickActions(contact);
      
      // Combine preferred actions with other available actions
      const allActions = [...preferredActions];
      availableActions.forEach(action => {
        if (!allActions.find(a => a.id === action.id)) {
          allActions.push(action);
        }
      });

      setActions(allActions.slice(0, maxActions));
    } catch (error) {
      console.error('Error loading quick actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionPress = async (action: QuickAction) => {
    try {
      if (onActionPress) {
        onActionPress(action);
        return;
      }

      const success = await quickActionsService.executeQuickAction(action, contact);
      
      if (!success) {
        Alert.alert(
          'Action Unavailable',
          `${action.name} is not available for this contact.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error executing quick action:', error);
      Alert.alert(
        'Error',
        `Failed to execute ${action.name}. Please try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getActionColor = (action: QuickAction) => {
    switch (action.type) {
      case 'call':
        return theme.colors.primary;
      case 'message':
        return theme.colors.secondary;
      case 'video':
        return theme.colors.tertiary;
      case 'email':
        return theme.colors.error;
      default:
        return theme.colors.onSurface;
    }
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <Card.Content>
          <View style={styles.loadingContainer}>
            <Text>Loading actions...</Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsContainer}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                { 
                  backgroundColor: action.isAvailable 
                    ? getActionColor(action) 
                    : theme.colors.surfaceDisabled 
                }
              ]}
              onPress={() => handleActionPress(action)}
              disabled={!action.isAvailable}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              {showLabels && (
                <Text style={[
                  styles.actionLabel,
                  { color: action.isAvailable ? 'white' : theme.colors.onSurfaceDisabled }
                ]}>
                  {action.name}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 60,
    minHeight: 60,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default QuickActions; 