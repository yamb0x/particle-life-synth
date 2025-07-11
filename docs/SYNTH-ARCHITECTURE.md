# Particle-Life Synth Architecture

## System Overview

```
MIDI Input → Voice Allocation → Synthesis Engine → Effects → Audio Output
     ↑              ↑                   ↑              ↑
     └──────────────┴───────────────────┴──────────────┘
                    Particle System Modulation
```

## Core Components

### 1. Particle Simulation Engine
- **Purpose**: Generate control data from emergent behaviors
- **Update Rate**: 60 Hz (16.7ms)
- **Output**: Normalized parameter streams (0.0-1.0)

### 2. Synthesis Engine (Multi-Mode)
Five parallel synthesis types, one per species:
- **Analog** (Red): Classic subtractive synthesis
- **FM** (Green): Frequency modulation synthesis  
- **Wavetable** (Blue): Vector synthesis with morphing
- **Granular** (Yellow): Microsound texture generation
- **Physical** (Purple): Resonator-based modeling

### 3. Voice Architecture
- **Polyphony**: Up to 128 voices
- **Voice Allocation**: Population-based distribution
- **Unison System**: Species clustering controls detuning

### 4. Modulation System
- **Primary Sources**: Particle metrics (position, velocity, density)
- **Destinations**: All synthesis parameters
- **Update Rate**: 1 kHz with interpolation
- **Smoothing**: Adaptive based on parameter type

### 5. Effects Rack
Serial chain with particle-controlled parameters:
1. **EQ**: Species frequency distribution
2. **Compression**: Population dynamics
3. **Distortion**: Chaos metrics
4. **Chorus/Phaser**: Swarm movements
5. **Delay**: Collision echoes
6. **Reverb**: Spatial distribution

## Data Flow

### Visual → Audio Pipeline
```javascript
// 60 Hz update cycle
particleSystem.update(deltaTime)
    ↓
metrics = extractMetrics(particles)
    ↓
smoothedParams = smoothParameters(metrics)
    ↓
synthEngine.updateParameters(smoothedParams)
    ↓
audioBuffer = synthEngine.process(midiNotes)
```

### Parameter Extraction
```javascript
// Per-species metrics
for each species:
  - centerOfMass
  - averageVelocity
  - populationDensity
  - boundingBox
  - nearestNeighborDistance
  
// Inter-species metrics
for each species pair:
  - separationDistance
  - relativeVelocity
  - interactionEnergy
  
// Global metrics
- totalKineticEnergy
- patternComplexity
- systemEntropy
```

## Audio Processing Chain

### Oscillator Section
Each species maintains its own oscillator bank:
```
Species Oscillators → Mix → Filter → Amp → Effects Send
```

### Filter Architecture
- **Type**: Multi-mode (LP/HP/BP/Notch)
- **Slope**: 12/24 dB/octave
- **Modulation**: Particle-driven cutoff and resonance

### Envelope System
- **ADSR per voice**: Mapped to particle lifecycle
- **Velocity sensitivity**: Particle speed at note-on
- **Aftertouch**: Continuous particle energy

## Performance Optimizations

### Multi-Threading
- **Thread 1**: Particle simulation & visualization
- **Thread 2**: Audio processing
- **Thread 3**: Parameter smoothing & interpolation

### Buffer Management
- **Audio Buffer**: 256 samples @ 48kHz (5.3ms latency)
- **Parameter Buffer**: Ring buffer for smoothing
- **Lookahead**: 10ms for envelope prediction

### CPU Efficiency
- SIMD optimizations for particle calculations
- Wavetable pre-computation
- Granular grain recycling
- Convolution reverb impulse caching

## Integration Points

### MIDI Implementation
- **Note On/Off**: Trigger particle events
- **Velocity**: Initial particle energy
- **Pitch Bend**: Global force modifier
- **Mod Wheel**: Crossfade between species
- **Aftertouch**: Continuous energy injection

### DAW Integration
- **Plugin Format**: VST3/AU/AAX
- **Automation**: All parameters exposed
- **Presets**: Store particle + synth state
- **MIDI Learn**: Right-click assignment

### OSC Control
- **Input**: External parameter control
- **Output**: Particle data for visualization
- **Bidirectional**: Live coding integration

## Technical Specifications

### Audio
- **Sample Rate**: 44.1/48/88.2/96/192 kHz
- **Bit Depth**: 32-bit float internal
- **Latency**: <10ms total system latency

### Visual
- **Frame Rate**: 60 FPS minimum
- **Resolution**: Scalable vector graphics
- **Particles**: 1000-5000 depending on CPU

### System Requirements
- **CPU**: Quad-core 2.5GHz minimum
- **RAM**: 4GB minimum, 8GB recommended
- **GPU**: Hardware acceleration supported
- **OS**: Windows 10+, macOS 10.14+, Linux

## Development Stack

### Core Technologies
- **Audio**: JUCE Framework 7.x
- **Synthesis**: Surge XT synthesis engine
- **Graphics**: OpenGL 3.3+ with shaders
- **Particle System**: Custom C++ implementation

### Build System
- CMake for cross-platform builds
- Continuous integration via GitHub Actions
- Automated testing for audio/visual sync

## Future Expansions

### Phase 2 Features
- Neural network parameter learning
- Spatial audio (Ambisonics)
- MPE (Multidimensional Polyphonic Expression)
- Network collaboration mode

### Research Areas
- Quantum-inspired particle interactions
- Machine learning for preset generation
- Real-time convolution with particle patterns
- Binaural synthesis from spatial data