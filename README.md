# Particle Life Synth

A visual particle simulation system that creates emergent behaviors, designed to control synthesizer parameters through living particle ecosystems. **Now deployed on Vercel with real-time cloud collaboration!**

## 🌐 Live Demo & Deployment

### Access the Live App
Your Particle Life Synth is deployed at your Vercel URL. All presets are automatically synced to the cloud!

### Key Features
- **Automatic Cloud Sync** - No manual steps, just works
- **Real-time Collaboration** - See team presets instantly
- **Share via Links** - Click 🔗 to share any preset
- **No Signup Required** - Anonymous authentication
- **Works Offline** - Falls back to local storage

## Quick Start (Local Development)

### Running Locally
```bash
# Start local server
python3 serve.py

# Access at
http://localhost:8000
```

### Deployment Setup

1. **Firebase** (Already configured ✅)
   - Firestore for preset storage
   - Anonymous authentication
   - Real-time synchronization

2. **Vercel** (Already deployed ✅)
   - Automatic deployments from GitHub
   - Zero configuration needed
   - Updates on every push

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed setup instructions.

## Controls

### Keyboard Shortcuts
- **C** - Toggle UI visibility
- **X** - Copy current settings
- **V** - Randomize values
- **R** - Randomize force relationships  
- **Space** - Pause/Resume simulation

### Features
- **25+ configurable parameters** for physics and visuals
- **Preset system** with save/load functionality
- **Cloud sync** for collaborative preset sharing (NEW!)
- **Share presets** via temporary links
- **Force relationship editor** with visual graph
- **Per-species customization** of colors and particle counts
- **Visual effects** including trails, halos, and species glow
- **Copy/paste workflow** for quick configuration sharing

## Development

### Structure
```
src/
├── core/           # Particle physics engine
├── ui/             # UI components (presets, editors, controls)
├── utils/          # Storage and preset management
└── main.js         # Application entry point
```

### Key Technologies
- Vanilla JavaScript (ES6 modules)
- Canvas 2D rendering
- IndexedDB + localStorage for persistence
- No build tools required

## Status

- **Visual Engine** - Complete
- **Preset System** - Complete  
- **Performance** - 60+ FPS with 500 particles
- **Audio Engine** - In development (20%)
- **VST/AU Plugin** - Planned

## Testing & Debugging

### Test Suites
- **Main Test Suite**: `http://localhost:8000/test-suite.html` - Comprehensive automated testing
- **Debug Tools**: `http://localhost:8000/debug-tools.html` - Interactive debugging utilities
- **Performance Tests**: `http://localhost:8000/performance-test.html` - Performance profiling

### Testing Capabilities
- **Automated Issue Detection**: Self-scanning for problems
- **Performance Monitoring**: Real-time FPS, memory tracking
- **Regression Testing**: Prevent introduction of bugs
- **Fix Validation**: Verify recent bug fixes
- **Architecture Testing**: Component validation

## License

MIT License - See LICENSE file for details