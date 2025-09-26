# Google OAuth Debug Guide

## Issue: Getting JSON instead of redirect

If you're seeing JSON response instead of being redirected to the welcome page, follow these steps:

### 1. Check Backend Configuration
Make sure your backend `.env` file has:
```
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"
FRONTEND_URL="http://localhost:3000"
```

### 2. Check Port Configuration
- Backend should run on port 5000
- Frontend should run on port 3000
- Make sure no other services are using these ports

### 3. Test OAuth Flow
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Go to http://localhost:3000
4. Click "Login" or "Register"
5. Click "Continue with Google" button
6. Complete Google OAuth
7. You should be redirected to products page with welcome message

### 4. Common Issues

#### Issue: Direct URL Access
❌ **Don't access** `http://localhost:5000/api/auth/google/callback` directly
✅ **Do access** `http://localhost:3000` and use the "Continue with Google" button

#### Issue: Port Mismatch
❌ Frontend calling port 5001, backend on port 5000
✅ Fixed: Updated all frontend configs to use port 5000

#### Issue: Missing Environment Variables
❌ Google OAuth not configured
✅ Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend .env

### 5. Debug Steps
1. Check browser network tab for OAuth requests
2. Check backend logs for OAuth callback details
3. Verify Google OAuth app configuration in Google Console
4. Ensure redirect URI in Google Console matches backend config

### 6. Expected Flow
1. User clicks "Continue with Google"
2. Frontend calls `/api/auth/google/url`
3. Backend returns Google OAuth URL
4. Frontend redirects to Google
5. User signs in with Google
6. Google redirects to `/api/auth/google/callback`
7. Backend processes OAuth and redirects to frontend
8. Frontend shows success screen
9. User is redirected to products page
