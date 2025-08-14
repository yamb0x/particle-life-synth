# Particle Life Synth

A visual particle simulation system that creates emergent behaviors through multi-species interactions. Features real-time cloud collaboration and will eventually control synthesizer parameters through living particle ecosystems.

## 🌐 Live Demo

**Deploy instantly**: Follow the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) to get your own live version with cloud collaboration.

### Key Features
- **Real-time Cloud Collaboration** - Share presets instantly via links with robust Firebase management
- **Advanced Modulation System** - Noise-based parameter modulation with per-species control and persistence
- **Advanced Physics Engine** - Collision detection, environmental pressure, chaos injection, and per-species dynamics
- **Mathematical Distribution Patterns** - Fibonacci spirals, fractal recursion, golden ratio, and species-responsive patterns
- **Per-Species Control** - Individual trail intensity, mobility, inertia, and visual effects per species
- **Enhanced Force Systems** - Predator-prey, symbiotic, crystal formation, vortex, and chain reaction presets
- **Visual Effects Suite** - Halo system, glow controls, wrap-around boundaries, and dreamtime rendering
- **Smart Preset Management** - Intelligent cloud sync with test artifact prevention and auto-naming
- **Performance Optimized** - 60+ FPS with 500+ particles, advanced collision detection
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
- **C** - Toggle UI and overlay visibility
- **V** - Randomize particle values | **R** - Randomize force relationships
- **M** - Mute/freeze simulation (preserve battery)
- **Shift + Plus** - Next preset | **Shift + Minus** - Previous preset

### Core Features

#### 🎨 Enhanced Visual Systems
- **Mathematical Distribution Patterns** - Fibonacci spirals, fractal recursion, golden ratio, phyllotaxis
- **Species-Responsive Patterns** - Quantum interference, neural noise, data corruption, temporal distortion
- **Smart Distribution Tools** - Precision circle mode, sci-fi glitch effects, smart erase (Cmd+Click)
- **Per-Species Visual Control** - Individual trail intensity, halo effects, glow systems

#### ⚙️ Advanced Physics Engine  
- **Collision System** - Per-species size-based collisions with offset and strength controls
- **Environmental Forces** - Global pressure, chaos injection, boundary interactions
- **Per-Species Dynamics** - Individual mobility, inertia, and size variation controls
- **Force Presets** - Predator-prey, symbiotic, crystal formation, vortex, chain reaction patterns

#### 🌐 Smart Collaboration
- **Cloud Preset Management** - Intelligent sync with duplicate prevention and test artifact blocking
- **Auto-Naming System** - Color-based species identification with smart detection
- **Streamlined Workflow** - Save as new preset by changing name, update existing by keeping name
- **Real-time Sharing** - Instant preset sharing via links with Firebase integration

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

## Latest Updates (August 14, 2025)

### 🚀 Major Enhancements
- **Advanced Modulation System** - Noise-based parameter modulation with waveform selection and per-species control
- **Modulation Persistence** - Full save/load support for modulations in presets and Firebase
- **Enhanced UI Organization** - Collapsible sections with inline controls and better visual hierarchy
- **Per-Species Trail System** - Individual trail controls for each species with unique motion signatures
- **Advanced Collision Physics** - Size-based interactions with environmental pressure and chaos injection
- **Mathematical Distribution Patterns** - 8+ mathematical patterns including Fibonacci and golden ratio
- **Enhanced Force Presets** - 5 main categories with 15+ sub-patterns for complex behaviors
- **Species Auto-Naming** - Intelligent color-based naming with automatic updates
- **Cloud Storage Revolution** - Smart ID system with test artifact prevention and conflict resolution

### 🎯 UI/UX Improvements  
- **Collapsible UI Sections** - Organized interface with expandable control groups
- **Inline Modulation Controls** - Quick access to modulation settings for each parameter
- **Reorganized Interface** - Logical grouping of particles, forces, and visual controls
- **Extended Parameter Ranges** - Higher limits for creative experimentation
- **Real-time Feedback** - Instant value updates across all interface elements
- **Performance Monitoring** - Built-in diagnostics with FPS tracking and resource analysis

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