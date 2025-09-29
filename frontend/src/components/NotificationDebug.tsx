import React from 'react';
import { Button, Box, Typography, Paper } from '@mui/material';
import { useNotifications } from '../contexts/NotificationContext';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

const NotificationDebug: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    testNotification, 
    testMessageNotification,
    clearAllNotifications,
    clearDismissedNotifications 
  } = useNotifications();
  const { socket, isConnected } = useSocket();
  const { state } = useAuth();

  const handleTestSocket = () => {
    if (socket && isConnected) {
      console.log('🧪 Testing socket connection...');
      socket.emit('test', { message: 'Hello from frontend!' });
    } else {
      console.log('❌ Socket not connected');
    }
  };

  const handleJoinConversation = () => {
    if (socket && isConnected) {
      console.log('🧪 Joining test conversation...');
      socket.emit('join_conversation', 'test-conversation-123');
    } else {
      console.log('❌ Socket not connected');
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Notification Debug Panel
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Socket Status:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </Typography>
        <Typography variant="body2">
          <strong>User ID:</strong> {state.user?.id || 'Not authenticated'}
        </Typography>
        <Typography variant="body2">
          <strong>Notifications Count:</strong> {notifications.length}
        </Typography>
        <Typography variant="body2">
          <strong>Unread Count:</strong> {unreadCount}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={testNotification}
          size="small"
        >
          Test Basic Notification
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={testMessageNotification}
          size="small"
        >
          Test Message Notification
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={handleTestSocket}
          size="small"
        >
          Test Socket
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={handleJoinConversation}
          size="small"
        >
          Join Test Conversation
        </Button>
        
        <Button 
          variant="outlined" 
          color="error" 
          onClick={clearAllNotifications}
          size="small"
        >
          Clear All
        </Button>
        
        <Button 
          variant="outlined" 
          color="warning" 
          onClick={clearDismissedNotifications}
          size="small"
        >
          Clear Dismissed
        </Button>
      </Box>

      {notifications.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Notifications:
          </Typography>
          {notifications.slice(0, 3).map((notif) => (
            <Box key={notif.id} sx={{ p: 1, border: '1px solid #ccc', mb: 1, borderRadius: 1 }}>
              <Typography variant="caption" display="block">
                <strong>{notif.title}</strong> - {notif.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Type: {notif.type} | Read: {notif.isRead ? 'Yes' : 'No'}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default NotificationDebug;
