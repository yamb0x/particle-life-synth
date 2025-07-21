# Vercel Deployment Instructions

## Prerequisites
✅ Firebase project configured (you've already done this!)
✅ Git repository with your code
✅ Vercel account (free at vercel.com)

## Method 1: Deploy via GitHub (Recommended)

### Step 1: Push to GitHub
```bash
# If you haven't set up a remote repository yet:
git remote add origin https://github.com/YOUR_USERNAME/particle-life-synth.git

# Push your code
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository
5. Configure the project:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: (leave empty)
   - **Output Directory**: `./` (leave as is)
6. Click **"Deploy"**

### Step 3: Your App is Live! 🎉
- Vercel will provide a URL like: `https://particle-life-synth.vercel.app`
- Future pushes to GitHub will auto-deploy

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
# In your project directory
vercel

# Answer the prompts:
# ? Set up and deploy "particle-life-synth"? [Y/n] Y
# ? Which scope do you want to deploy to? (your account)
# ? Link to existing project? [y/N] n
# ? What's your project's name? particle-life-synth
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

### Step 3: Deploy to Production
```bash
vercel --prod
```

## Post-Deployment Steps

### 1. Test Cloud Features
1. Visit your deployed URL
2. Click **"Enable Cloud Sync"**
3. Create a preset
4. Share it using the 🔗 button
5. Open the share link in another browser to test

### 2. Custom Domain (Optional)
1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 3. Environment Variables (Optional)
If you want to use environment variables instead of hardcoding Firebase config:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:
   ```
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-domain
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-bucket
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   ```
3. Update `src/config/firebase.config.js` to use `process.env.VARIABLE_NAME`
4. Redeploy

## Troubleshooting

### "404 Not Found" Error
- Check that `vercel.json` exists in your root directory
- Verify the rewrite rules are correct

### Firebase Connection Issues
- Ensure your Firebase config in `src/config/firebase.config.js` is correct
- Check that Firestore and Anonymous Auth are enabled in Firebase Console
- Verify Firestore indexes are created (check browser console for links)

### Build Errors
- This is a static site, no build step required
- If Vercel tries to build, ensure Build Command is empty

## Monitoring Your Deployment

### Vercel Dashboard
- View deployment logs
- Monitor bandwidth usage
- Set up notifications

### Firebase Console
- Monitor Firestore usage
- View active users
- Check preset storage

## Sharing with Your Team

Send your team:
1. **App URL**: `https://your-app.vercel.app`
2. **Quick Instructions**:
   - Click "Enable Cloud Sync" to share presets
   - Create presets and click 🔗 to share
   - No signup required!

## Next Steps

1. **Set up auto-deployment**: Connect GitHub for automatic deploys
2. **Add analytics**: Vercel Analytics or Google Analytics
3. **Performance monitoring**: Enable Web Vitals in Vercel
4. **Set up staging**: Create preview deployments for testing

## Costs

**Free Tier Limits**:
- **Vercel**: 100GB bandwidth/month, unlimited deployments
- **Firebase**: 50K reads/day, 20K writes/day, 1GB storage

Perfect for team collaboration!