# Real-Time Auction Testing Guide

## Overview

This guide explains how to test the real-time auction status updates to ensure auctions automatically move between "Live Auctions", "Upcoming", and "Ended" tabs without page refreshes.

## Quick Test Steps

### 1. Start the Application

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend  
cd frontend
npm start
```

### 2. Open Browser Developer Tools

1. Open your browser to `http://localhost:3000`
2. Open Developer Tools (F12)
3. Go to the **Console** tab
4. Navigate to the **Auctions** page

### 3. Check Socket Connection

In the console, you should see:
```
🔌 Setting up real-time auction listeners...
```

If you see `🔌 Socket not connected`, check:
- Backend is running on port 5001
- Frontend can connect to backend
- No CORS issues

### 4. Test Real-Time Updates

#### Option A: Use the Debug Panel (Development Mode)

1. On the Auctions page, you should see a debug panel at the top
2. Click **"Test Real-time Events"** button
3. Watch the console for real-time event logs
4. The auctions should refetch automatically

#### Option B: Run the Backend Test Script

```bash
cd backend
node test-realtime-auctions.js
```

This script will:
- Show current auction counts
- Process any auctions ready for status changes
- Create a test auction if none exist
- Emit real-time events

#### Option C: Manual Testing

1. **Create a test auction** with start time in the past
2. **Wait for cron job** (runs every minute)
3. **Watch the console** for real-time events
4. **Check the UI** to see auctions move between tabs

## Expected Behavior

### Console Logs

When real-time events work correctly, you should see:

```
🔌 Setting up real-time auction listeners...
🔄 Auction status changed: { auctionId: "...", status: "ACTIVE", type: "STARTED" }
🎉 Auction "Product Name" has started!
🔄 Invalidating all auction queries...
```

### UI Updates

1. **Auctions automatically move** between tabs without refresh
2. **Live Auctions tab** shows active auctions
3. **Upcoming tab** shows scheduled auctions  
4. **Ended tab** shows completed auctions
5. **Debug panel** shows socket connection status

## Troubleshooting

### Issue: No Real-Time Updates

**Symptoms:**
- Auctions don't move between tabs
- No console logs for real-time events
- Need to refresh page to see changes

**Solutions:**

1. **Check Socket Connection**
   ```javascript
   // In browser console
   console.log('Socket connected:', window.socket?.connected);
   ```

2. **Check Backend Logs**
   ```bash
   tail -f backend/logs/combined.log
   ```

3. **Verify Event Names**
   - Backend emits: `auction_status_changed`
   - Frontend listens: `auction_status_changed`
   - Names must match exactly

4. **Check Network Tab**
   - Look for WebSocket connection
   - Check for failed requests
   - Verify CORS settings

### Issue: Events Received But UI Not Updating

**Symptoms:**
- Console shows real-time events
- But auctions don't move between tabs

**Solutions:**

1. **Check React Query Cache**
   ```javascript
   // In browser console
   console.log('Query cache:', window.queryClient?.getQueryCache());
   ```

2. **Force Invalidate Queries**
   ```javascript
   // In browser console
   window.queryClient?.invalidateQueries(['auctions']);
   ```

3. **Check Component Re-renders**
   - Add console.log to component
   - Verify useEffect dependencies
   - Check for stale closures

### Issue: Socket Connection Failed

**Symptoms:**
- Debug panel shows "🔴 Disconnected"
- Console shows connection errors

**Solutions:**

1. **Check Backend URL**
   ```javascript
   // In frontend/src/contexts/SocketContext.tsx
   const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001');
   ```

2. **Check CORS Settings**
   ```javascript
   // In backend/src/utils/socket.js
   cors: {
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     methods: ['GET', 'POST'],
     credentials: true,
   }
   ```

3. **Check Authentication**
   - Verify JWT token is valid
   - Check cookie settings
   - Verify user is authenticated

## Advanced Testing

### 1. Create Test Auctions

```javascript
// In browser console
fetch('/api/auctions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'your-product-id',
    startingPrice: 100,
    startTime: new Date(Date.now() + 1000), // Start in 1 second
    endTime: new Date(Date.now() + 60000), // End in 1 minute
  })
});
```

### 2. Monitor Real-Time Events

```javascript
// In browser console
window.socket?.on('auction_status_changed', (data) => {
  console.log('Real-time event received:', data);
});
```

### 3. Test Different Scenarios

- **Auction starts**: SCHEDULED → ACTIVE
- **Auction ends**: ACTIVE → ENDED  
- **Multiple auctions**: Batch processing
- **Network issues**: Reconnection handling

## Performance Monitoring

### Key Metrics

1. **Event Latency**: Time from status change to UI update
2. **Connection Stability**: Socket reconnection frequency
3. **Memory Usage**: Query cache size
4. **CPU Usage**: Real-time event processing

### Monitoring Tools

1. **Browser DevTools**
   - Network tab for WebSocket connections
   - Performance tab for rendering
   - Memory tab for leaks

2. **Backend Logs**
   ```bash
   # Monitor real-time events
   tail -f backend/logs/combined.log | grep "auction_status_changed"
   ```

3. **Database Queries**
   ```sql
   -- Check auction status changes
   SELECT status, COUNT(*) FROM auctions GROUP BY status;
   ```

## Production Checklist

- [ ] Socket connection is stable
- [ ] Real-time events are received
- [ ] UI updates automatically
- [ ] No memory leaks
- [ ] Error handling works
- [ ] Performance is acceptable
- [ ] Mobile compatibility
- [ ] Network resilience

## Success Criteria

✅ **Real-time updates work when:**
- Auctions automatically move between tabs
- No page refresh required
- Console shows real-time events
- UI updates within 1-2 seconds
- Works across multiple browser tabs
- Handles network reconnection

❌ **Issues to fix:**
- Auctions don't move between tabs
- Need to refresh page manually
- No real-time events in console
- Socket connection failures
- UI doesn't update after events

## Conclusion

The real-time auction system should provide a seamless user experience where auctions automatically move between sections as their status changes. If you're still experiencing issues, check the troubleshooting section and verify all components are working correctly.
