# Particle Life Synth - Deployment Guide

This guide will help you deploy Particle Life Synth to Vercel with Firebase cloud storage for collaborative preset sharing.

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **Firebase Account**: Sign up at https://firebase.google.com
3. **Git**: Ensure your project is in a Git repository
4. **Node.js**: Install from https://nodejs.org (optional, for local testing)

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it (e.g., "particle-life-synth")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Firestore Database

1. In Firebase Console, click "Firestore Database" in the left menu
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your region (choose closest to your users)
5. Click "Enable"

### 1.3 Configure Security Rules

In Firestore, go to "Rules" tab and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public presets can be read by anyone
    match /presets/{document} {
      allow read: if resource.data.status == 'public';
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         !exists(/databases/$(database)/documents/presets/$(document)));
    }
    
    // Shared links can be read by anyone
    match /shared_links/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click "Publish" to save the rules.

### 1.4 Enable Anonymous Authentication

1. Go to "Authentication" in the left menu
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous"
5. Click "Save"

### 1.5 Get Firebase Configuration

1. Click the gear icon → "Project settings"
2. Scroll down to "Your apps"
3. Click "</>" (Web) icon
4. Register app with a nickname (e.g., "particle-life-web")
5. Copy the configuration object

## Step 2: Project Configuration

### 2.1 Update Firebase Config

Edit `src/config/firebase.config.js` and replace with your Firebase config:

```javascript
export const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2.2 Test Locally

1. Start your local server: `python3 serve.py`
2. Open http://localhost:8000
3. Click "Enable Cloud Sync" button
4. Create and save a preset
5. Check Firebase Console → Firestore to see your preset

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 3.2 Deploy via CLI

```bash
# In your project directory
vercel

# Follow prompts:
# - Link to existing project? No
# - What's your project name? particle-life-synth
# - In which directory is your code located? ./
# - Want to override settings? No
```

### 3.3 Deploy via GitHub (Recommended)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (leave empty)
   - Output Directory: ./
6. Click "Deploy"

### 3.4 Environment Variables (Optional)

If you want to use environment variables for Firebase config:

1. In Vercel Dashboard, go to your project
2. Go to "Settings" → "Environment Variables"
3. Add your Firebase config variables:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

## Step 4: Using the Deployed App

### 4.1 Access Your App

Your app will be available at:
- `https://your-project-name.vercel.app`
- Custom domain (if configured)

### 4.2 Share with Colleagues

1. Send them the URL
2. They can:
   - View and use existing presets
   - Enable cloud sync to see shared presets
   - Create their own presets
   - Share presets via share links

### 4.3 Sharing Presets

1. Create or load a preset
2. Click the share button (🔗) next to the preset
3. Copy the share link
4. Send to colleagues
5. They'll automatically import the preset when opening the link

## Troubleshooting

### Firebase Connection Issues

1. Check browser console for errors
2. Verify Firebase config is correct
3. Check Firebase Console for quota limits
4. Ensure Firestore and Auth are enabled

### Vercel Deployment Issues

1. Check build logs in Vercel Dashboard
2. Ensure all files are committed to Git
3. Verify `vercel.json` is present
4. Check file paths are correct (case-sensitive)

### Performance Issues

1. Firebase free tier limits:
   - 50K reads/day
   - 20K writes/day
   - 1GB storage
2. Consider upgrading to Blaze plan for production use
3. Implement pagination for large preset collections

## Security Considerations

1. **API Keys**: Firebase API keys are safe to expose (they're public by design)
2. **Security Rules**: Ensure Firestore rules match your requirements
3. **User Data**: Currently uses anonymous auth - consider adding proper auth for production
4. **Rate Limiting**: Implement client-side rate limiting for cloud operations

## Next Steps

1. **Custom Domain**: Add a custom domain in Vercel settings
2. **Analytics**: Add Firebase Analytics for usage tracking
3. **Backup**: Set up automated Firestore backups
4. **Monitoring**: Enable Firebase Performance Monitoring
5. **User Auth**: Implement Google/Email authentication for better user management

## Cost Estimates

**Firebase Free Tier** (Spark Plan):
- 50K Firestore reads/day
- 20K Firestore writes/day
- 1GB storage
- Unlimited anonymous auth

**Vercel Free Tier**:
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Global CDN

For most collaborative teams, the free tiers should be sufficient. Monitor usage in both dashboards.