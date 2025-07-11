# Particle Life

An interactive particle simulation inspired by [Ventrella's Clusters](https://github.com/Ventrella/Clusters) that creates mesmerizing emergent behaviors from simple attraction/repulsion rules.

![Particle Life Demo](https://github.com/yourusername/particle-life-synth/assets/demo.gif)

## ✨ Features

### Interactive Force Editor
- **Visual XY Graph**: Click and drag to set forces between particle species
- **Real-time Feedback**: See force values while hovering
- **Intuitive Design**: Left = Repel, Center = Neutral, Right = Attract

### Dynamic Visuals
- **Smooth Trails**: Adjustable motion trails without grey buildup
- **Clean Rendering**: Simple circles with beautiful emergent patterns
- **Performance**: Optimized Canvas 2D rendering at 60 FPS

### Flexible Controls
- **Particle Count**: 0-1000 particles per color
- **Species Count**: 1-5 different particle colors
- **Physics Tuning**: Force strength, friction, wall bounce
- **Trail Settings**: Toggle on/off, adjust fade length

### Presets
- **Predator-Prey**: Classic chase dynamics
- **Crystallization**: Self-organizing structures
- **Vortex**: Spiral patterns
- **Symbiosis**: Complex interdependencies
- **Randomize**: Discover new patterns

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/particle-life-synth.git
cd particle-life-synth

# Start local server (Python)
python3 serve.py

# Or use any static server
npx http-server
# or
python3 -m http.server 8000

# Open in browser
http://localhost:8000
```

## 🎮 How to Use

1. **Select Preset**: Choose from dropdown or start with Predator-Prey
2. **Adjust Forces**: 
   - Select species pair (From/To dropdowns)
   - Click and drag on the graph to set attraction/repulsion
3. **Fine-tune**:
   - Particle count slider for density
   - Trail length for visual effects
   - Physics parameters for different behaviors
4. **Experiment**: Try different force combinations to discover new patterns!

## 🔬 How It Works

Each particle species has a unique force relationship with every other species:

```
Force Matrix Example (Predator-Prey):
         Red   Green  Blue
Red      0.3   0.8   -0.7   (Red chases Green, flees Blue)
Green   -0.8   0.3    0.8   (Green flees Red, chases Blue)  
Blue     0.8  -0.8    0.3   (Blue chases Red, flees Green)
```

These simple rules create complex behaviors:
- **Positive forces** → Attraction (particles move together)
- **Negative forces** → Repulsion (particles move apart)
- **Zero** → Neutral (no interaction)

## 🛠️ Technical Details

- **Pure JavaScript**: No dependencies, just vanilla JS
- **Canvas 2D API**: Hardware-accelerated rendering
- **Efficient Physics**: O(n²) with spatial optimization
- **Responsive Design**: Adapts to window size

## 📁 Project Structure

```
particle-life-synth/
├── index.html                    # Single page app
├── src/
│   ├── main.js                  # Application entry & UI
│   └── core/
│       └── SimpleParticleSystem.js  # Core particle physics
├── serve.py                     # Python dev server
└── README.md                    # This file
```

## 🎨 Customization

Modify force patterns in `SimpleParticleSystem.js`:

```javascript
// Example: Create your own preset
loadPreset(name) {
    switch(name) {
        case 'myPattern':
            this.socialForce = [
                [0.5, -0.8, 0.3, 0.0, -0.5],  // Red's forces
                // ... more species
            ];
            break;
    }
}
```

## 🌟 Tips for Best Patterns

1. **Balance**: Mix positive and negative forces
2. **Asymmetry**: A→B ≠ B→A creates more interesting dynamics
3. **Moderation**: Extreme values (-1 or 1) can be unstable
4. **Cycles**: Create rock-paper-scissors relationships
5. **Experiment**: Small changes can have big effects!

## 📝 License

MIT License - Feel free to use in your own projects!

## 🙏 Acknowledgments

- [Jeffrey Ventrella](https://ventrella.com/) for the original Clusters concept
- Inspired by the particle life community
- Built with the help of Claude

---

*If you discover interesting patterns, please share them! 🎉*