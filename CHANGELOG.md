# Changelog

All notable changes to the Particle Life Synth project will be documented in this file.

## [Unreleased] - 2025-08-16

### 🎨 UI/UX Improvements
- **Monochromatic Theme** - Replaced blue/green force indicators with consistent grayscale colors throughout interface
- **Enhanced Friction Control** - Extended friction slider range from 0-0.5 to 0-1.0 for more dramatic particle effects
- **4-Color Sinusoidal Background** - Added new background mode with smooth sine-based transitions between 4 colors
- **Modulation Muting** - Added mute/unmute button (🔊/🔇) for individual modulations with visual feedback
- **Improved Mouse Interaction** - Enhanced click and drag to create continuous shockwave effects along the drag path
- **Simplified Distribution Drawer** - Streamlined mode buttons to essential options: Draw, Erase, Random
- **Species Color Wrapping** - Fixed species color selection to properly wrap to new lines with high species counts
- **Noise Seed Consistency** - Converted noise seed input to consistent range slider (0-1000) with randomize button
- **Force Relationship Sync** - Fixed species names to properly update in force relationships when colors change
- **Environmental Pressure** - Increased effect strength from 0.1 to 0.5 for better visibility

### 🛠️ Technical Improvements
- **ModulationManager Enhancement** - Added `toggleMute()` method and muted state tracking for modulations
- **4-Color Interpolation** - Implemented smooth sine-based interpolation algorithm for 4-color backgrounds
- **Mouse Event Handling** - Enhanced mousemove and touchmove events to create shockwaves along drag path
- **UI Consistency** - Standardized all control styling to follow design system patterns

### 🐛 Bug Fixes
- Fixed force relationship species name synchronization issues
- Fixed particle distribution color selection line wrapping
- Fixed noise pattern seed UI inconsistency
- Fixed environmental pressure effect visibility
- Fixed modulation state persistence for muted modulations

## [1.0.0] - 2025-08-14

### 🚀 Major Features
- **Advanced Modulation System** - Noise-based parameter modulation with waveform selection
- **Modulation Persistence** - Full save/load support for modulations in presets and Firebase
- **Enhanced UI Organization** - Collapsible sections with inline controls
- **Per-Species Trail System** - Individual trail controls for each species
- **Advanced Collision Physics** - Size-based interactions with environmental pressure
- **Mathematical Distribution Patterns** - 8+ mathematical patterns including Fibonacci
- **Enhanced Force Presets** - 5 main categories with 15+ sub-patterns
- **Species Auto-Naming** - Intelligent color-based naming with automatic updates
- **Cloud Storage Revolution** - Smart ID system with test artifact prevention

### 🌐 Cloud Collaboration
- **Firebase Integration** - Real-time preset sharing with anonymous authentication
- **Vercel Deployment** - Automatic deployments from GitHub
- **Smart Sync** - Intelligent conflict resolution and duplicate prevention
- **Share Links** - Instant preset sharing via URL parameters

### 🎨 Visual Systems
- **Dreamtime Rendering** - Advanced glow and halo effects
- **Per-Species Visual Control** - Individual settings for trails, halos, and glows
- **Wrap-Around Boundaries** - Toroidal topology for seamless particle movement
- **Advanced Color System** - Sinusoidal background animations

### ⚙️ Physics Engine
- **Collision Detection** - Size-based collisions with offset control
- **Environmental Forces** - Global pressure and chaos injection
- **Per-Species Dynamics** - Individual mobility and inertia settings
- **Force Pattern Presets** - Predator-prey, symbiotic, crystal formation patterns

### 📊 Performance
- **60+ FPS** with 500+ particles
- **Optimized Rendering** - Efficient canvas operations
- **Smart Caching** - Gradient and color caching systems
- **Spatial Partitioning** - Grid-based collision detection

## [Beta] - 2025-08-01

### Initial Release
- Basic particle system with multi-species interactions
- Simple force editor and distribution drawer
- Local storage for presets
- Basic keyboard shortcuts
- Canvas 2D rendering