# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the StockENT application.

## Prerequisites

1. A Google Cloud Platform account
2. Access to the Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity" API if available

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Configure the following:
   - **Name**: StockENT OAuth Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)

## Step 4: Configure Environment Variables

Add the following variables to your `.env` file in the backend directory:

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"
```

## Step 5: Update Database Schema

The database schema has been updated to support Google OAuth. Run the following command to apply the changes:

```bash
cd backend
npx prisma db push
```

## Step 6: Test the Integration

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

3. Navigate to the registration page and test the "Continue with Google" button

## Features

- **Seamless Integration**: Users can sign up or log in using their Google accounts
- **Account Linking**: If a user already exists with the same email, their Google account will be linked
- **Auto-Verification**: Google OAuth users are automatically verified
- **Secure**: Uses Google's OAuth 2.0 flow with proper token handling

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Make sure the redirect URI in your Google Cloud Console matches exactly with the one in your environment variables

2. **"Client ID not found"**: Verify that your Google Client ID is correct in the environment variables

3. **CORS errors**: Ensure your frontend URL is added to the authorized JavaScript origins in Google Cloud Console

4. **Database errors**: Make sure you've run the database migration to add the Google OAuth fields

### Testing

To test the Google OAuth flow:

1. Click the "Continue with Google" button on the registration or login page
2. You should be redirected to Google's OAuth consent screen
3. After granting permissions, you should be redirected back to your application
4. The user should be automatically logged in

## Security Notes

- Never commit your Google Client Secret to version control
- Use environment variables for all sensitive configuration
- In production, use HTTPS for all redirect URIs
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in the Google Cloud Console

## Production Deployment

For production deployment:

1. Update the authorized origins and redirect URIs in Google Cloud Console
2. Update the environment variables with production URLs
3. Ensure your domain has SSL certificates
4. Consider implementing additional security measures like rate limiting for OAuth endpoints
