# Real-Time Auction Status Updates

## Overview

This document describes the real-time auction status update functionality that automatically moves auctions between "Live Auctions", "Upcoming", and "Ended" sections without requiring page refreshes.

## Architecture

### Backend Components

1. **Socket.io Events** (`backend/src/utils/socket.js`)
   - `auction_status_changed`: Broadcasts when auction status changes
   - `auction_started`: Emitted when auction transitions from SCHEDULED to ACTIVE
   - `auction_ended`: Emitted when auction transitions from ACTIVE to ENDED
   - `auction_batch_processed`: Emitted when cron job processes multiple auctions

2. **Auction Service** (`backend/src/services/auctionService.js`)
   - `startAuction()`: Emits real-time events when auction starts
   - `endAuction()`: Emits real-time events when auction ends
   - `processScheduledAuctions()`: Processes auctions and emits batch events

3. **Cron Jobs** (`backend/src/cron/auctionCron.js`)
   - Runs every minute to check for auctions that need status changes
   - Automatically triggers real-time events when status changes occur

### Frontend Components

1. **Socket Context** (`frontend/src/contexts/SocketContext.tsx`)
   - Handles socket connection and authentication
   - Listens for auction status change events
   - Provides socket methods to components

2. **Auctions Page** (`frontend/src/pages/AuctionsPage.tsx`)
   - Listens for real-time auction events
   - Automatically refetches data when status changes
   - Updates UI without page refresh

3. **Auction Detail Page** (`frontend/src/pages/AuctionDetailPage.tsx`)
   - Listens for auction-specific events
   - Updates auction details in real-time
   - Handles bid updates and status changes

## Real-Time Events

### Event Types

1. **`auction_status_changed`**
   ```javascript
   {
     auctionId: string,
     status: 'ACTIVE' | 'ENDED',
     startTime?: Date,
     endTime?: Date,
     product: {
       id: string,
       title: string,
       sellerId: string
     },
     winner?: {
       id: string,
       companyName: string,
       amount: number
     },
     isReserveMet?: boolean,
     type: 'STARTED' | 'ENDED'
   }
   ```

2. **`auction_started`**
   ```javascript
   {
     auctionId: string,
     status: 'ACTIVE',
     startTime: Date
   }
   ```

3. **`auction_ended`**
   ```javascript
   {
     auctionId: string,
     status: 'ENDED',
     endTime: Date,
     winner?: {
       id: string,
       companyName: string,
       amount: number
     },
     isReserveMet: boolean
   }
   ```

4. **`auction_batch_processed`**
   ```javascript
   {
     startedCount: number,
     endedCount: number,
     timestamp: string
   }
   ```

## How It Works

### 1. Automatic Status Changes

The system automatically changes auction statuses based on time:

- **SCHEDULED → ACTIVE**: When `startTime` is reached
- **ACTIVE → ENDED**: When `endTime` is reached

### 2. Real-Time Broadcasting

When status changes occur:

1. **Cron Job** runs every 5 seconds (`*/5 * * * * *`)
2. **`processScheduledAuctions()`** checks for auctions needing status changes
3. **`startAuction()`** or **`endAuction()`** is called
4. **Socket events** are emitted to all connected clients
5. **Frontend** receives events and updates UI automatically

### 3. Frontend Updates

The frontend automatically:

- Listens for socket events
- Refetches auction data when status changes
- Updates the UI to show auctions in correct sections
- Provides visual feedback to users

## Testing

### Manual Testing

1. **Create test auctions** with different start/end times
2. **Wait for cron job** to process them (runs every 5 seconds)
3. **Check frontend** to see if auctions move between sections
4. **Monitor console** for real-time event logs

### Automated Testing

Run the test script:

```bash
cd backend
node test-realtime-auctions.js
```

This script will:
- Show current auction counts by status
- Identify auctions ready for processing
- Process auctions and emit real-time events
- Display updated counts

## Configuration

### Backend Configuration

- **Cron Schedule**: Every minute (`* * * * *`)
- **Socket Events**: Automatically emitted on status changes
- **Broadcasting**: All connected clients receive updates

### Frontend Configuration

- **Socket Connection**: Automatic when user is authenticated
- **Event Listeners**: Automatically set up on page load
- **Data Refetching**: Automatic when events are received

## Troubleshooting

### Common Issues

1. **Events not received**
   - Check socket connection status
   - Verify authentication
   - Check browser console for errors

2. **UI not updating**
   - Verify event listeners are set up
   - Check if data refetch is working
   - Monitor network requests

3. **Cron job not running**
   - Check server logs
   - Verify cron job is started
   - Check database for auction status changes

### Debugging

1. **Backend Logs**
   ```bash
   tail -f backend/logs/combined.log
   ```

2. **Frontend Console**
   - Open browser developer tools
   - Check console for socket events
   - Monitor network requests

3. **Database Check**
   ```sql
   SELECT status, COUNT(*) FROM auctions GROUP BY status;
   ```

## Performance Considerations

### Backend
- **Socket Broadcasting**: Efficient for multiple clients
- **Cron Frequency**: Balanced between responsiveness and performance
- **Database Queries**: Optimized with proper indexing

### Frontend
- **Event Listeners**: Properly cleaned up on component unmount
- **Data Refetching**: Uses React Query for efficient caching
- **UI Updates**: Minimal re-renders with proper memoization

## Future Enhancements

1. **Push Notifications**: Browser notifications for auction events
2. **Visual Indicators**: Animated transitions when auctions move
3. **Sound Alerts**: Audio notifications for important events
4. **Mobile Optimization**: Enhanced mobile experience
5. **Analytics**: Track real-time event performance

## Monitoring

### Key Metrics
- **Socket Connections**: Number of connected clients
- **Event Frequency**: How often status changes occur
- **Response Time**: Time from status change to UI update
- **Error Rate**: Failed socket events or data refetches

### Logging
- All socket events are logged
- Auction status changes are tracked
- Performance metrics are collected
- Error conditions are monitored

## Conclusion

The real-time auction status update system provides a seamless user experience by automatically moving auctions between sections without requiring page refreshes. The system is robust, efficient, and provides immediate feedback to users about auction status changes.
