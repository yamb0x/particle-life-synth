# Recent Updates - New features added 30-07-2025

## 🎛️ Physics & Collision System
- **Collision Controls Reorganized**: Moved to dedicated Particles section with improved UI
- **Collision Offset**: Fine-tune collision boundaries (0-50 range)
- **Collision Strength**: Adjust repulsion force intensity (0-2 range)
- **Per-Species Collision**: Each species uses its visual size for realistic size-based interactions
- **Environmental Pressure**: Global center attraction/repulsion (-1.0 to 1.0)
- **Chaos Level**: Random force injection for organic movement (0.0 to 1.0)

## 🌊 Per-Species Trail System
- **Individual Trail Intensity**: Each species has independent trail opacity controls
- **Trail Length Variation**: Species can have different trail persistence
- **Visual Differentiation**: Create unique motion signatures per species

## 🏃 Per-Species Dynamics
- **Mobility Control**: Individual speed multipliers per species (0.1-2.0)
- **Inertia Settings**: Custom friction values for varied responsiveness per species
- **Size Variation**: ±25% automatic size variance from base particle size
- **Group Behavior**: Different species move and respond at different rates

## 🎨 Distribution Drawing 
- **Mathematical Circle Patterns**: 
  - Fibonacci spirals
  - Fractal recursion
  - Sinusoidal waves
  - Golden ratio distribution
  - Phyllotaxis (sunflower) patterns
- **Species-Responsive Random Patterns**:
  - Red: Quantum interference (aggressive patterns)
  - Green: Neural noise (organic patterns)
  - Blue: Data corruption (digital patterns)
  - Yellow: Temporal distortion (flowing patterns)
  - Purple: Electromagnetic pulse (geometric patterns)
- **Precision Circle Mode**: Click to set center, click again for radius
- **Sci-Fi Glitch Mode**: Animated time-based glitch effects
- **Smart Erase**: Cmd+Click erases all species in brush area

##  Force System New Features
- **Main Force Presets**:
  - **Predator-Prey**: Dynamic chase behaviors with population balance control
  - **Symbiotic**: Mutual benefit relationships with partnership strength
  - **Crystals**: Lattice formation with structural patterns
  - **Vortex**: Spiral dynamics with rotation control
  - **Chain Reaction**: Cascading interactions
- **Sub-Pattern Options**:
  - Predator-Prey: Classic chase, pack hunting, ambush tactics
  - Symbiotic: Mutualistic pairs, symbiotic chains, collective benefit
  - Crystals: Cubic lattice, hexagonal, dynamic crystallization
  - Vortex: Single spiral, double helix, chaotic swirls
  - Chain Reaction: Domino effect, wave propagation, explosive spread
- **Force Profiles**: Inner/middle/outer zone interactions
- **Temporal Dynamics**: Breathing effects and oscillations

## 🎨 Species Auto-Naming
- **Color-Based Names**: Species automatically named Red, Green, Blue, Yellow, Purple
- **Smart Detection**: Names update when colors significantly change
- **Consistent Identity**: Maintains species recognition across presets

## 🌟 Enhanced Species Features
- **Halo System**: Per-species halo intensity (0-0.01) & radius (0.5-5.0)
- **Glow Control**: Simplified direct controls without checkbox complexity
- **Dual Render Support**: Works in both normal and dreamtime modes

## 🧱 Wall System Updates
- **Wrap-Around Mode**: Particles teleport from one edge to opposite
- **Repulsive Boundaries**: Adjustable force strength at canvas edges
- **Smooth Transitions**: Natural boundary interactions

## ☁️ Cloud & Storage Revolution
- **Smart ID System**: userId_presetName format prevents duplicates
- **Test Artifact Prevention**: Blocks invalid names (Custom, AutomaticSaveAsNew, etc.)
- **Simplified Save Logic**: Name changes = new preset, same name = update
- **Cleanup Methods**: `cleanupTestPresets()` and `cleanupCloudPresets()`
- **Conflict Resolution**: Version control and duplicate prevention

## 🎯 UI Reorganization
- **Particles Section**: Size, collision, trails, per-species controls
- **Forces Section**: All force controls merged with preset system
- **Extended Ranges**: Higher limits for creative experimentation
- **Real-time Feedback**: Instant value updates across all controls
- **Logical Grouping**: Related controls now together

## 📊 Technical Improvements
- **Logger System**: ERROR, WARN, INFO, DEBUG levels with URL control
- **Performance**: Optimized collision detection for per-species sizes
- **Memory Management**: Efficient trail rendering per species
- **Error Recovery**: Graceful handling of network and storage issues