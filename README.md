# Particle Life Synth

A visual particle simulation system that creates emergent behaviors, designed to control synthesizer parameters through living particle ecosystems.

## Quick Start

### Starting the Server
```bash
# Method 1: Python (Recommended)
python3 serve.py

# Method 2: npm 
npm run dev

# Access the app
open http://localhost:8000
```

### Stopping the Server
```bash
# Quick stop
pkill -f "python3 serve.py"

# Or use Ctrl+C in the terminal
```

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