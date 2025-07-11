# 🧬 Comprehensive Particle Life System

> An advanced particle simulation with 100+ parameters, biological behaviors, and emergent intelligence. Experience life-like patterns emerging from simple rules.

[![Version](https://img.shields.io/badge/version-3.0-blue)](https://github.com/yamb0x/particle-life-synth)
[![Status](https://img.shields.io/badge/status-active-green)](https://github.com/yamb0x/particle-life-synth)
[![Parameters](https://img.shields.io/badge/parameters-100+-orange)](https://github.com/yamb0x/particle-life-synth)
[![License](https://img.shields.io/badge/license-MIT-purple)](LICENSE)

![Particle Life Demo](https://user-images.githubusercontent.com/placeholder/demo.gif)

## 🌟 Features

### 🎛️ Comprehensive Parameter Control
- **100+ Tunable Parameters** - Fine control over every aspect of particle behavior
- **Real-time UI** - Sliders, matrices, and controls matching professional particle life systems
- **Preset System** - Save and load complex configurations

### 🧪 Advanced Physics
- **Non-linear Force Fields** - Multi-zone interactions with exponential, sinusoidal, and polynomial forces
- **Asymmetric Interactions** - True predator-prey dynamics
- **Environmental Effects** - Gravity, viscosity, turbulence, and field forces

### 🧠 Intelligent Behaviors
- **State Machine AI** - Hunting, fleeing, mating, foraging, clustering behaviors
- **Chemical Signaling** - Pheromone trails for communication
- **Evolution** - Reproduction with trait inheritance and mutations

### 🎨 Visual Excellence
- **Canvas 2D Rendering** - Smooth 60 FPS performance
- **Particle Trails** - Beautiful motion visualization
- **Color-coded Species** - 5 distinct species with customizable colors

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yamb0x/particle-life-synth.git
cd particle-life-synth

# Run with auto-launch script
./start-comprehensive.sh

# Or manually with Python
python3 -m http.server 8080
# Then open http://localhost:8080
```

## 🎮 Controls

| Key | Action |
|-----|--------|
| **C** | Toggle parameter panel |
| **R** | Reset particles |
| **1-5** | Load presets |
| **Click** | Create pulse effects |

## 📊 Parameter Categories

### Physics Parameters
- Attraction/Repulsion Matrix (5x5)
- Force Factor, Max Speed, Friction
- Boundary Modes (wrap, bounce, teleport)
- Min/Max Interaction Distances

### Species Properties
- Mass, Charge, Temperature
- Metabolism, Energy Capacity
- Behavioral Traits (aggression, sociability, curiosity, fear)
- Reproduction Rate, Lifespan

### Environmental Settings
- Field Effects (radial, linear, spiral, turbulent)
- Resource Distribution
- Temperature, Pressure, Radiation

### Emergent Behaviors
- Flocking Parameters
- Pattern Formation
- Collective Intelligence
- Information Transfer

## 🧬 Behavioral States

Particles exhibit complex behaviors through an advanced state machine:

1. **Exploring** - Random movement with Lévy flight patterns
2. **Hunting** - Predictive pursuit of prey species
3. **Fleeing** - Evasive maneuvers from predators
4. **Clustering** - Flocking with same species
5. **Mating** - Courtship behaviors and reproduction
6. **Foraging** - Following resource gradients
7. **Dormant** - Energy conservation mode

## 🔬 Scientific Foundation

Based on:
- Jeffrey Ventrella's "Clusters" particle life system
- Craig Reynolds' Boids flocking algorithm
- Swarm intelligence research
- Chemical signaling in biological systems
- Emergent behavior in complex systems

## 🛠️ Technology Stack

- **TypeScript** - Type-safe development
- **Canvas 2D** - Hardware-accelerated rendering
- **No Dependencies** - Pure vanilla JS/TS implementation

## 📁 Project Structure

```
particle-life-synth/
├── src/
│   ├── core/                 # Particle system core
│   │   ├── ComprehensiveParticleSystem.ts
│   │   ├── NonLinearForceField.ts
│   │   └── ParticleStateMachine.ts
│   ├── ui/                   # User interface
│   │   └── ComprehensiveParameterPanel.ts
│   └── main.ts              # Application entry
├── docs/                    # Documentation
├── index.html              # Single page app
└── start-comprehensive.sh  # Auto-launch script
```

## 🚧 Roadmap

- [ ] WebGL rendering for 10,000+ particles
- [ ] Audio synthesis integration
- [ ] Neural network control
- [ ] 3D visualization
- [ ] Mobile support
- [ ] Particle life editor

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Jeffrey Ventrella for the original Clusters concept
- The particle life community for inspiration
- All contributors and testers

---

**Made with ❤️ by [Your Name]**

*If you find this project interesting, please consider giving it a ⭐!*