# Multi-Particle Synthesizer Architecture
## Technical Documentation for Audio Engineers & Musicians

### Core Concept: Collective Particle Dynamics as Sound Modulation

This is a **MIDI-controlled synthesizer** where multi-particle system dynamics shape and modulate the sound of notes played via MIDI keyboard/controller. The particles DO NOT generate notes or melodies - they control synthesis parameters like filters, oscillator timbre, envelopes, and modulation. The system implements asymmetrical particle interactions inspired by Ventrella's Clusters algorithm, creating complex emergent patterns that shape the character of played notes.

---

## 1. Multi-Particle System Fundamentals

### 1.1 Particle Species & Inter-Species Dynamics

The system models **5 distinct particle species**, each with unique:
- Attraction/repulsion matrices to other species
- Collective clustering behaviors
- Emergent pattern formations

**Key Principle**: Sound characteristics emerge from:
- **Population density distributions** across the field
- **Inter-species boundary dynamics** (where different colors meet)
- **Collective motion vectors** of particle groups
- **Cluster formation and dissolution** events

### 1.2 Emergent Behaviors → Sound Mapping

| **Collective Behavior** | **Audio Parameter** | **Technical Implementation** |
|------------------------|---------------------|----------------------------|
| **Cluster Density** | Unison Voice Count | 1-16 voices per MIDI note |
| **Cluster Centroid Motion** | Filter Cutoff Modulation | 10 Hz - 20 kHz range |
| **Inter-cluster Distance** | Stereo Field Width | Binaural panning algorithm |
| **Species Boundary Turbulence** | Filter Resonance | 0-40 dB boost |
| **Population Oscillations** | LFO Depth | 0-100% modulation |
| **Collision Cascades** | Envelope Retrigger | ADSR restart while note held |
| **Angular Momentum** | Phaser/Flanger Rate | 0.01-20 Hz |
| **Swarm Coherence** | Oscillator Detune/Spread | ±50 cents detuning |

---

## 2. Synthesis Engine Architecture (JUCE DSP + Surge XT)

### 2.1 Oscillator Types Per Species

**Species 1 (Red) - Analog-Modeled Oscillators**
- **JUCE dsp::Oscillator** implementations:
  - Saw (anti-aliased BLEP)
  - Square (variable pulse width 5-95%)
  - Triangle (band-limited)
  - Sub-oscillator (-1/-2 octaves)
- **Surge XT Classic** oscillator for vintage character
- Analog drift modeling (±2 cents)

**Species 2 (Blue) - Wavetable Synthesis**
- **Surge XT Wavetable** oscillator
- 256 wavetable positions
- 2D morphing (X/Y axes)
- Spectral filtering options
- Frame interpolation modes: Linear/Cubic/Sinc

**Species 3 (Green) - FM Synthesis**
- **Surge XT FM2/FM3** oscillators
- 4-operator architecture
- Algorithms: 8 classic + 4 modern
- Feedback routing (0-100%)
- Ratio modes: Harmonic/Fixed/Free

**Species 4 (Yellow) - Granular Engine**
- **Custom granular implementation**:
  - Grain size: 1-500ms
  - Grain density: 1-100 grains/sec
  - Pitch dispersion: ±2400 cents
  - Position randomization
  - Windowing: Hann/Blackman/Tukey

**Species 5 (Purple) - Physical Modeling**
- **JUCE dsp::StringModel**
- **Surge XT String** oscillator
- Karplus-Strong synthesis
- Damping factor: 0-1
- Excitation types: Pluck/Bow/Breath
- Sympathetic resonance modeling

### 2.2 Filter Architecture

**Per-Voice Filters** (each particle cluster):
- **JUCE dsp::StateVariableTPTFilter**:
  - Lowpass/Highpass/Bandpass/Notch
  - 12/24 dB/octave slopes
  - Cutoff: 10 Hz - 20 kHz
  - Resonance: 0-40 dB

**Global Filters** (master bus):
- **Surge XT Filter Collection**:
  - Analog-modeled: OB-Xa, Moog Ladder, SEM
  - Digital: Comb, K35, Diode Ladder
  - Formant: 5-formant vowel filter
  - Special: Ring modulator, Waveshaper

### 2.3 Modulation Architecture

**LFO Bank** (8 per voice):
- Shapes: Sine, Triangle, Square, S&H, Random
- Rate: 0.01 Hz - 50 Hz (tempo-syncable)
- Phase offset per particle cluster
- Smoothing: 0-100ms

