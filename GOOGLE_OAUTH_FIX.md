# Google OAuth Fix - "The string did not match the expected pattern" Error

## Problem
The Google OAuth sign-up is returning an error: "The string did not match the expected pattern."

## Root Cause
The error occurs because:
1. Google OAuth environment variables are not configured
2. The backend is trying to validate the OAuth URL but the required credentials are missing

## Solution

### Step 1: Set up Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "APIs & Services" > "Credentials"
5. Create OAuth 2.0 Client ID credentials
6. Set the authorized redirect URI to: `http://localhost:5000/api/auth/google/callback`

### Step 2: Configure Environment Variables

Create a `.env` file in the backend directory with the following content:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/stockent_db"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-here-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here-change-in-production"

# Server Configuration
PORT=5000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# Google OAuth - Replace with your actual credentials
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"

# Other required variables...
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL="info"
```

### Step 3: Test the Fix

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend server:
   ```bash
   cd frontend
   npm start
   ```

3. Navigate to the registration page and test the Google OAuth button

## What Was Fixed

1. **AuthContext**: Added `loginWithOAuth` method to handle OAuth login properly
2. **GoogleOAuthButton**: Fixed the login method call to use the correct OAuth method
3. **Backend Controller**: Fixed the recursive function call issue in `getGoogleAuthUrl`
4. **Error Handling**: Added proper error messages for missing environment variables
5. **Debugging**: Added console logs to help debug OAuth flow

## Expected Behavior

After setting up the environment variables:
1. Click "Continue with Google" button
2. You should be redirected to Google's OAuth consent screen
3. After granting permissions, you should be redirected back to the application
4. The user should be automatically logged in and redirected to the dashboard

## Troubleshooting

If you still get errors:

1. **Check browser console** for any JavaScript errors
2. **Check backend logs** for OAuth-related errors
3. **Verify environment variables** are set correctly
4. **Ensure Google OAuth credentials** are valid and properly configured
5. **Check that the redirect URI** in Google Cloud Console matches exactly

## Alternative: Disable Google OAuth Temporarily

If you want to disable Google OAuth temporarily, you can comment out the GoogleOAuthButton in the RegisterPage and LoginPage components.
