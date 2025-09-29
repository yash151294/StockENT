# Debug Real-Time Auction Issue

## Current Problem
You need to manually click "Manual refetch" or "Test real-time events" for auctions to switch tabs, meaning the automatic real-time updates are not working.

## Step-by-Step Debugging

### 1. Check Socket Connection

**Open Browser Console and look for:**
```
🔌 Setting up real-time auction listeners...
```

**If you see:**
```
🔌 Socket not connected for real-time auctions
```
**Then the socket connection is the issue.**

### 2. Test Socket Communication

1. **Click "Test Real-time Events" button** in the debug panel
2. **Look for in console:**
   ```
   🧪 Testing real-time events...
   🧪 Socket status: { socket: true, isConnected: true, socketConnected: true, socketId: "..." }
   🧪 Emitting test event...
   ✅ Socket communication working! { message: "Test response from server", timestamp: "..." }
   ```

**If you don't see the "✅ Socket communication working!" message, the socket connection is broken.**

### 3. Check Backend Logs

**Run this command to see backend logs:**
```bash
tail -f backend/logs/combined.log
```

**Look for:**
```
📡 Broadcasting auction_status_changed event: { auctionId: "...", status: "ACTIVE", ... }
✅ Successfully emitted real-time events for auction ...
```

**If you don't see these logs, the backend is not emitting events.**

### 4. Test Manual Event Trigger

**Run this command to manually trigger events:**
```bash
cd backend
node manual-trigger-auction-events.js
```

**This will:**
- Create a test auction
- Emit real-time events
- Show in console if events are being sent

### 5. Check Frontend Event Reception

**In browser console, look for:**
```
🔍 Socket event received: auction_status_changed { auctionId: "...", status: "ACTIVE", ... }
🔄 Auction status changed event received: { ... }
🔄 Invalidating auction queries...
```

**If you don't see these, the frontend is not receiving events.**

## Common Issues & Solutions

### Issue 1: Socket Not Connected

**Symptoms:**
- Debug panel shows "🔴 Disconnected"
- Console shows "Socket not connected"

**Solutions:**
1. **Check backend is running:**
   ```bash
   curl http://localhost:5001/health
   ```

2. **Check CORS settings in backend:**
   ```javascript
   // backend/src/utils/socket.js
   cors: {
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     methods: ['GET', 'POST'],
     credentials: true,
   }
   ```

3. **Check authentication:**
   - Make sure you're logged in
   - Check if JWT token is valid
   - Verify cookies are being sent

### Issue 2: Events Not Being Emitted

**Symptoms:**
- No backend logs for auction events
- Manual trigger doesn't work

**Solutions:**
1. **Check if cron jobs are running:**
   ```bash
   # Check backend logs for cron job execution
   tail -f backend/logs/combined.log | grep "Running auction processing job"
   ```

2. **Manually run auction processing:**
   ```bash
   cd backend
   node -e "require('./src/services/auctionService').processScheduledAuctions()"
   ```

### Issue 3: Events Emitted But Not Received

**Symptoms:**
- Backend logs show events being emitted
- Frontend console shows no events received

**Solutions:**
1. **Check event names match exactly:**
   - Backend emits: `auction_status_changed`
   - Frontend listens: `auction_status_changed`

2. **Check socket room membership:**
   - User should be in global room for broadcast events
   - Check if user is authenticated properly

3. **Check network issues:**
   - Look for WebSocket connection in Network tab
   - Check for CORS errors
   - Verify no firewall blocking

### Issue 4: Events Received But UI Not Updating

**Symptoms:**
- Console shows events received
- But auctions don't move between tabs

**Solutions:**
1. **Check React Query cache:**
   ```javascript
   // In browser console
   console.log('Query cache:', window.queryClient?.getQueryCache());
   ```

2. **Force invalidate queries:**
   ```javascript
   // In browser console
   window.queryClient?.invalidateQueries(['auctions']);
   ```

3. **Check component re-renders:**
   - Add console.log to component
   - Verify useEffect dependencies
   - Check for stale closures

## Quick Fixes to Try

### Fix 1: Restart Everything
```bash
# Stop backend
# Stop frontend
# Restart backend
cd backend && npm start
# Restart frontend
cd frontend && npm start
```

### Fix 2: Clear Browser Cache
1. Open DevTools
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 3: Check Environment Variables
```bash
# Check if these are set correctly
echo $REACT_APP_SOCKET_URL
echo $FRONTEND_URL
```

### Fix 4: Test with Manual Trigger
```bash
cd backend
node manual-trigger-auction-events.js
```

## Expected Working Flow

1. **Backend cron job runs** (every minute)
2. **Finds auctions needing status change**
3. **Calls startAuction() or endAuction()**
4. **Emits socket events** with detailed logging
5. **Frontend receives events** (visible in console)
6. **React Query cache invalidated**
7. **UI automatically updates**
8. **Auctions move between tabs**

## Debug Checklist

- [ ] Socket connection established
- [ ] Backend cron jobs running
- [ ] Events being emitted from backend
- [ ] Events being received by frontend
- [ ] React Query cache being invalidated
- [ ] UI updating automatically
- [ ] No console errors
- [ ] Network connection stable

## If Still Not Working

1. **Check the exact error messages in console**
2. **Verify all environment variables are set**
3. **Test with a fresh browser session**
4. **Check if the issue is specific to your setup**
5. **Try the manual trigger script to isolate the issue**

The key is to identify at which step the process is failing and fix that specific issue.
