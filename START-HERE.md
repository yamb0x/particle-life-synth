# 🚀 Quick Start - Comprehensive Particle Life System

## One-Click Launch

### macOS/Linux:
```bash
./start-comprehensive.sh
```

### Windows:
```cmd
start-comprehensive.bat
```

## What the launcher does:
1. ✅ Checks if TypeScript compilation is needed
2. ✅ Compiles if necessary (or uses existing JS files)
3. ✅ Finds an available port automatically
4. ✅ Starts the web server
5. ✅ Opens your browser automatically
6. ✅ Shows all controls and shortcuts

## Manual Start (if scripts don't work):
```bash
# Option 1 - Python 3
python3 -m http.server 8080

# Option 2 - Python 2
python -m SimpleHTTPServer 8080

# Then open in browser:
http://localhost:8080/index-comprehensive.html
```

## Troubleshooting:
- **Port in use?** The script automatically finds an available port
- **TypeScript errors?** The script continues with existing JS files
- **Browser doesn't open?** Manually navigate to the URL shown
- **Python not found?** Install from https://www.python.org/

## Controls:
- **C** - Toggle parameter panel
- **R** - Reset particles  
- **1-5** - Load presets
- **Click** - Create pulse effects

Enjoy your particle simulations! 🎨