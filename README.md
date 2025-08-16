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
- **V** - Randomize particle values
- **R** - Randomize force relationships / Reset collapsible menus
- **M** - Mute/freeze simulation (preserve battery)
- **Shift + Plus** - Next preset | **Shift + Minus** - Previous preset
- **Shift + E** - Expand all UI sections | **Shift + C** - Collapse all UI sections
- **Alt + 1-9** - Toggle specific UI sections

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

## Latest Updates (August 16, 2025)

### 🎨 UI/UX Improvements
- **Monochromatic Theme** - Consistent grayscale color scheme throughout interface
- **Enhanced Friction Control** - Extended range (0-1.0) for more dramatic particle effects
- **4-Color Sinusoidal Background** - New mode for smooth transitions between 4 colors
- **Modulation Muting** - Mute/unmute individual modulations with visual feedback
- **Improved Mouse Interaction** - Click and drag creates continuous shockwave effects
- **Simplified Distribution Drawer** - Streamlined to essential modes: Draw, Erase, Random
- **Species Color Wrapping** - Proper line breaking for high species counts
- **Noise Seed Consistency** - Unified slider UI with randomize button
- **Force Relationship Sync** - Species names properly update when colors change
- **Environmental Pressure** - Increased effect strength for better visibility

### 🚀 Major Features
- **Advanced Modulation System** - Noise-based parameter modulation with waveform selection and per-species control
- **Modulation Persistence** - Full save/load support for modulations in presets and Firebase
- **Enhanced UI Organization** - Collapsible sections with inline controls and better visual hierarchy
- **Per-Species Trail System** - Individual trail controls for each species with unique motion signatures
- **Advanced Collision Physics** - Size-based interactions with environmental pressure and chaos injection
- **Mathematical Distribution Patterns** - 8+ mathematical patterns including Fibonacci and golden ratio
- **Enhanced Force Presets** - 5 main categories with 15+ sub-patterns for complex behaviors
- **Species Auto-Naming** - Intelligent color-based naming with automatic updates
- **Cloud Storage Revolution** - Smart ID system with test artifact prevention and conflict resolution

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