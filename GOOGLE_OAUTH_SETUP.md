# Google OAuth Setup Guide for TradeTaper

This guide will help you set up Google OAuth authentication for both the frontend and backend of TradeTaper.

## Prerequisites

- Google Cloud Console account
- TradeTaper backend deployed on GCP Cloud Run
- TradeTaper frontend deployed on Vercel

## Step 1: Google Cloud Console Configuration

### 1.1 Create a Google Cloud Project (if not already done)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select your existing TradeTaper project
3. Note your Project ID

### 1.2 Enable Google+ API

1. Go to the [APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Click "Enable APIs and Services"
3. Search for "Google+ API" and enable it
4. Also enable "People API" for profile information access

### 1.3 Configure OAuth Consent Screen

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Choose "External" user type (unless you have a Google Workspace account)
3. Fill out the required fields:
   - **App name**: TradeTaper
   - **User support email**: your email
   - **Developer contact email**: your email
   - **App domain**: `your-frontend-domain.vercel.app`
   - **Authorized domains**: 
     - `your-frontend-domain.vercel.app`
     - `us-central1.run.app` (for your backend)
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (your email addresses for testing)

### 1.4 Create OAuth 2.0 Client ID

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: TradeTaper Web Client
   - **Authorized JavaScript origins**:
     - `https://your-frontend-domain.vercel.app`
     - `http://localhost:3000` (for local development)
   - **Authorized redirect URIs**:
     - `https://your-backend-domain.run.app/api/v1/auth/google/callback`
     - `http://localhost:3000/api/v1/auth/google/callback` (for local development)
5. Save and copy the **Client ID** and **Client Secret**

## Step 2: Backend Configuration

### 2.1 Set Environment Variables in GCP Cloud Run

Add the following environment variables to your Cloud Run service:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://your-backend-domain.run.app/api/v1/auth/google/callback
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 2.2 Deploy Updated Backend Code

```bash
cd tradetaper-backend
npm install passport-google-oauth20 @types/passport-google-oauth20
gcloud run deploy tradetaper-backend --source . --region us-central1
```

## Step 3: Frontend Configuration

### 3.1 Production (Vercel) Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your TradeTaper project
3. Go to Settings → Environment Variables
4. Add the following variables:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.run.app
NEXT_PUBLIC_API_URL=https://your-backend-domain.run.app/api/v1
```

5. Redeploy your frontend

## Step 4: Testing the Integration

### 4.1 Test Authentication Flow

1. Visit your deployed frontend at `/login`
2. Click "Continue with Google"
3. You should be redirected to Google's OAuth consent screen
4. Grant permissions
5. You should be redirected back to your app and logged in

### 4.2 Test Endpoints

You can test the Google OAuth endpoints directly:

**Initiate OAuth:**
```
GET https://your-backend-domain.run.app/api/v1/auth/google
```

**OAuth Callback (handled automatically):**
```
GET https://your-backend-domain.run.app/api/v1/auth/google/callback
```

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**: 
   - Ensure the redirect URI in Google Console exactly matches your backend callback URL

2. **"OAuth consent screen" not configured**:
   - Complete the OAuth consent screen setup in Google Console

3. **"Invalid client_id" error**:
   - Verify the Client ID is correctly set in environment variables

4. **404 on OAuth endpoints**:
   - Ensure the latest backend code with Google OAuth is deployed
   - Check that GoogleStrategy is properly registered in AuthModule

5. **Next.js "useSearchParams should be wrapped in Suspense" error**:
   - Fixed in our implementation with proper Suspense boundary

## Implementation Files

### Backend Files:
- `src/auth/strategies/google.strategy.ts` - Google OAuth strategy
- `src/auth/auth.controller.ts` - Google OAuth endpoints
- `src/auth/auth.service.ts` - Google user validation/creation
- `src/auth/auth.module.ts` - GoogleStrategy registration
- `src/users/users.service.ts` - createGoogleUser method
- `src/users/entities/user.entity.ts` - Nullable password field
- `src/auth/dto/register-user.dto.ts` - Optional password field

### Frontend Files:
- `src/services/googleAuthService.ts` - Google OAuth service
- `src/app/auth/google/callback/page.tsx` - OAuth callback handler (with Suspense boundary)
- Login/register pages with Google OAuth buttons

### Frontend Technical Notes:
- OAuth callback page uses Suspense boundary to handle `useSearchParams()` in Next.js App Router
- Proper error handling and loading states for OAuth flow
- Redux integration for user state management

## Production Checklist

Before going live:

- [ ] OAuth consent screen is published (not in testing mode)
- [ ] All production URLs are in authorized origins/redirects
- [ ] Environment variables are set in production
- [ ] Backend deployed with latest OAuth code
- [ ] Frontend built without Suspense/SSR errors
- [ ] Test the complete flow in production

The Google OAuth integration is now ready for production use! 