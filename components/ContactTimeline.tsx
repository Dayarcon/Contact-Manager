import React from 'react';
import { Card, Chip, IconButton, Text, useTheme } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import styled from 'styled-components/native';

const TimelineContainer = styled.ScrollView`
  flex: 1;
  padding: 16px;
`;

const TimelineItem = styled(Card)`
  margin-bottom: 16px;
  border-radius: 16px;
  elevation: 3;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  background-color: white;
  border-left-width: 4px;
  border-left-color: #6200ee;
`;

const TimelineContent = styled.View`
  padding: 16px;
`;

const TimelineHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`;

const TimelineIcon = styled.View<{ backgroundColor: string }>`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props: { backgroundColor: string }) => props.backgroundColor};
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
`;

const TimelineInfo = styled.View`
  flex: 1;
`;

const TimelineTitle = styled(Text)`
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 2px;
  letter-spacing: 0.3px;
`;

const TimelineSubtitle = styled(Text)`
  font-size: 14px;
  color: #666666;
  letter-spacing: 0.2px;
`;

const TimelineTime = styled(Text)`
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
  letter-spacing: 0.2px;
`;

const TimelineDescription = styled(Text)`
  font-size: 14px;
  color: #333333;
  line-height: 20px;
  margin-top: 8px;
  letter-spacing: 0.2px;
`;

const TimelineTags = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 12px;
  gap: 8px;
`;

const EmptyTimeline = styled.View`
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

interface TimelineEvent {
  id: string;
  type: 'call' | 'message' | 'email' | 'meeting' | 'note' | 'birthday' | 'anniversary';
  title: string;
  description?: string;
  timestamp: string;
  duration?: string;
  tags?: string[];
  metadata?: any;
}

interface ContactTimelineProps {
  contactId: string;
  events: TimelineEvent[];
  contactName: string;
  contactImage?: string;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'call':
      return 'phone';
    case 'message':
      return 'message';
    case 'email':
      return 'email';
    case 'meeting':
      return 'calendar';
    case 'note':
      return 'note-text';
    case 'birthday':
      return 'cake-variant';
    case 'anniversary':
      return 'heart';
    default:
      return 'circle';
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'call':
      return '#4CAF50';
    case 'message':
      return '#2196F3';
    case 'email':
      return '#FF9800';
    case 'meeting':
      return '#9C27B0';
    case 'note':
      return '#607D8B';
    case 'birthday':
      return '#E91E63';
    case 'anniversary':
      return '#F44336';
    default:
      return '#6200ee';
  }
};

const getEventTitle = (type: string, metadata?: any) => {
  switch (type) {
    case 'call':
      return `Called ${metadata?.duration ? `(${metadata.duration})` : ''}`;
    case 'message':
      return 'Sent message';
    case 'email':
      return 'Sent email';
    case 'meeting':
      return `Meeting: ${metadata?.title || 'Scheduled meeting'}`;
    case 'note':
      return 'Added note';
    case 'birthday':
      return 'Birthday';
    case 'anniversary':
      return 'Anniversary';
    default:
      return 'Interaction';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 168) { // 7 days
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default function ContactTimeline({ 
  contactId, 
  events, 
  contactName, 
  contactImage 
}: ContactTimelineProps) {
  const theme = useTheme();

  if (events.length === 0) {
    return (
      <EmptyTimeline>
        <EmptyIcon>📅</EmptyIcon>
        <EmptyTitle>No interactions yet</EmptyTitle>
        <EmptySubtitle>
          Start interacting with {contactName} to build a timeline of your relationship
        </EmptySubtitle>
      </EmptyTimeline>
    );
  }

  const renderTimelineEvent = (event: TimelineEvent, index: number) => {
    const icon = getEventIcon(event.type);
    const color = getEventColor(event.type);
    const title = getEventTitle(event.type, event.metadata);
    const timestamp = formatTimestamp(event.timestamp);

    return (
      <Animated.View
        key={event.id}
        entering={FadeInUp.delay(index * 100).springify()}
      >
        <TimelineItem>
          <TimelineContent>
            <TimelineHeader>
              <TimelineIcon backgroundColor={color}>
                <IconButton
                  icon={icon}
                  iconColor="white"
                  size={20}
                  style={{ margin: 0 }}
                />
              </TimelineIcon>
              
              <TimelineInfo>
                <TimelineTitle>{title}</TimelineTitle>
                <TimelineSubtitle>{event.description}</TimelineSubtitle>
                <TimelineTime>{timestamp}</TimelineTime>
              </TimelineInfo>
            </TimelineHeader>
            
            {event.description && (
              <TimelineDescription>{event.description}</TimelineDescription>
            )}
          </TimelineContent>
        </TimelineItem>
      </Animated.View>
    );
  };

  return (
    <TimelineContainer>
      {events.map((event, index) => renderTimelineEvent(event, index))}
    </TimelineContainer>
  );
} 