# Quick Setup Guide - Particle Life Synth

Deploy your Particle Life Synth to Vercel with cloud preset sharing in 10 minutes!

## 1. Fork or Clone This Repository

```bash
git clone <your-repo-url>
cd particle-life-synth
```

## 2. Set Up Firebase (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project → Name it → Create
3. Click "Firestore Database" → Create database → Start in production mode → Enable
4. Click "Authentication" → Get started → Sign-in method → Enable "Anonymous"
5. Click gear icon → Project settings → Scroll down → Click "</>" (Web) → Register app
6. Copy your config values

## 3. Update Firebase Config

Edit `src/config/firebase.config.js`:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-PROJECT.firebaseapp.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-PROJECT.appspot.com",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID"
};
```

## 4. Deploy to Vercel

### Option A: Via GitHub (Recommended)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import GitHub repo
4. Deploy!

### Option B: Via CLI
```bash
npx vercel
```

## 5. That's It! 🎉

Your app is now live at `https://your-project.vercel.app`

### Features Available:
- ✅ All presets work locally (no cloud needed)
- ✅ Click "Enable Cloud Sync" to share presets
- ✅ Share presets via links (7-day expiry)
- ✅ Real-time collaboration
- ✅ Anonymous auth (no sign-up required)

### Testing Cloud Features:
1. Open your deployed site
2. Click "Enable Cloud Sync" (top right)
3. Create a preset
4. Click the share button (🔗) next to any preset
5. Send link to colleagues!

## Troubleshooting

**"Connection Failed" error?**
- Check Firebase config values are correct
- Ensure Firestore and Auth are enabled in Firebase

**Presets not syncing?**
- Check browser console for errors
- Verify Firebase project is active

**Need help?**
- Check `DEPLOYMENT_GUIDE.md` for detailed instructions
- Firebase free tier: 50K reads/day, 20K writes/day
- Vercel free tier: Unlimited deployments