import React from 'react';
import { Badge } from '@mui/material';
import { Message } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface MessageNotificationProps {
  onClose?: () => void;
}

const MessageNotification: React.FC<MessageNotificationProps> = ({ onClose }) => {
  const { state } = useAuth();
  const { notifications, isMessagesPageActive } = useNotifications();

  // Calculate unread message count from notifications
  // If MessagesPage is active, don't show unread count as notifications are suppressed
  const unreadCount = isMessagesPageActive ? 0 : notifications.filter(n => n.type === 'message' && !n.isRead).length;



  return (
    <>
      {/* Notification Badge in Header */}
      <Badge
        badgeContent={unreadCount}
        color="error"
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: '#ef4444',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.75rem',
            minWidth: 20,
            height: 20,
          },
        }}
      >
        <Message />
      </Badge>
    </>
  );
};

export default MessageNotification;
