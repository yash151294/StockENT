import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  Typography,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Message,
  Gavel,
  Close,
  MarkEmailRead,
  ClearAll,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { getImageUrl } from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationDropdownProps {
  onClose?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, markNotificationsViewed, removeNotification, clearAllNotifications } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // Mark notifications as viewed when dropdown is opened
    markNotificationsViewed();
  };

  const handleClose = () => {
    setAnchorEl(null);
    onClose?.();
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.onClick) {
      notification.onClick();
    } else {
      // Default navigation based on notification type
      if (notification.type === 'message' && notification.data.conversationId) {
        navigate(`/messages?conversation=${notification.data.conversationId}`);
      } else if (notification.type === 'auction_activity' && notification.data.auctionId) {
        navigate(`/auctions/${notification.data.auctionId}`);
      }
    }
    handleClose();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <Message />;
      case 'auction_activity':
        return <Gavel />;
      default:
        return <Notifications />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return '#3b82f6'; // Blue
      case 'auction_activity':
        return '#f59e0b'; // Amber
      default:
        return '#6b7280'; // Gray
    }
  };

  const getActivityTypeColor = (activityType?: string) => {
    switch (activityType) {
      case 'bid_placed':
        return '#10b981'; // Green
      case 'auction_started':
        return '#3b82f6'; // Blue
      case 'auction_ended':
        return '#ef4444'; // Red
      case 'outbid':
        return '#f59e0b'; // Amber
      case 'won':
        return '#10b981'; // Green
      case 'lost':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  return (
    <>
      {/* Notification Button */}
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ mr: 1 }}
        aria-label="notifications"
      >
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
          {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
        </Badge>
      </IconButton>

      {/* Notification Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            backgroundColor: 'rgba(17, 17, 17, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(99, 102, 241, 0.2)',
            '& .MuiMenuItem-root': {
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
              },
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkEmailRead />}
                  onClick={handleMarkAllAsRead}
                  sx={{
                    color: '#6366f1',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                  }}
                >
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  size="small"
                  startIcon={<ClearAll />}
                  onClick={handleClearAll}
                  sx={{
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                  }}
                >
                  Clear all
                </Button>
              )}
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No notifications yet
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <ListItem
                      button
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                        backgroundColor: notification.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                        '&:hover': {
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor: getNotificationColor(notification.type),
                            width: 40,
                            height: 40,
                          }}
                        >
                          {notification.data.senderProfileImageUrl ? (
                            <Avatar
                              src={getImageUrl(notification.data.senderProfileImageUrl, 'avatar')}
                              sx={{ width: 40, height: 40 }}
                            />
                          ) : (
                            getNotificationIcon(notification.type)
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Primary content */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: 'white',
                              fontWeight: notification.isRead ? 500 : 600,
                              fontSize: '0.9rem',
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.isRead && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#6366f1',
                              }}
                            />
                          )}
                          {notification.data.activityType && (
                            <Chip
                              label={notification.data.activityType.replace('_', ' ')}
                              size="small"
                              sx={{
                                backgroundColor: `${getActivityTypeColor(notification.data.activityType)}20`,
                                color: getActivityTypeColor(notification.data.activityType),
                                fontSize: '0.65rem',
                                height: 20,
                                '& .MuiChip-label': {
                                  px: 1,
                                },
                              }}
                            />
                          )}
                        </Box>

                        {/* Secondary content */}
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            mb: 0.5,
                            lineHeight: 1.3,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        {notification.data.productTitle && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.6)',
                              display: 'block',
                              mb: 0.5,
                            }}
                          >
                            {notification.data.productTitle}
                          </Typography>
                        )}
                        {notification.data.unreadCount && notification.data.unreadCount > 1 && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#6366f1',
                              display: 'block',
                              mb: 0.5,
                              fontWeight: 500,
                            }}
                          >
                            {notification.data.unreadCount} unread messages
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.5)',
                              fontSize: '0.7rem',
                            }}
                          >
                            {formatTime(notification.createdAt)}
                          </Typography>
                          <ArrowForward sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.4)' }} />
                        </Box>
                      </Box>
                      
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          sx={{
                            color: 'rgba(255, 255, 255, 0.4)',
                            '&:hover': {
                              color: '#ef4444',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            },
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box sx={{ p: 2, borderTop: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                navigate('/notifications');
                handleClose();
              }}
              sx={{
                borderColor: 'rgba(99, 102, 241, 0.4)',
                color: '#6366f1',
                '&:hover': {
                  borderColor: '#6366f1',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                },
              }}
            >
              View All Notifications
            </Button>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationDropdown;
