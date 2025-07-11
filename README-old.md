# Comprehensive Particle Life System

An advanced particle simulation with 100+ parameters, biological behaviors, and emergent intelligence. Inspired by Jeffrey Ventrella's Clusters and enhanced with state machines, chemical signaling, and evolutionary dynamics.

![Particle Life System](https://img.shields.io/badge/version-3.0-blue)
![Status](https://img.shields.io/badge/status-active-green)
![Parameters](https://img.shields.io/badge/parameters-100+-orange)

## Overview

This project implements a sophisticated particle simulation system where different species of particles interact through customizable force fields, creating mesmerizing emergent behaviors. The system features both Ventrella-inspired physics with force field parameters (r1, r2, f1, f2) and simpler attraction matrix behaviors.

## 🚀 Quick Start

```bash
# Clone the repository
git clone [repository-url]
cd particle-life-synth

# Start with auto-launch script (compiles if needed)
./start-comprehensive.sh

# Or use the simple run script
./run.sh
```

The browser will open automatically!

## 🎮 Controls

- **C**: Toggle comprehensive parameter panel
- **R**: Reset all particles
- **1-5**: Load behavior presets
- **Click**: Create pulse effects
- **Space**: Pause/resume (coming soon)

## 🎯 Features

### Core Parameters (100+)
- **Physics**: Attraction matrix, force factor, viscosity, gravity, turbulence
- **Species**: Mass, charge, temperature, metabolism, behavioral traits
- **Environment**: Field effects, resource distribution, pressure, radiation
- **Emergent**: Flocking, clustering, pattern formation, collective intelligence
- **Chemical**: Pheromone signaling, reactions, catalysts
- **Quantum**: Tunneling, entanglement, uncertainty effects

### Visual Features
- **WebGL Rendering**: High-performance GPU-accelerated graphics
- **Smooth Trails**: Each particle leaves a fading trail showing its path
- **Glow Effects**: Adjustable glow intensity for particles
- **Adaptive Sizing**: Runner particles are 50% larger than regular particles
- **Species Toggle**: Visual indicators show active species

### 19 Ecosystem Presets

#### Ventrella Physics (Force Field System)
1. **Pollack** - Chaotic paint-splatter patterns
2. **Gems** - Crystalline lattice structures
3. **Alliances** - Groups form strategic partnerships
4. **Red Menace** - Predator-prey dynamics with red hunters
5. **Acrobats** - Dynamic acrobatic movements
6. **Mitosis** - Cell-like division behavior
7. **Planets** - Orbital mechanics and gravitational effects
8. **Stigmergy** - Ant-like trail following
9. **Field** - Uniform field effects
10. **Simplify** - Minimalist interactions
11. **Dreamtime** - Surreal, dreamlike behaviors

#### Nature Behaviors (Attraction Matrix)
12. **Predator-Prey** - Classic ecosystem dynamics
13. **Cellular Automata** - Self-organizing patterns
14. **Coral Reef** - Symbiotic relationships
15. **Magnetic Fields** - Dipole-like attractions
16. **Flocking Birds** - Emergent swarm behavior
17. **Chemical Reaction** - Molecular interactions
18. **Galaxy Formation** - Spiral galaxy patterns
19. **Neural Network** - Information flow dynamics

## 🎛️ Parameter Controls

### Physics Parameters
- **Force**: 0-3.0 (strength of particle interactions)
- **Speed**: 0-15.0 (maximum particle velocity)
- **Friction**: 0-1.0 (velocity damping)
- **Min Distance**: 5-50 (repulsion threshold)
- **Max Distance**: 50-500 (interaction cutoff)

### Visual Parameters
- **Trail Length**: 0-100 (persistence of motion trails)
- **Particle Size**: 1-10 (base particle diameter)
- **Glow Intensity**: 0-1.0 (glow effect strength)

### Population
- **Particles per Species**: 50-1000 (adjust population density)

## 📊 Behavior Metrics

The system tracks real-time metrics:
- **Cluster Coherence**: How well particles group by species
- **Pattern Stability**: Consistency of formations over time
- **Movement Complexity**: Entropy of particle motion
- **Inter-species Mixing**: Boundary interaction levels
- **Energy Conservation**: System stability metrics

## 🔧 Technical Architecture

### Core Components
- **ParticleSystem** (`src/core/ParticleSystem.ts`) - Main simulation engine
- **ForceField** (`src/core/ForceField.ts`) - Advanced physics calculations
- **WebGLRenderer** (`src/rendering/WebGLRenderer.ts`) - GPU-accelerated rendering
- **TrailRenderer** (`src/rendering/TrailRenderer.ts`) - Smooth trail effects
- **ParameterPanel** (`src/ui/ParameterPanel.ts`) - Interactive controls

### Performance
- Supports 1000+ particles at 60 FPS
- GPU-accelerated rendering with custom WebGL shaders
- Optimized force calculations with spatial culling
- Efficient trail rendering using triangle strips

### Browser Compatibility
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

## 🏗️ Development

### Prerequisites
- Modern web browser with WebGL support
- Python 3.x (for development server)
- Node.js and npm (optional, for TypeScript compilation)

### Project Structure
```
particle-life-synth/
├── src/
│   ├── core/           # Simulation logic
│   ├── rendering/      # WebGL rendering
│   ├── ui/            # User interface
│   └── main.ts        # Entry point
├── docs/              # Documentation
├── index.html         # Main HTML file
├── run.sh            # Dev server script
└── README.md         # This file
```

### Building from Source
```bash
# Install TypeScript (if needed)
npm install -g typescript

# Compile TypeScript files
npx tsc

# Start development server
./run.sh
```

## 🎵 Future Audio Integration

This visual system is designed as the foundation for a synthesizer where:
- Particle behaviors → Filter modulation
- Cluster dynamics → Oscillator control
- Species interactions → Cross-modulation
- Spatial patterns → Stereo field control
- Energy levels → Amplitude envelopes

## 📖 Additional Documentation

- [`docs/development-roadmap.md`](docs/development-roadmap.md) - Development plan
- [`docs/visual-prototype-spec.md`](docs/visual-prototype-spec.md) - Visual requirements
- [`docs/parameter-mapping-reference.md`](docs/parameter-mapping-reference.md) - Audio parameter mapping
- [`docs/multi-particle-synth-architecture.md`](docs/multi-particle-synth-architecture.md) - Technical architecture

## 🙏 Credits

- Inspired by [Jeffrey Ventrella's Clusters](https://ventrella.com/Clusters/)
- Particle Life concept by [Tom Mohr](https://particle-life.com/)
- Built with TypeScript and WebGL

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

*Built with ❤️ for the generative art and music community by yamb0x.eth*