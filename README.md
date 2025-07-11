# Particle Life

A beautiful particle simulation inspired by [Clusters](https://github.com/Ventrella/Clusters) demonstrating emergent behaviors from simple rules.

## Features

- **Emergent Behaviors**: Complex patterns from simple attraction/repulsion rules
- **Interactive Force Editor**: Click-and-drag graph to adjust particle relationships
- **Smooth Trails**: Configurable motion trails for visual flow
- **Real-time Controls**: Adjust physics, visuals, and particle counts on the fly
- **Presets**: Predator-Prey, Crystallization, Vortex, and Symbiosis patterns

## Quick Start

```bash
# Clone the repo
git clone https://github.com/yourusername/particle-life-synth.git
cd particle-life-synth

# Start local server
python3 serve.py
# or
npm install -g http-server && http-server

# Open http://localhost:8000
```

## Controls

- **Particles**: Adjust count (0-1000) and number of colors (1-5)
- **Forces**: Click/drag the graph to set attraction (right) or repulsion (left)
- **Trails**: Toggle and adjust fade length for motion effects
- **Physics**: Fine-tune force strength, friction, and wall bounce

## How It Works

Each particle color has unique relationships with others:
- **Positive forces** (green) = attraction
- **Negative forces** (red) = repulsion
- **Zero** (center) = neutral

Simple rules create complex emergent behaviors like flocking, orbiting, and crystallization.

## Browser Support

Works best in modern browsers with Canvas 2D support. Chrome/Firefox recommended.

## License

MIT