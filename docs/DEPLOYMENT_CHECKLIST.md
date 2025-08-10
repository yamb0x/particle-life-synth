# Deployment Checklist

## Pre-Deployment Verification

### 1. Global Variable Consistency ✅
- [ ] All functionality-critical global variables are assigned unconditionally
- [ ] No `window.location.hostname === 'localhost'` conditions for essential features
- [ ] Use `EnvironmentManager` for environment detection instead of hostname checks

### 2. Environment Testing
- [ ] Test `/environment-test.html` on localhost 
- [ ] Verify all tests pass with ✅ status
- [ ] Check that keyboard shortcuts work (press C key)
- [ ] Verify species count changes work

### 3. Feature Parity Check
- [ ] **Keyboard Shortcuts**: C key toggles panels on both localhost and deployment
- [ ] **Species Sync**: Changing species count updates left audio panel on both environments  
- [ ] **Audio Controls**: Audio panel functionality identical on both environments
- [ ] **UI State**: All UI elements behave identically

### 4. Post-Deployment Verification
- [ ] Open deployed site console and check for JavaScript errors
- [ ] Run `/environment-test.html` on deployed site
- [ ] Test all keyboard shortcuts (C, V, R, M, Shift+Plus, Shift+Minus)
- [ ] Test species count changes with different presets
- [ ] Verify audio loading and waveform display

### 5. Debug Information
- [ ] Check console shows: `MainUI exists: true`
- [ ] Check console shows: `LeftPanel exists: true` 
- [ ] No errors in browser console
- [ ] All modules loading correctly

## Common Issues to Avoid

### ❌ Don't Do This:
```javascript
// BAD: Environment-specific global assignment
if (window.location.hostname === 'localhost') {
    window.mainUI = mainUI;
}
```

### ✅ Do This Instead:
```javascript
// GOOD: Unconditional assignment for functionality
window.mainUI = mainUI;

// GOOD: Environment-specific debugging only
if (EnvironmentManager.isDebugMode()) {
    window.debugInfo = extraDebugData;
}
```

## Emergency Debugging

If deployment is not working:

1. **Add debug script to index.html**: Include our debug-deployment.js
2. **Check browser console** on deployed site for errors
3. **Test environment-test.html** on both localhost and deployment
4. **Compare console outputs** between environments
5. **Use `?debug=true`** URL parameter to enable debug mode on deployment

## Testing URLs

- **Localhost**: `http://localhost:8000/environment-test.html`
- **Deployment**: `https://particle-life-synth-henna.vercel.app/environment-test.html`
- **Debug Mode**: Add `?debug=true` to any URL