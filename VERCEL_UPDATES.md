# How to Update Your Vercel Deployment

Your Particle Life Synth on Vercel automatically updates whenever you push to GitHub!

## Automatic Updates (Recommended)

Since your Vercel is connected to GitHub:

1. **Make changes locally**
2. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. **Vercel automatically deploys** (usually within 1-2 minutes)
4. **Check deployment status**:
   - Go to [vercel.com](https://vercel.com)
   - Click on your project
   - See deployment progress in real-time

## Manual Redeploy

If you need to force a redeploy:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to "Deployments" tab
4. Click the three dots (...) next to the latest deployment
5. Click "Redeploy"

## Checking Deployment Status

### In Vercel Dashboard
- ✅ Green checkmark = Successfully deployed
- 🔄 Yellow spinner = Deploying
- ❌ Red X = Deployment failed

### View Build Logs
1. Click on any deployment
2. Click "View Build Logs"
3. See exactly what happened during deployment

## Troubleshooting

### Changes Not Showing?
1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check deployment status** in Vercel
3. **Verify GitHub push** succeeded

### Deployment Failed?
1. Check build logs for errors
2. Most common issues:
   - File not found (check file paths)
   - Syntax errors in code
   - Missing dependencies

### Firebase Not Working?
1. Verify Firebase config is correct in `src/config/firebase.config.js`
2. Check browser console for errors
3. Ensure Firestore indexes are created

## Quick Commands

```bash
# Check current status
git status

# See recent commits
git log --oneline -5

# Push all changes
git add . && git commit -m "Update" && git push

# Force push (careful!)
git push --force origin main
```

## Deployment URL

Your app is always available at:
- Production: `https://your-project-name.vercel.app`
- Preview (for branches): `https://your-project-name-git-branch-name.vercel.app`

Remember: Every push to `main` branch = automatic deployment! 🚀