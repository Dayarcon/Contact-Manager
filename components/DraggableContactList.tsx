import React, { useState } from 'react';
import { Dimensions, PanGestureHandler, View } from 'react-native';
import { Avatar, Card, Chip, IconButton, Text, useTheme } from 'react-native-paper';
import Animated, {
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import styled from 'styled-components/native';

const { width } = Dimensions.get('window');

const Container = styled.View`
  flex: 1;
  padding: 16px;
`;

const ContactCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 16px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  background-color: white;
  overflow: hidden;
`;

const ContactContent = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
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

const DragHandle = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
`;

const DropZone = styled.View<{ isActive: boolean }>`
  height: 4px;
  background-color: ${props => props.isActive ? '#6200ee' : 'transparent'};
  margin: 4px 0;
  border-radius: 2px;
  transition: background-color 0.2s ease;
`;

const EmptyState = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
`;

const EmptyIcon = styled.Text`
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.7;
`;

const EmptyTitle = styled(Text)`
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
  text-align: center;
  letter-spacing: 0.5px;
`;

const EmptySubtitle = styled(Text)`
  font-size: 16px;
  color: #666666;
  text-align: center;
  line-height: 24px;
  letter-spacing: 0.3px;
`;

interface Contact {
  id: string;
  name: string;
  company?: string;
  jobTitle?: string;
  phoneNumbers?: any[];
  group?: string;
  isFavorite?: boolean;
  imageUri?: string;
}

interface DraggableContactListProps {
  contacts: Contact[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onContactPress: (contact: Contact) => void;
  onContactEdit: (contactId: string) => void;
  onContactDelete: (contactId: string) => void;
  groupName?: string;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (contact: Contact) => {
  const colors = ['#6200ee', '#03dac6', '#ff6b35', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
  const index = contact.name.charCodeAt(0) % colors.length;
  return colors[index];
};

const DraggableContactItem = ({
  contact,
  index,
  onReorder,
  onContactPress,
  onContactEdit,
  onContactDelete,
  isDragging,
  dragIndex,
}: {
  contact: Contact;
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onContactPress: (contact: Contact) => void;
  onContactEdit: (contactId: string) => void;
  onContactDelete: (contactId: string) => void;
  isDragging: boolean;
  dragIndex: number;
}) => {
  const theme = useTheme();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const panGestureEvent = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startY = translateY.value;
      runOnJS(() => {
        // Notify parent that dragging started
      })();
    },
    onActive: (event, context: any) => {
      translateY.value = context.startY + event.translationY;
      scale.value = withSpring(1.05);
      opacity.value = withSpring(0.8);
      zIndex.value = 1000;
    },
    onEnd: (event) => {
      const targetIndex = Math.round(event.translationY / 80) + index;
      const clampedTargetIndex = Math.max(0, Math.min(targetIndex, 999)); // Adjust max based on your list size
      
      if (clampedTargetIndex !== index) {
        runOnJS(onReorder)(index, clampedTargetIndex);
      }
      
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
      zIndex.value = 0;
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: zIndex.value,
    };
  });

  const initials = getInitials(contact.name);
  const avatarColor = getAvatarColor(contact);
  const primaryPhone = contact.phoneNumbers?.find((p: any) => p.isPrimary)?.number || 
                      contact.phoneNumbers?.[0]?.number || '';

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
    <Animated.View style={animatedStyle}>
      <PanGestureHandler onGestureEvent={panGestureEvent} enabled={!isDragging}>
        <Animated.View>
          <ContactCard>
            <ContactContent>
              <DragHandle>
                <IconButton
                  icon="drag"
                  size={20}
                  iconColor="#666666"
                  style={{ margin: 0 }}
                />
              </DragHandle>
              
              {contact.imageUri ? (
                <Avatar.Image 
                  size={48} 
                  source={{ uri: contact.imageUri }}
                  style={{ 
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 6
                  }}
                />
              ) : (
                <Avatar.Text 
                  size={48} 
                  label={initials}
                  color="white"
                  style={{ 
                    backgroundColor: avatarColor,
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 6
                  }}
                />
              )}
              
              <ContactInfo>
                <ContactName>{contact.name}</ContactName>
                <ContactSubtitle>{getContactSubtitle()}</ContactSubtitle>
                {contact.group && (
                  <Chip 
                    style={{ 
                      height: 20, 
                      alignSelf: 'flex-start',
                      marginTop: 4
                    }}
                    textStyle={{ fontSize: 10 }}
                  >
                    {contact.group}
                  </Chip>
                )}
              </ContactInfo>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {contact.isFavorite && (
                  <IconButton
                    icon="star"
                    iconColor="#ff6b35"
                    size={20}
                    onPress={() => {/* Handle favorite toggle */}}
                  />
                )}
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => onContactEdit(contact.id)}
                />
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => onContactPress(contact)}
                />
              </View>
            </ContactContent>
          </ContactCard>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

export default function DraggableContactList({
  contacts,
  onReorder,
  onContactPress,
  onContactEdit,
  onContactDelete,
  groupName,
}: DraggableContactListProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(-1);

  if (contacts.length === 0) {
    return (
      <EmptyState>
        <EmptyIcon>📋</EmptyIcon>
        <EmptyTitle>No contacts in this group</EmptyTitle>
        <EmptySubtitle>
          {groupName 
            ? `Add contacts to the "${groupName}" group to get started`
            : 'Add contacts to get started with organizing your connections'
          }
        </EmptySubtitle>
      </EmptyState>
    );
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    onReorder(fromIndex, toIndex);
  };

  return (
    <Container>
      {contacts.map((contact, index) => (
        <DraggableContactItem
          key={contact.id}
          contact={contact}
          index={index}
          onReorder={handleReorder}
          onContactPress={onContactPress}
          onContactEdit={onContactEdit}
          onContactDelete={onContactDelete}
          isDragging={isDragging}
          dragIndex={dragIndex}
        />
      ))}
    </Container>
  );
} 