**Envelope Generators**:
- ADSR (×4 per voice)
- Multi-segment (8-stage)
- Attack: 0.1ms - 10s
- Decay/Release: 1ms - 30s
- Curves: Linear/Exponential/Logarithmic

**Modulation Matrix**:
- 32 slots
- Sources: LFOs, Envelopes, Particle metrics
- Destinations: All synthesis parameters
- Depth: -100% to +100%
- Curve shaping

---

## 3. Particle Metrics → Parameter Mapping

### 3.1 Real-time Analysis Metrics

**Per-Species Metrics**:
- Population count
- Spatial distribution variance
- Average velocity magnitude
- Rotational momentum
- Cluster count & sizes

**Inter-Species Metrics**:
- Boundary line lengths
- Mixing entropy
- Collision frequency
- Attraction/repulsion balance

**Global System Metrics**:
- Total energy
- Pattern stability index
- Chaos measurement
- Symmetry detection

### 3.2 Parameter Smoothing & Scaling

All particle-derived parameters use:
- **Exponential smoothing**: τ = 5-100ms
- **Perceptual scaling**: Logarithmic for frequency, linear for amplitude
- **Adaptive slew limiting**: Prevents clicks/zippering
- **Hysteresis**: Reduces jitter in threshold-based parameters

---

## 4. Effects Processing Chain

**Insert Effects** (per species):
1. **Distortion/Saturation**:
   - Types: Tape, Tube, Transistor, Bit reduction
   - Drive: 0-40 dB
   - Mix: 0-100%

2. **Chorus/Ensemble**:
   - Voices: 2-8
   - Rate: 0.1-10 Hz
   - Depth: 0-50ms
   - Spread: 0-100%

**Send Effects** (global):
1. **Reverb** (JUCE dsp::Reverb or Surge XT):
   - Algorithms: Hall, Room, Plate, Spring
   - Size: 0.1-100m
   - Decay: 0.1-60s
   - Damping: 0-100%

2. **Delay**:
   - Types: Digital, Tape, Analog-modeled
   - Time: 1ms-5s (tempo-sync)
   - Feedback: 0-110%
   - Modulation: 0-100%

3. **Spatial Processor**:
   - Binaural panning
   - Doppler shift modeling
   - Distance attenuation
   - Early reflections

---

## 5. Preset System & Ecosystem Behaviors

### 5.1 Ecosystem Presets (Particle Behavior Sets)

Each ecosystem defines:
- **Attraction/repulsion matrices** (5×5 values)
- **Particle count** per species (0-200)
- **Initial distribution** patterns
- **Physics parameters**: Friction, max velocity, collision elasticity
- **Synthesis mappings**: Which behaviors control which parameters

### 5.2 Sound Preset Architecture

**Preset contains**:
- Ecosystem behavior selection
- Per-species synthesis settings
- Modulation routings
- Effects settings
- Macro control assignments
- Visual rendering options

---

## 6. Performance Specifications

### Audio Performance
- Sample rate: 44.1/48/88.2/96/192 kHz
- Buffer sizes: 64-2048 samples
- Latency: <10ms at 256 samples
- CPU usage: ~30% (modern 8-core CPU)
- Polyphony: 128 voices maximum

### Visual Performance
- Frame rate: 60 FPS target
- Particle count: Up to 1000
- GPU acceleration via OpenGL 3.3+
- Resolution: Up to 4K

---

## 7. MIDI/OSC Control

### MIDI Implementation
- **Note On/Off**: Plays synthesizer voices (particles control timbre, NOT pitch)
- **Velocity**: Controls initial amplitude and filter brightness
- **CC mapping**: Any CC to any synthesis parameter
- **MPE support**: Per-note expression for polyphonic modulation
- **Program Change**: Preset/ecosystem selection
- **Pitch Bend**: Standard ±2 semitone bend (configurable)

### OSC Protocol
- Namespace: `/particle-synth/*`
- Bi-directional communication
- High-resolution parameter control
- Visual state queries

---

## 8. Technical Requirements

### Host Compatibility
- VST3/AU/AAX formats
- 64-bit only
- Windows 10+, macOS 10.13+, Linux (Ubuntu 20.04+)

### Hardware Requirements
- CPU: Intel i5/AMD Ryzen 5 or better
- RAM: 8GB minimum
- GPU: OpenGL 3.3 compatible
- Display: 1920×1080 minimum

---

*This document serves as the technical foundation for the Multi-Particle Synthesizer, emphasizing the collective behavior of particle populations as the primary sound generation mechanism.*