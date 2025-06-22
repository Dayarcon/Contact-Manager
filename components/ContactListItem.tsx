import * as Linking from 'expo-linking';
import React from 'react';
import { Dimensions, Vibration, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Avatar, Chip, IconButton, Text, TouchableRipple, useTheme } from 'react-native-paper';
import Animated, { SlideInRight } from 'react-native-reanimated';
import styled from 'styled-components/native';

const { width } = Dimensions.get('window');

const SwipeActionContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  width: ${width * 0.35}px;
  height: 100%;
  padding-right: 16px;
`;

const SwipeActionButton = styled.TouchableOpacity<{ backgroundColor: string }>`
  width: 70px;
  height: 80%;
  background-color: ${(props: { backgroundColor: string }) => props.backgroundColor};
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  border-radius: 16px;
  elevation: 6;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  shadow-offset: 0px 2px;
`;

const ActionIconContainer = styled.View`
  align-items: center;
  justify-content: center;
`;

const ActionLabel = styled(Text)`
  color: white;
  font-size: 10px;
  font-weight: 600;
  margin-top: 4px;
  text-align: center;
  letter-spacing: 0.2px;
`;

const ContactContent = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 20px;
  background-color: white;
  border-radius: 20px;
  margin: 0 16px 12px 16px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const ContactInfo = styled.View`
  flex: 1;
  margin-left: 16px;
`;

const ContactName = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
  letter-spacing: 0.3px;
`;

const ContactSubtitle = styled(Text)`
  font-size: 14px;
  color: #666666;
  margin-bottom: 4px;
  letter-spacing: 0.2px;
`;

const ActionButtons = styled.View`
  flex-direction: row;
  align-items: center;
`;

const AvatarContainer = styled.View`
  position: relative;
`;

const FavoriteBadge = styled.View`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: #ff6b35;
  align-items: center;
  justify-content: center;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
`;

const VIPBadge = styled.View`
  position: absolute;
  top: -4px;
  left: -4px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  align-items: center;
  justify-content: center;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  border: 2px solid white;
`;

const VIPBorder = styled.View<{ isVIP: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20px;
  border: ${(props: { isVIP: boolean }) => props.isVIP ? '2px solid #FFD700' : 'none'};
  pointer-events: none;
`;

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

  const handleCall = () => {
    if (primaryPhone) {
      // Enhanced haptic feedback for VIP contacts
      if (contact.isVIP) {
        Vibration.vibrate([0, 100, 50, 100, 50, 100]); // Special VIP pattern
      } else {
        Vibration.vibrate(50);
      }
      Linking.openURL(`tel:${primaryPhone}`);
    }
  };

  const handleMessage = () => {
    if (primaryPhone) {
      Vibration.vibrate(50);
      Linking.openURL(`sms:${primaryPhone}`);
    }
  };

  const handleDelete = () => {
    Vibration.vibrate(100);
    onDelete(contact.id);
  };

  const handleToggleVIP = (e: any) => {
    e.stopPropagation();
    Vibration.vibrate(30);
    onToggleVIP(contact.id);
  };

  const renderRightActions = () => (
    <SwipeActionContainer>
      <Animated.View entering={SlideInRight.delay(100).springify()}>
        <SwipeActionButton 
          backgroundColor={contact.isVIP ? "#FFD700" : "#4CAF50"}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <ActionIconContainer>
            <IconButton 
              icon="phone" 
              iconColor="white" 
              size={28}
              style={{ margin: 0 }}
            />
            <ActionLabel>{contact.isVIP ? "VIP Call" : "Call"}</ActionLabel>
          </ActionIconContainer>
        </SwipeActionButton>
      </Animated.View>
      
      <Animated.View entering={SlideInRight.delay(200).springify()}>
        <SwipeActionButton 
          backgroundColor="#2196F3"
          onPress={handleMessage}
          activeOpacity={0.8}
        >
          <ActionIconContainer>
            <IconButton 
              icon="message" 
              iconColor="white" 
              size={28}
              style={{ margin: 0 }}
            />
            <ActionLabel>Message</ActionLabel>
          </ActionIconContainer>
        </SwipeActionButton>
      </Animated.View>
      
      <Animated.View entering={SlideInRight.delay(300).springify()}>
        <SwipeActionButton 
          backgroundColor="#f44336"
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <ActionIconContainer>
            <IconButton 
              icon="delete" 
              iconColor="white" 
              size={28}
              style={{ margin: 0 }}
            />
            <ActionLabel>Delete</ActionLabel>
          </ActionIconContainer>
        </SwipeActionButton>
      </Animated.View>
    </SwipeActionContainer>
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
        <ContactContent>
          <VIPBorder isVIP={contact.isVIP} />
          
          <AvatarContainer>
            {contact.imageUri ? (
              <Avatar.Image 
                size={56} 
                source={{ uri: contact.imageUri }}
                style={{ 
                  elevation: 4,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 8
                }}
              />
            ) : (
              <Avatar.Text 
                size={56} 
                label={initials}
                color="white"
                style={{ 
                  backgroundColor: contact.isVIP ? '#FFD700' : avatarColor,
                  elevation: 4,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 8
                }}
              />
            )}
            {contact.isFavorite && (
              <FavoriteBadge>
                <Text style={{ color: 'white', fontSize: 10 }}>★</Text>
              </FavoriteBadge>
            )}
            {contact.isVIP && (
              <VIPBadge>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>👑</Text>
              </VIPBadge>
            )}
          </AvatarContainer>
          
          <ContactInfo>
            <ContactName style={{ color: contact.isVIP ? '#FFD700' : '#1a1a1a' }}>
              {contact.name}
              {contact.isVIP && ' 👑'}
            </ContactName>
            <ContactSubtitle>{getContactSubtitle()}</ContactSubtitle>
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
          </ContactInfo>
          
          <ActionButtons>
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
          </ActionButtons>
        </ContactContent>
      </TouchableRipple>
    </Swipeable>
  );
} 