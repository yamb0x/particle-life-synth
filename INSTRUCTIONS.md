# Particle Life Synth - Quick Start Guide

## 🚀 Starting the Development Server

### Method 1: Using Python (Recommended)
```bash
# Navigate to project directory
cd "/Users/yamb0x.eth/Yambo Studio Dropbox/Admin/8. Vibe Coding/particle-life-synth"

# Start the server (runs on port 8000)
python3 serve.py
```

### Method 2: Using npm
```bash
# Start server on port 8080
npm run dev
```

### Method 3: Using the start script
```bash
# Make sure the script is executable
chmod +x start.sh

# Run the start script
./start.sh
```

## 🛑 Stopping the Server

### Quick Stop (One Command)
```bash
# Kill any Python server on port 8000
lsof -ti :8000 | xargs kill -9

# Or kill all Python serve.py processes
pkill -f "python3 serve.py"
```

### Manual Stop
Press `Ctrl+C` in the terminal where the server is running.

## 🔄 Restarting the Server

### One-Line Restart
```bash
# Kill existing server and start new one
lsof -ti :8000 | xargs kill -9 2>/dev/null; cd "/Users/yamb0x.eth/Yambo Studio Dropbox/Admin/8. Vibe Coding/particle-life-synth" && python3 serve.py
```

### Create Restart Alias (Optional)
Add this to your `~/.zshrc` or `~/.bash_profile`:
```bash
alias particle-restart='lsof -ti :8000 | xargs kill -9 2>/dev/null; cd "/Users/yamb0x.eth/Yambo Studio Dropbox/Admin/8. Vibe Coding/particle-life-synth" && python3 serve.py'
alias particle-stop='lsof -ti :8000 | xargs kill -9'
alias particle-start='cd "/Users/yamb0x.eth/Yambo Studio Dropbox/Admin/8. Vibe Coding/particle-life-synth" && python3 serve.py'
```

Then you can just use:
```bash
particle-restart  # Restart server
particle-stop     # Stop server
particle-start    # Start server
```

## 🌐 Accessing the Application

Once the server is running, open your browser and go to:
- **http://localhost:8000**
- **http://[::]:8000** (IPv6)

## 📁 Project Structure

```
particle-life-synth/
├── index.html          # Main HTML file
├── src/
│   ├── main.js        # Entry point
│   ├── core/          # Core particle system
│   ├── ui/            # UI components
│   └── utils/         # Utility classes
├── docs/              # Documentation
├── serve.py           # Python dev server
└── INSTRUCTIONS.md    # This file
```

## 🎮 Using the Application

1. **Presets**: Select from dropdown (Predator-Prey, Crystallization, etc.)
2. **Configure Button**: Click to open the preset editor
3. **Preset Editor Tabs**:
   - **Species**: Configure particle types, colors, counts
   - **Forces**: Interactive force relationship editor
   - **Visual**: Trail effects, particle size
   - **Physics**: Forces, friction, wall behavior
   - **Layout**: Drag-and-drop starting positions

## 💾 Saving Presets

- Changes auto-save after 2 seconds of inactivity
- "Saved ✓" appears when successfully saved
- Click "Save as New" to create a new preset
- "Export All" backs up all your presets

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Server Not Starting
```bash
# Make sure you're in the right directory
pwd
# Should show: /Users/yamb0x.eth/Yambo Studio Dropbox/Admin/8. Vibe Coding/particle-life-synth

# Check Python version (need Python 3)
python3 --version
```

### Changes Not Showing
1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows)
2. Clear browser cache
3. Check browser console for errors: `F12` → Console tab

## 🚀 Quick Commands Reference

```bash
# Start server
cd "/Users/yamb0x.eth/Yambo Studio Dropbox/Admin/8. Vibe Coding/particle-life-synth" && python3 serve.py

# Stop all Python servers
pkill -f "python3 serve.py"

# Check if server is running
curl http://localhost:8000

# Open in browser (Mac)
open http://localhost:8000

# View real-time logs
tail -f ~/.python_server.log 2>/dev/null || echo "No log file"
```

## 📝 Development Tips

1. Keep browser console open (`F12`) to see debug messages
2. The server auto-reloads, just refresh browser after code changes
3. Particle system uses Canvas 2D for rendering
4. Presets are stored in IndexedDB + localStorage

## 🎯 Configure Button Location

The **Configure** button appears next to the preset dropdown in the control panel (top-right corner). If you don't see it:
1. Make sure the server is running
2. Refresh the page
3. Check browser console for errors

---

For more details, see the [README.md](README.md) file.