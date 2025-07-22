# Particle Life Synth

A visual particle simulation system that creates emergent behaviors through multi-species interactions. Features real-time cloud collaboration and will eventually control synthesizer parameters through living particle ecosystems.

## 🌐 Live Demo

**Deploy instantly**: Follow the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) to get your own live version with cloud collaboration.

### Key Features
- **Real-time Cloud Collaboration** - Share presets instantly via links with robust Firebase management
- **25+ Configurable Parameters** - Physics, visuals, and particle behaviors
- **Visual Distribution Editor** - Paint particle distributions with brush, circle, lightning, and eraser modes
- **Smart Preset Management** - Intelligent cloud sync with test artifact prevention and duplicate elimination
- **Streamlined Workflow** - Save as new preset by simply changing the name
- **Performance Optimized** - 60+ FPS with 500+ particles
- **No Build Required** - Pure vanilla JavaScript with ES6 modules

## Quick Start

```bash
# Clone and start local server
git clone <your-repo>
cd particle-life-synth
python3 serve.py

# Access at http://localhost:8000
```

**For deployment**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete Firebase + Vercel setup.

## Controls & Features

### Keyboard Shortcuts
- **C** - Toggle UI visibility
- **X** - Copy settings | **V** - Randomize values | **R** - Randomize forces
- **Space** - Pause/Resume simulation

### Core Features
- **Visual Distribution Editor** - Paint particle starting positions with brush, circle, lightning, and eraser modes
- **Force Relationship Editor** - Visual matrix for species interactions
- **Real-time Parameter Adjustment** - 25+ physics and visual parameters
- **Preset System** - Save, load, and share configurations
- **Cloud Collaboration** - Share presets via links with automatic sync
- **Performance Monitoring** - Built-in FPS tracking and optimization

## Architecture

```
src/
├── core/           # Particle physics engine
├── ui/             # UI components and editors
├── utils/          # Storage and preset management
├── config/         # Firebase configuration
└── main.js         # Application entry point
```

**Tech Stack**: Vanilla JavaScript (ES6 modules) • Canvas 2D • IndexedDB/localStorage • Firebase • Vercel

## Development Status

| Component | Status | Notes |
|-----------|--------|--------|
| **Visual Engine** | ✅ Complete | 60+ FPS with 500+ particles |
| **Distribution Editor** | ✅ Complete | Multi-mode painting system |
| **Cloud Collaboration** | ✅ Complete | Firebase + Vercel deployment |
| **Testing Suite** | ✅ Complete | Automated testing and debugging |
| **Audio Engine** | 🔄 20% | Next development phase |
| **VST/AU Plugin** | 📋 Planned | Future milestone |

## Testing & Debugging

### Available Test Pages
- **`/test-suite.html`** - Comprehensive automated testing
- **`/debug-tools.html`** - Interactive debugging, diagnostics, and Firebase management
- **`/performance-test.html`** - Performance profiling and optimization

### Issue Tracking
See [`/issues/README.md`](issues/README.md) for current bugs and feature requests.

## License

MIT License