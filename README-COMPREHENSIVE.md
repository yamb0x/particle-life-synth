# Comprehensive Particle Life System

## Quick Start

1. **Run the system:**
   ```bash
   ./run-comprehensive.sh
   ```

2. **Open in browser:**
   Navigate to `http://localhost:8080/index-comprehensive.html`

## Features Implemented

### UI Controls (Matching the Screenshot)
- **Controls Section**: Reset, Random Rules, Symmetric Rules
- **Config Section**: 
  - Number of Colors (2-5)
  - Seed (deterministic behavior)
  - Atoms per-color
  - Time Scale, Viscosity, Gravity
  - Click Pulse, Wall Repel, Random Exploration
- **Drawings Section**: Radius, Shape, Clustering, Background
- **Export Section**: Image/Video export
- **Rules Section**: Per-species interaction matrix

### Advanced Features Beyond Basic Particle Life
- **State-Based AI**: Hunting, Fleeing, Mating, Foraging behaviors
- **Chemical Signaling**: Pheromone fields for communication
- **Resource Competition**: Spatial resource distribution
- **Evolution**: Reproduction with trait inheritance
- **Quantum Effects**: Tunneling, entanglement options
- **Environmental Forces**: Fields, gravity, turbulence

## Keyboard Shortcuts
- **C**: Toggle parameter panel
- **R**: Reset particles
- **1-5**: Load presets
- **Click**: Create pulse effects

## Presets Available
1. Biological Ecosystem (predator-prey dynamics)
2. Quantum Foam (uncertainty-based behaviors)
3. Neural Network (signal propagation)
4. Fluid Dynamics (vortex patterns)
5. Crystalline Growth (lattice formation)

## Compilation Note

If you need to compile TypeScript files:
1. Install TypeScript globally: `npm install -g typescript`
2. Run: `tsc` in the project directory

The JavaScript files are already included for immediate use.