# Visual Prototype Specification
## Multi-Particle Life Synthesizer - Phase 1

### Visual Requirements

#### Exact Ventrella Clusters Aesthetic
1. **Particle Rendering**
   - Small circular particles with soft edges
   - Glowing/luminous appearance
   - Semi-transparent for overlap visibility
   - Size: ~4-8 pixels diameter (scalable)

2. **Motion Trails**
   - Blurred trails behind each particle
   - Trail length proportional to velocity
   - Gradual fade-out over ~20-30 frames
   - Same color as particle but decreasing opacity

3. **Color Palette** (match Ventrella exactly)
   - Pure, saturated colors
   - Additive blending for overlaps
   - Glow effect on particle edges
   - Dark background (#000000 or very dark gray)

4. **Rendering Style**
   - Motion blur for smooth movement
   - Additive blending mode
   - No harsh edges or pixelation
   - Continuous smooth animation

---

### Interface Design

#### Floating Parameter Panel (Toggle: 'C' key)
```
┌─────────────────────────────────────┐
│ PARTICLE LIFE PARAMETERS            │
├─────────────────────────────────────┤
│ Species Count: [1-5]                │
│ Particles per Species: [10-200]     │
│                                     │
│ ATTRACTION MATRIX                   │
│ ┌─────────────────────────────┐    │
│ │ R→R  R→B  R→G  R→Y  R→P    │    │
│ │ B→R  B→B  B→G  B→Y  B→P    │    │
│ │ G→R  G→B  G→G  G→Y  G→P    │    │
│ │ Y→R  Y→B  Y→G  Y→Y  Y→P    │    │
│ │ P→R  P→B  P→G  P→Y  P→P    │    │
│ └─────────────────────────────┘    │
│                                     │
│ Physics:                            │
│ - Max Force: [0.0-2.0]             │
│ - Max Speed: [0.0-5.0]             │
│ - Friction: [0.0-1.0]              │
│ - Min Distance: [1-50]             │
│ - Max Distance: [50-500]           │
│                                     │
│ Visual:                             │
│ - Trail Length: [0-50]             │
│ - Particle Size: [2-20]            │
│ - Glow Intensity: [0-1]            │
│                                     │
│ [Save Preset] [Load Preset]         │
│ [Reset] [Randomize]                 │
└─────────────────────────────────────┘
```

#### Keyboard Shortcuts
- **C**: Toggle parameter panel
- **Space**: Pause/resume simulation
- **R**: Reset particles to random positions
- **S**: Save current state
- **L**: Load saved state
- **1-5**: Toggle species on/off
- **F**: Toggle fullscreen
- **D**: Toggle debug overlay

---

### Smart Learning System

#### Pattern Recognition & Analysis

1. **Behavior Tracking**
   ```cpp
   struct BehaviorMetrics {
       float clusterCoherence;      // 0-1: How well particles stay together
       float patternStability;      // 0-1: How stable formations are
       float movementComplexity;    // 0-1: Entropy of motion
       float interSpeciesMixing;    // 0-1: Boundary interactions
       float energyConservation;    // 0-1: System stability
   };
   ```

2. **Success Criteria Detection**
   - Monitor for "interesting" behaviors:
     - Stable orbits
     - Synchronized swarms
     - Spiral formations
     - Pulsing clusters
     - Chain reactions

3. **Automatic Parameter Logging**
   ```cpp
   struct SuccessfulBehavior {
       std::string name;
       float[5][5] attractionMatrix;
       PhysicsParams physics;
       BehaviorMetrics metrics;
       float duration;              // How long it lasted
       float interestScore;         // Calculated beauty/interest
   };
   ```

4. **Machine Learning Integration**
   - Record successful parameter combinations
   - Train model to predict interesting behaviors
   - Suggest parameter adjustments
   - Auto-generate new presets

---

### Technical Implementation

#### Core Architecture
```cpp
class ParticleSystem {
    // Rendering
    void renderWithTrails();
    void updateTrailBuffer();
    
    // Physics
    void updateForces();
    void integrateVelocity();
    void handleBoundaries();
    
    // Metrics extraction
    BehaviorMetrics analyzeCurrentState();
    void recordInterestingBehavior();
    
    // Parameter learning
    void saveSuccessfulConfiguration();
    void suggestNextParameters();
};
```

#### Rendering Pipeline
1. **Particle Pass**
   - Draw particles to framebuffer
   - Apply glow shader
   - Additive blending

2. **Trail Pass**
   - Accumulate previous frames
   - Apply motion blur
   - Fade based on age

3. **Composite Pass**
   - Combine particles and trails
   - Apply final glow/bloom
   - Output to screen

#### Performance Targets
- 60 FPS with 1000 particles
- Real-time parameter updates
- Smooth trail rendering
- Low latency interaction

---

### Session Recording System

#### Data Collection
1. **Parameter History**
   - Log all parameter changes with timestamps
   - Record user interactions
   - Track which configurations led to saves

2. **Behavior Classification**
   ```cpp
   enum BehaviorType {
       ORBITAL,      // Circular/elliptical orbits
       SWARMING,     // Flocking behavior
       CRYSTALLINE,  // Grid/lattice formation
       CHAOTIC,      // Random/turbulent
       PULSING,      // Breathing clusters
       FLOWING,      // Stream-like motion
   };
   ```

3. **Success Metrics**
   - User saves preset = high success
   - Long observation time = medium success
   - Parameter fine-tuning = interest indicator

#### Export for Audio Design
```json
{
  "session": {
    "duration": 3600,
    "successfulBehaviors": [
      {
        "timestamp": 120.5,
        "behavior": "ORBITAL",
        "parameters": {...},
        "metrics": {
          "clusterDensity": 0.8,
          "boundaryTurbulence": 0.2,
          "populationOscillation": 0.5
        },
        "audioMapping": {
          "suggestedFilter": "smooth sweep",
          "suggestedModulation": "slow LFO"
        }
      }
    ]
  }
}
```

---

### Development Milestones

#### Week 1-2: Core Rendering
- [ ] Exact Ventrella visual match
- [ ] Smooth trails implementation
- [ ] Basic particle physics

#### Week 3-4: Interface & Interaction
- [ ] Floating parameter panel
- [ ] Keyboard shortcuts
- [ ] Preset save/load

#### Week 5-6: Smart System
- [ ] Behavior detection algorithms
- [ ] Success metrics tracking
- [ ] Session recording

#### Week 7-8: Analysis & Export
- [ ] Pattern classification
- [ ] Parameter optimization
- [ ] Audio mapping suggestions

---

### Success Criteria

1. **Visual Fidelity**: Indistinguishable from Ventrella's Clusters
2. **Performance**: Smooth 60 FPS with 1000+ particles
3. **Usability**: Intuitive parameter exploration
4. **Intelligence**: Successfully identifies and saves interesting behaviors
5. **Export**: Provides useful data for audio parameter mapping

---

*This prototype will serve as the foundation for understanding which particle behaviors create the most musically useful parameter modulations.*