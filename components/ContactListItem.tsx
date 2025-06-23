import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import React, { forwardRef, useImperativeHandle } from 'react';
import { Alert, Dimensions, StyleSheet, TouchableOpacity, Vibration, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Avatar, Chip, IconButton, Text, TouchableRipple, useTheme } from 'react-native-paper';
import Animated, { SlideInRight } from 'react-native-reanimated';
import {
  avatarSizes,
  badgeDimensions,
  borderRadius,
  chipDimensions,
  fontSizes,
  iconSizes,
  spacing
} from '../utils/responsive';

const { width } = Dimensions.get('window');

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (contact: any) => {
  const colors = ['#6200ee', '#03dac6', '#ff6b35', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
  const index = contact.name.charCodeAt(0) % colors.length;
  return colors[index];
};

interface ContactListItemProps {
  contact: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleVIP: (id: string) => void;
  onPress: (contact: any) => void;
  onSwipeOpen?: (contactId: string) => void;
}

export interface ContactListItemRef {
  close: () => void;
  closeImmediate: () => void;
}

const ContactListItem = forwardRef<ContactListItemRef, ContactListItemProps>(({ 
  contact, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  onToggleVIP,
  onPress,
  onSwipeOpen
}, ref) => {
  const theme = useTheme();
  const initials = getInitials(contact.name);
  const avatarColor = getAvatarColor(contact);
  const swipeableRef = React.useRef<Swipeable>(null);
  
  // Get primary phone number for quick actions
  const primaryPhone = contact.phoneNumbers?.find((p: any) => p.isPrimary)?.number || 
                      contact.phoneNumbers?.[0]?.number || '';

  useImperativeHandle(ref, () => ({
    close: () => {
      swipeableRef.current?.close();
    },
    closeImmediate: () => {
      // Close immediately by calling close without any delay
      swipeableRef.current?.close();
    }
  }));

  const handleCall = async () => {
    if (primaryPhone) {
      // Enhanced haptic feedback for VIP contacts
      if (contact.isVIP) {
        Vibration.vibrate([0, 100, 50, 100, 50, 100]); // Special VIP pattern
      } else {
        Vibration.vibrate(50);
      }
      
      try {
        const canOpen = await Linking.canOpenURL(`tel:${primaryPhone}`);
        if (canOpen) {
          await Linking.openURL(`tel:${primaryPhone}`);
        } else {
          // Fallback: show alert with phone number
          Alert.alert(
            'Phone Dialer Not Available',
            `Phone number: ${primaryPhone}\n\nThis device doesn't support phone calls or you're running in a simulator.`,
            [
              { text: 'Copy Number', onPress: () => Clipboard.setString(primaryPhone) },
              { text: 'OK', style: 'cancel' }
            ]
          );
        }
      } catch (error) {
        console.error('Error making phone call:', error);
        Alert.alert('Error', 'Failed to make phone call. Please try again.');
      }
    } else {
      Alert.alert('No Phone Number', 'This contact doesn\'t have a phone number.');
    }
  };

  const handleMessage = async () => {
    if (primaryPhone) {
      Vibration.vibrate(30);
      
      try {
        const canOpen = await Linking.canOpenURL(`sms:${primaryPhone}`);
        if (canOpen) {
          await Linking.openURL(`sms:${primaryPhone}`);
        } else {
          // Fallback: show alert with phone number
          Alert.alert(
            'SMS Not Available',
            `Phone number: ${primaryPhone}\n\nThis device doesn't support SMS or you're running in a simulator.`,
            [
              { text: 'Copy Number', onPress: () => Clipboard.setString(primaryPhone) },
              { text: 'OK', style: 'cancel' }
            ]
          );
        }
      } catch (error) {
        console.error('Error opening SMS:', error);
        Alert.alert('Error', 'Failed to open SMS. Please try again.');
      }
    } else {
      Alert.alert('No Phone Number', 'This contact doesn\'t have a phone number.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(contact.id) }
      ]
    );
  };

  const handleToggleVIP = (e: any) => {
    e.stopPropagation();
    Vibration.vibrate(30);
    onToggleVIP(contact.id);
  };

  const handleSwipeOpen = () => {
    if (onSwipeOpen) {
      onSwipeOpen(contact.id);
    }
  };

  const renderRightActions = () => (
    <View style={styles.swipeActionContainer}>
      {/* Call Action */}
      <Animated.View entering={SlideInRight.delay(50).springify()}>
        <TouchableOpacity 
          style={[styles.swipeActionButton, styles.callButton]}
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <View style={styles.actionContent}>
            <IconButton 
              icon="phone" 
              iconColor="white" 
              size={iconSizes.md}
              style={styles.actionIcon}
            />
            <Text style={styles.actionLabel}>Call</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Message Action */}
      <Animated.View entering={SlideInRight.delay(100).springify()}>
        <TouchableOpacity 
          style={[styles.swipeActionButton, styles.messageButton]}
          onPress={handleMessage}
          activeOpacity={0.7}
        >
          <View style={styles.actionContent}>
            <IconButton 
              icon="message" 
              iconColor="white" 
              size={iconSizes.md}
              style={styles.actionIcon}
            />
            <Text style={styles.actionLabel}>Message</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  const getContactSubtitle = () => {
    const parts = [];
    
    if (contact.company) {
      parts.push(contact.company);
    }
    
    if (contact.jobTitle) {
      parts.push(contact.jobTitle);
    }
    
    if (primaryPhone) {
      parts.push(primaryPhone);
    }
    
    return parts.join(' • ');
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={60}
      overshootRight={false}
      friction={1.5}
      enableTrackpadTwoFingerGesture={true}
      onSwipeableOpen={handleSwipeOpen}
    >
      <TouchableRipple onPress={() => onPress(contact)} rippleColor="rgba(0,0,0,0.1)">
        <View style={styles.contactContent}>
          <View style={[styles.vipBorder, { borderColor: contact.isVIP ? '#FFD700' : 'transparent' }]} />
          
          <View style={styles.avatarContainer}>
            {contact.imageUri ? (
              <Avatar.Image 
                size={avatarSizes.large} 
                source={{ uri: contact.imageUri }}
                style={styles.avatarImage}
              />
            ) : (
              <Avatar.Text 
                size={avatarSizes.large} 
                label={initials}
                color="white"
                style={[styles.avatarText, { backgroundColor: contact.isVIP ? '#FFD700' : avatarColor }]}
              />
            )}
            {contact.isFavorite && (
              <View style={styles.favoriteBadge}>
                <Text style={{ color: 'white', fontSize: fontSizes.xs }}>★</Text>
              </View>
            )}
            {contact.isVIP && (
              <View style={styles.vipBadge}>
                <Text style={{ color: 'white', fontSize: fontSizes.sm, fontWeight: 'bold' }}>👑</Text>
              </View>
            )}
          </View>
          
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: contact.isVIP ? '#FFD700' : '#1a1a1a' }]}>
              {contact.name}
              {contact.isVIP && ' 👑'}
            </Text>
            <Text style={styles.contactSubtitle}>{getContactSubtitle()}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
              {contact.group && (
                <Chip 
                  style={{ 
                    height: chipDimensions.height, 
                    alignSelf: 'flex-start'
                  }}
                  textStyle={{ fontSize: fontSizes.xs }}
                >
                  <Text style={{ fontSize: fontSizes.xs, color: 'black', fontWeight: '800' }}>
                    {contact.group}
                  </Text>
                </Chip>
              )}
              {contact.isVIP && (
                <Chip 
                  style={{ 
                    height: chipDimensions.height, 
                    alignSelf: 'flex-start',
                    backgroundColor: '#FFD700'
                  }}
                  textStyle={{ fontSize: fontSizes.xs }}
                >
                  <Text style={{ fontSize: fontSizes.xs, color: 'black', fontWeight: '800' }}>
                    VIP
                  </Text>
                </Chip>
              )}
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            {contact.isVIP && (
              <IconButton
                icon="crown"
                iconColor="#FFD700"
                size={iconSizes.md}
                onPress={handleToggleVIP}
              />
            )}
            {contact.isFavorite && (
              <IconButton
                icon="star"
                iconColor="#ff6b35"
                size={iconSizes.md}
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(contact.id);
                }}
              />
            )}
            <IconButton
              icon="dots-vertical"
              size={iconSizes.md}
              onPress={(e) => {
                e.stopPropagation();
                onPress(contact);
              }}
            />
          </View>
        </View>
      </TouchableRipple>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  swipeActionContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: width * 0.30,
    height: '100%',
    gap: 10,
    marginTop: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  swipeActionButton: {
    width: 70, // Fixed equal width for both buttons
    height: 70, // Fixed equal height for both buttons
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  actionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    margin: 0,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    color: 'white',
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  messageButton: {
    backgroundColor: '#2196F3',
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'white',
    borderRadius: borderRadius.xl,
    margin: spacing.md,
    marginBottom: spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  contactSubtitle: {
    fontSize: fontSizes.md,
    color: '#666666',
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarText: {
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  favoriteBadge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    width: badgeDimensions.size,
    height: badgeDimensions.size,
    borderRadius: badgeDimensions.size / 2,
    backgroundColor: '#ff6b35',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  vipBadge: {
    position: 'absolute',
    top: -spacing.xs,
    left: -spacing.xs,
    width: badgeDimensions.size + spacing.xs,
    height: badgeDimensions.size + spacing.xs,
    borderRadius: (badgeDimensions.size + spacing.xs) / 2,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  vipBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    pointerEvents: 'none',
  },
});

export default ContactListItem; 