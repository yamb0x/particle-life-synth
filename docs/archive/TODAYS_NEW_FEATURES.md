# New Features Implemented Today

## Advanced Physics System

### Environmental Pressure Control
- **Global force system** that creates center attraction/repulsion effects
- **UI Control**: Slider range -1.0 to 1.0 (Repel ↔ Attract)
- **Physics Implementation**: Applies radial force from canvas center to all particles
- **Effect**: Creates flow patterns, vortices, and global particle movements

### Chaos Level System
- **Random force injection** to prevent static pattern formation
- **UI Control**: Slider range 0.0 to 1.0 (Stable ↔ Chaotic)
- **Physics Implementation**: Adds random force components each frame
- **Effect**: Organic unpredictability, prevents system equilibrium

### Per-Species Collision Physics
- **Variable collision sizes** based on individual species properties
- **UI Control**: "Use per-species size" checkbox + collision multiplier slider
- **Physics Implementation**: Each species uses its visual size for collision detection
- **Effect**: Realistic size-based interactions, large particles push small ones

### New Walls UI area in the main UI
- **Remove Walls (Wrap-Around)** remove the walls and let the particles move from one side to another
- **Repulsive Force**: slider to apply a force on the bounderies when the particles are attracted to the edges

## Enhanced Species System

### Individual Species Properties
- **Per-species size variation collision**: Each species can have different particle sizes and it support the particles colision size
- **Per-species mobility**: Speed multipliers for differentiated movement new control per species in the ui
- **Per-species inertia**: Individual friction values for varied responsiveness new control per species in the ui
- **adjusted sizing**: Species sizes can vary ±25% from base particle size

### Species Halo System fixed (its a nice way to add subtle blur effects)
- **Per-species halo intensity**: Individual halo strength (0-0.01)
- **Per-species halo radius**: Radius multiplier for halo size (0.5-5.0)
- **Simplified UI**: Direct control without complex checkbox system
- **Dual-mode support**: Works in both normal and dreamtime render modes

## Force Pattern Enhancements

- **Cohesive clusters**: Self-organizing groups with strong internal attraction (chose clusters from the dropdown menu under forces)
- **Competitive dynamics**: Species compete for territory and resources
- **Symbiotic relationships**: Mutually beneficial species interactions
- **Hierarchical structures**: Dominant-subordinate species relationships


### Advanced Force Calculation
- **Distance-modulated attraction**: Better clustering with optimal distance zones
- **Velocity-dependent dampening**: High-speed particles get extra friction
- **Multi-zone force profiles**: Inner/middle/outer interaction ranges
- **Temporal dynamics**: Breathing effects and oscillations for organic behavior


### UI Control Improvements
- **Extended parameter ranges**: Higher limits for force strength and physics values
- **Real-time value displays**: Immediate feedback for all new controls
- **Organized control groups**: Advanced physics section with labeled controls (need further organisation)
- **Particle Section**: moved the particles control from the color tab to the particle tab
- **Force Section**: merged all the forces into a new section and added new parameters per dropdown


## Usage Examples

### Creating Dynamic Ecosystems
1. Set **Environmental Pressure** to 0.3 for center attraction
2. Add **Chaos Level** of 0.15 for organic variation
3. Enable **per-species collision** for realistic interactions
4. Use **Predator-Prey** force pattern for chase dynamics

### Designing Glowing Species
1. Select species in **glow controls**
2. Set **glow intensity** to 0.7 for strong effect
3. Adjust **glow size** to 2.0 for larger radius
4. Fine-tune **halo settings** for atmospheric effects

### Building Cluster Behaviors
1. Choose **Clusters** force pattern preset
2. Adjust **species count** to 4-6 for clear groups
3. Enable **collision physics** for boundary formation
4. Add light **chaos** (0.1) for organic movement
