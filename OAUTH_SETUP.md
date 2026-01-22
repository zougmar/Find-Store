# OAuth Setup Guide

This guide explains how to set up Google and Facebook OAuth authentication for the Find Store application.

## Prerequisites

- Google Cloud Console account
- Facebook Developer account

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure the OAuth consent screen if prompted
6. Choose "Web application" as the application type
7. Add authorized JavaScript origins:
   - `http://localhost:5173` (for local development)
   - Your production domain (e.g., `https://yourdomain.com`)
8. Add authorized redirect URIs:
   - `http://localhost:5173` (for local development)
   - Your production domain
9. Copy the Client ID
10. Add it to your `.env` file in the `frontend` directory:
    ```
    VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
    ```

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add "Facebook Login" product to your app
4. Go to Settings → Basic
5. Add your app domains and site URL
6. Go to Settings → Basic and copy your App ID
7. Add it to your `.env` file in the `frontend` directory:
    ```
    VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
    ```
8. In Facebook Login → Settings, add valid OAuth redirect URIs:
   - `http://localhost:5173` (for local development)
   - Your production domain

## Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

## Testing

1. Start your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to the registration page
3. Click on "Sign up with Google" or "Sign up with Facebook"
4. Complete the OAuth flow
5. You should be redirected back and logged in

## Notes

- The OAuth implementation automatically creates a user account if one doesn't exist
- If a user with the same email already exists, the OAuth account will be linked to it
- Users can sign in with either their email/password or OAuth providers

## Troubleshooting

### Google OAuth not working
- Verify your Client ID is correct
- Check that your redirect URI matches exactly (including http/https and trailing slashes)
- Ensure the Google+ API is enabled in your Google Cloud project

### Facebook OAuth not working
- Verify your App ID is correct
- Check that your app is in "Live" mode or add test users
- Ensure the redirect URIs are added in Facebook Login settings
- Check browser console for any error messages
