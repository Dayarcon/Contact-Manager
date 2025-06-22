import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import React from 'react';
import { Alert, Dimensions, StyleSheet, TouchableOpacity, Vibration, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Avatar, Chip, IconButton, Text, TouchableRipple, useTheme } from 'react-native-paper';
import Animated, { SlideInRight } from 'react-native-reanimated';

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
}

export default function ContactListItem({ 
  contact, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  onToggleVIP,
  onPress 
}: ContactListItemProps) {
  const theme = useTheme();
  const initials = getInitials(contact.name);
  const avatarColor = getAvatarColor(contact);
  
  // Get primary phone number for quick actions
  const primaryPhone = contact.phoneNumbers?.find((p: any) => p.isPrimary)?.number || 
                      contact.phoneNumbers?.[0]?.number || '';

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

  const renderRightActions = () => (
    <View style={styles.swipeActionContainer}>
      <Animated.View entering={SlideInRight.delay(100).springify()}>
        <TouchableOpacity 
          style={[styles.swipeActionButton, { backgroundColor: contact.isVIP ? "#FFD700" : "#4CAF50" }]}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconContainer}>
            <IconButton 
              icon="phone" 
              iconColor="white" 
              size={28}
              style={{ margin: 0 }}
            />
            <Text style={styles.actionLabel}>{contact.isVIP ? "VIP Call" : "Call"}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View entering={SlideInRight.delay(200).springify()}>
        <TouchableOpacity 
          style={[styles.swipeActionButton, { backgroundColor: "#2196F3" }]}
          onPress={handleMessage}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconContainer}>
            <IconButton 
              icon="message" 
              iconColor="white" 
              size={28}
              style={{ margin: 0 }}
            />
            <Text style={styles.actionLabel}>Message</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View entering={SlideInRight.delay(300).springify()}>
        <TouchableOpacity 
          style={[styles.swipeActionButton, { backgroundColor: "#f44336" }]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconContainer}>
            <IconButton 
              icon="delete" 
              iconColor="white" 
              size={28}
              style={{ margin: 0 }}
            />
            <Text style={styles.actionLabel}>Delete</Text>
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
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <TouchableRipple onPress={() => onPress(contact)} rippleColor="rgba(0,0,0,0.1)">
        <View style={styles.contactContent}>
          <View style={[styles.vipBorder, { borderColor: contact.isVIP ? '#FFD700' : 'transparent' }]} />
          
          <View style={styles.avatarContainer}>
            {contact.imageUri ? (
              <Avatar.Image 
                size={56} 
                source={{ uri: contact.imageUri }}
                style={styles.avatarImage}
              />
            ) : (
              <Avatar.Text 
                size={56} 
                label={initials}
                color="white"
                style={[styles.avatarText, { backgroundColor: contact.isVIP ? '#FFD700' : avatarColor }]}
              />
            )}
            {contact.isFavorite && (
              <View style={styles.favoriteBadge}>
                <Text style={{ color: 'white', fontSize: 10 }}>★</Text>
              </View>
            )}
            {contact.isVIP && (
              <View style={styles.vipBadge}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>👑</Text>
              </View>
            )}
          </View>
          
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: contact.isVIP ? '#FFD700' : '#1a1a1a' }]}>
              {contact.name}
              {contact.isVIP && ' 👑'}
            </Text>
            <Text style={styles.contactSubtitle}>{getContactSubtitle()}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {contact.group && (
                <Chip 
                  style={{ 
                    height: 31, 
                    alignSelf: 'flex-start'
                  }}
                  textStyle={{ fontSize: 10 }}
                >
                  <Text style={{ fontSize: 10, color: 'black', fontWeight: '800' }}>
                    {contact.group}
                  </Text>
                </Chip>
              )}
              {contact.isVIP && (
                <Chip 
                  style={{ 
                    height: 31, 
                    alignSelf: 'flex-start',
                    backgroundColor: '#FFD700'
                  }}
                  textStyle={{ fontSize: 10 }}
                >
                  <Text style={{ fontSize: 10, color: 'black', fontWeight: '800' }}>
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
                size={24}
                onPress={handleToggleVIP}
              />
            )}
            {contact.isFavorite && (
              <IconButton
                icon="star"
                iconColor="#ff6b35"
                size={24}
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(contact.id);
                }}
              />
            )}
            <IconButton
              icon="dots-vertical"
              size={24}
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
}

const styles = StyleSheet.create({
  swipeActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: width * 0.35,
    height: '100%',
    paddingRight: 16,
  },
  swipeActionButton: {
    width: 70,
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  actionIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
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
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
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
    top: -4,
    left: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
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
    borderRadius: 20,
    borderWidth: 2,
    pointerEvents: 'none',
  },
}); 