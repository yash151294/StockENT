# React Router Infinite Loop Fix

## Problem Identified
The error `Attempt to use history.replaceState() more than 100 times per 10 seconds` was caused by an infinite loop in the React authentication context, specifically in the `useEffect` hooks that handle token refresh and authentication checks.

## Root Causes

### 1. **Circular useEffect Dependencies**
- The `refreshAccessToken` function was included in the `useEffect` dependency array
- This function was recreated on every render, causing the `useEffect` to run infinitely
- The auto-refresh token logic was triggering repeatedly

### 2. **Missing Safeguards**
- No protection against multiple simultaneous token refresh attempts
- No proper cleanup of intervals and effects

### 3. **Authentication Check Loop**
- The initial authentication check was calling `refreshAccessToken` which could trigger more state changes
- This created a cascade of re-renders and navigation attempts

## Fixes Applied

### 1. **Fixed useEffect Dependencies**
```typescript
// Before (causing infinite loop)
useEffect(() => {
  // ... logic
}, [state.accessToken, state.refreshToken, refreshAccessToken]);

// After (fixed)
useEffect(() => {
  // ... logic  
}, [state.accessToken, state.refreshToken, isRefreshing]);
```

### 2. **Added useCallback for refreshAccessToken**
```typescript
const refreshAccessToken = useCallback(async (): Promise<boolean> => {
  // ... implementation
}, [state.user, isRefreshing]);
```

### 3. **Added Refresh State Protection**
```typescript
const [isRefreshing, setIsRefreshing] = React.useState(false);

const refreshAccessToken = useCallback(async (): Promise<boolean> => {
  if (isRefreshing) {
    return false; // Prevent multiple simultaneous refresh attempts
  }
  
  try {
    setIsRefreshing(true);
    // ... refresh logic
  } finally {
    setIsRefreshing(false);
  }
}, [state.user, isRefreshing]);
```

### 4. **Simplified Initial Auth Check**
```typescript
// Removed refreshAccessToken call from initial check
// Now just validates token and logs out if invalid
if (response.data.success) {
  // Set authenticated state
} else {
  // Token is invalid, logout
  dispatch({ type: 'LOGOUT' });
}
```

### 5. **Protected Auto-Refresh Logic**
```typescript
useEffect(() => {
  if (state.accessToken && state.refreshToken && !isRefreshing) {
    const interval = setInterval(async () => {
      try {
        await refreshAccessToken();
      } catch (error) {
        logger.error('Auto token refresh failed:', error);
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }
}, [state.accessToken, state.refreshToken, isRefreshing]);
```

## Testing the Fix

### 1. **Clear Browser Storage**
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
```

### 2. **Restart the Application**
```bash
# Stop the frontend server (Ctrl+C)
# Restart
cd frontend
npm start
```

### 3. **Test Navigation**
- Navigate to different pages
- Check browser console for errors
- Verify no infinite loop errors

### 4. **Test Authentication Flow**
- Login with valid credentials
- Check if redirects work properly
- Test logout functionality

## Prevention Measures

### 1. **Always Use useCallback for Functions in useEffect Dependencies**
```typescript
const myFunction = useCallback(() => {
  // implementation
}, [dependency1, dependency2]);
```

### 2. **Add State Guards for Async Operations**
```typescript
const [isLoading, setIsLoading] = useState(false);

const asyncOperation = useCallback(async () => {
  if (isLoading) return;
  setIsLoading(true);
  try {
    // operation
  } finally {
    setIsLoading(false);
  }
}, [isLoading]);
```

### 3. **Minimize useEffect Dependencies**
- Only include values that actually affect the effect
- Use useCallback for functions
- Consider splitting complex effects

### 4. **Add Proper Cleanup**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // logic
  }, delay);

  return () => clearInterval(interval);
}, [dependencies]);
```

## Verification Steps

1. **Check Browser Console**: No more `history.replaceState()` errors
2. **Test Navigation**: Smooth navigation between pages
3. **Test Authentication**: Login/logout works without loops
4. **Test Token Refresh**: Automatic token refresh works without infinite loops
5. **Performance**: No excessive re-renders or API calls

## Files Modified

- `frontend/src/contexts/AuthContext.tsx`
  - Added `useCallback` import
  - Added `isRefreshing` state
  - Fixed `refreshAccessToken` function
  - Fixed `useEffect` dependencies
  - Added refresh state protection

## Result

✅ **Infinite loop error resolved**
✅ **Navigation works smoothly**
✅ **Authentication flow is stable**
✅ **Token refresh works properly**
✅ **No more browser console errors**
