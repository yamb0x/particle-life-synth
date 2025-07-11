# Parameter Mapping Guide for Particle-Life Synth

## Core Concept
Map collective particle behaviors to synthesis parameters, creating a living instrument where emergent patterns shape the sound.

## Species → Synthesis Engine Mapping

### 🔴 Red Species → Analog Synthesis
**Particle Behavior Focus**: Warm clustering, slow movements
- **Oscillator**: Saw/Square waves with analog drift
- **Key Mappings**:
  - Cluster density → Filter cutoff (20Hz-20kHz)
  - Average velocity → Filter resonance (0-100%)
  - Center position → Pan & stereo width
  - Population size → Unison voices (1-7)

### 🟢 Green Species → FM Synthesis
**Particle Behavior Focus**: Crystalline patterns, geometric formations
- **Oscillator**: FM operators with variable ratios
- **Key Mappings**:
  - Pattern stability → Modulation index (0-10)
  - Inter-particle spacing → Carrier/modulator ratio
  - Formation symmetry → Feedback amount
  - Velocity variance → Brightness/harmonics

### 🔵 Blue Species → Wavetable Synthesis
**Particle Behavior Focus**: Flowing, wave-like motion
- **Oscillator**: Morphing wavetables
- **Key Mappings**:
  - Flow direction → Wavetable position (0-100%)
  - Movement smoothness → Interpolation curve
  - Trail length → Filter envelope depth
  - Orbital period → LFO rate sync

### 🟡 Yellow Species → Granular Synthesis
**Particle Behavior Focus**: Cloud formations, density variations
- **Oscillator**: Grain clouds with variable density
- **Key Mappings**:
  - Particle spread → Grain position randomness
  - Local density → Grain density (10-1000 grains/sec)
  - Velocity chaos → Grain size variation
  - Collision rate → Grain pitch randomness

### 🟣 Purple Species → Physical Modeling
**Particle Behavior Focus**: String-like connections, tension systems
- **Oscillator**: Physical model resonators
- **Key Mappings**:
  - Connection strength → String tension/pitch
  - Network density → Damping factor
  - Vibration patterns → Excitation position
  - Energy transfer → Resonance decay

## Global Parameter Mappings

### Amplitude Envelope
- **Attack**: Species formation time (10ms-2s)
- **Decay**: Pattern stability duration (10ms-1s)
- **Sustain**: Average population energy (0-100%)
- **Release**: Dispersion time after note-off (10ms-5s)

### Filter Section
- **Cutoff**: Species boundary sharpness
- **Resonance**: Inter-species tension
- **Envelope**: Border collision intensity
- **Key tracking**: Species vertical distribution

### LFO & Modulation
- **LFO Rate**: Orbital/cyclic behavior periods
- **LFO Depth**: Movement amplitude
- **Mod Matrix**: 32 slots for custom mappings

### Effects Chain
1. **Reverb**: Particle trail length → decay time
2. **Delay**: Echo patterns from collision cascades
3. **Distortion**: Chaos level → drive amount
4. **Chorus**: Swarm coherence → depth/rate

## Measurement Strategies

### Statistical Analysis (every frame)
```javascript
// Example metrics extraction
{
  centerOfMass: { x, y },
  averageVelocity: float,
  velocityVariance: float,
  clusteringCoefficient: float,
  nearestNeighborDistance: float,
  boundingBoxArea: float,
  kineticEnergy: float
}
```

### Behavioral Pattern Detection
- **Flocking**: Alignment of velocity vectors
- **Orbiting**: Circular motion detection via FFT
- **Pulsing**: Periodic expansion/contraction
- **Migration**: Directional group movement

### Inter-Species Dynamics
- **Chase Index**: Pursuit behavior intensity
- **Separation Distance**: Species boundary clarity
- **Mixing Coefficient**: Species overlap amount
- **Interaction Energy**: Force exchange magnitude

## Performance Considerations

### Smoothing & Interpolation
- Apply exponential smoothing (α=0.1-0.3) to prevent audio artifacts
- Use cubic interpolation for continuous parameters
- Implement hysteresis for threshold-based switches

### Update Rates
- **Visual**: 60 FPS
- **Parameter extraction**: 60 Hz
- **Audio parameter update**: 1000 Hz (interpolated)
- **Pattern detection**: 10 Hz

### CPU Optimization
- Cache frequently used calculations
- Use spatial hashing for particle lookups
- Implement LOD for distant particles
- Batch parameter updates

## Preset Design Guidelines

### Ambient Patches
- Low force factors (0.1-0.3)
- High friction (0.95-0.99)
- Emphasize slow-moving metrics

### Lead Sounds
- Medium forces (0.5-1.0)
- Focus on single species
- Map velocity to filter cutoff

### Bass Patches
- Red species dominant
- Map clustering to sub-harmonic content
- Use population size for voice stacking

### Experimental
- High force factors (1.5-2.0)
- Multiple species interaction
- Map chaos metrics to effects

## Implementation Checklist

- [ ] Establish metric extraction pipeline
- [ ] Create smoothing algorithms
- [ ] Define parameter ranges and curves
- [ ] Build modulation matrix
- [ ] Test latency and responsiveness
- [ ] Optimize for real-time performance
- [ ] Create preset templates
- [ ] Document edge cases