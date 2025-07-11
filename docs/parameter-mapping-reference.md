# Parameter Mapping Reference
## Multi-Particle Synthesizer - Technical Guide for Musicians & Sound Engineers

### Introduction

This document provides a comprehensive mapping between particle system behaviors and audio synthesis parameters. All mappings are based on **collective particle dynamics**, not individual particle states. The system analyzes population-level metrics in real-time to generate control signals.

---

## 1. Primary Mappings: Collective Behaviors → Core Synthesis

### 1.1 Oscillator Control (MIDI Notes from Keyboard)

**IMPORTANT**: Pitch is determined by MIDI input from keyboard/controller. Particles control timbre and modulation.

**Source: Cluster Dynamics**
- **Cluster density** → Oscillator unison voices (1-16 voices)
- **Cluster movement** → Detune amount (0-50 cents)
- **Cluster shape** → Oscillator shape morphing/PWM
- **Population distribution** → Oscillator mix levels

**Modulation Sources**:
- Cluster oscillation → Vibrato depth (0-100%)
- Inter-cluster distance → Detune spread (0-50 cents)
- Boundary turbulence → FM amount (0-100%)

### 1.2 Timbre Control (Filter Parameters)

**Source: Species Boundary Dynamics**
- **Primary Mapping**: Boundary turbulence → Filter cutoff
  - Range: 10 Hz - 20 kHz (exponential scaling)
  - Response time: 1-100ms
- **Secondary Mapping**: Mixing entropy → Filter resonance
  - Range: 0-40 dB boost
  - Safety limiter at 35 dB to prevent self-oscillation

**Advanced Mappings**:
- Species segregation index → Filter type morphing
- Boundary curvature → Filter slope (12/24 dB/oct)
- Collision density at boundaries → Filter drive (0-20 dB)

### 1.3 Amplitude & Dynamics

**Source: Collective Velocity Metrics**
- **RMS Velocity** → Overall amplitude (0-100%)
- **Velocity Variance** → Dynamic range compression
  - Low variance = compressed (1.5:1 - 4:1)
  - High variance = expanded (1:0.8 - 1:0.5)
- **Acceleration Events** → Transient emphasis
  - Attack time modulation: 0.1ms - 100ms
  - Transient shaper amount: 0-100%

### 1.4 Spatial Positioning

**Source: Spatial Distribution Patterns**
- **X-axis distribution** → Stereo panning
  - Hard left (-100) to hard right (+100)
  - Width control based on variance
- **Y-axis distribution** → Vertical space (if supported)
  - Height simulation via EQ and reverb
- **Cluster separation** → Stereo width
  - Mono (0%) to ultra-wide (200%)
- **Rotational patterns** → Auto-pan effects
  - Rate: 0.01-10 Hz
  - Depth: 0-100%

---

## 2. Synthesis Engine Mappings by Species

### Species 1 (Red) - Analog Synthesis Mappings

**Oscillator Controls**:
- Cluster density → Unison voices (1-16)
- Internal cluster motion → Detune spread (0-50 cents)
- Cluster shape → Pulse width (5-95%)
- Distance from center → Sub-oscillator mix (0-100%)

**Unique Mappings**:
- Particle age distribution → Analog drift amount
- Cluster stability → Oscillator sync amount

### Species 2 (Blue) - Wavetable Synthesis Mappings

**Wavetable Controls**:
- Cluster X-position → Wavetable position (0-255)
- Cluster Y-position → Spectral filter position
- Rotational velocity → Wavetable scanning speed
- Particle density gradient → Formant shift (-100% to +100%)

**Morphing Parameters**:
- Inter-cluster angles → X/Y morph position
- Cluster merging events → Wavetable crossfade

### Species 3 (Green) - FM Synthesis Mappings

**FM Controls**:
- Collision frequency → Modulation index (0-100)
- Collision intensity → Operator feedback (0-100%)
- Cluster formation speed → Operator ratios
  - Slow = harmonic ratios (1:1, 2:1, 3:1)
  - Fast = inharmonic ratios (1.41:1, 2.71:1)
- Species mixing → Algorithm selection

### Species 4 (Yellow) - Granular Synthesis Mappings

**Granular Controls**:
- Particle count → Grain density (1-100 grains/sec)
- Velocity variance → Grain size variance (1-500ms)
- Spatial spread → Position randomization (0-100%)
- Cluster fragmentation → Pitch dispersion (0-2400 cents)

**Texture Controls**:
- Turbulence index → Grain envelope randomization
- Pattern periodicity → Grain triggering mode

### Species 5 (Purple) - Physical Modeling Mappings

**Physical Model Controls**:
- Collision impact force → Excitation strength
- Settling time → Damping factor (0-1)
- Cluster resonance → String tension
- Boundary reflections → Sympathetic resonance

---

## 3. Modulation Matrix Mappings

### LFO Assignments (Auto-mapped)

| **Particle Metric** | **LFO Parameter** | **Musical Result** |
|-------------------|------------------|------------------|
| Cluster breathing rate | LFO 1 Rate | Natural pulsing |
| Orbital period | LFO 2 Rate | Cyclical modulation |
| Population oscillation | LFO 3 Rate | Organic rhythm |
| Chaos index | LFO 4 Rate | Random modulation |

### Envelope Triggering

**Collision-based Triggers**:
- Single collision → Note trigger
- Collision cascade → Rapid retrigger
- Cluster formation → Slow attack envelope
- Cluster dissolution → Release trigger

**Density-based Triggers**:
- Density threshold crossed → Gate trigger
- Density rate of change → Envelope speed

---

## 4. Effects Parameter Mappings

### Reverb Controls

**Space Modeling**:
- Average particle distance → Room size (0.1-100m)
- Particle echo patterns → Early reflections
- Boundary absorption → Damping (0-100%)
- Vertical distribution → Ceiling height

### Delay Controls

**Temporal Mappings**:
- Cluster rotation period → Delay time (tempo-synced)
- Orbital eccentricity → Feedback amount (0-110%)
- Phase relationships → Ping-pong amount

### Distortion/Saturation

**Density Mappings**:
- Local density peaks → Drive amount (0-40 dB)
- Density variance → Saturation type morphing
- Collision intensity → Transient clipping

---

## 5. Macro Control Assignments

### Default Macro Mappings

**Macro 1: "Complexity"**
- Particle count (all species)
- Modulation depths
- Effect amounts

**Macro 2: "Brightness"**
- Filter cutoff offset
- Wavetable position
- Reverb damping (inverse)

**Macro 3: "Movement"**
- Physics friction (inverse)
- LFO rates
- Delay feedback

**Macro 4: "Density"**
- Unison voices
- Grain density
- Reverb size

**Macro 5: "Chaos"**
- Attraction/repulsion strength
- Random modulation amounts
- Distortion drive

**Macro 6: "Space"**
- Stereo width
- Reverb mix
- Delay mix

**Macro 7: "Dynamics"**
- Envelope times
- Compressor threshold
- Velocity sensitivity

**Macro 8: "Character"**
- Species balance
- Filter resonance
- Saturation mix

---

## 6. Advanced Mapping Techniques

### 6.1 Statistical Mappings

**Population Statistics**:
- Standard deviation → Parameter spread
- Kurtosis → Parameter curve shaping
- Skewness → Parameter bias
- Entropy → Randomization amount

### 6.2 Pattern Recognition Mappings

**Emergent Patterns**:
- Spiral formations → Phaser/flanger rates
- Grid formations → Rhythmic quantization
- Wave patterns → Tremolo depth
- Symmetric patterns → Stereo correlation

### 6.3 Predictive Mappings

**Future State Prediction**:
- Collision prediction → Envelope shape morphing
- Pattern stability → Parameter lock/unlock
- Energy conservation → Limiting threshold

---

## 7. Performance Optimization

### Parameter Update Rates

| **Parameter Type** | **Update Rate** | **Smoothing** |
|------------------|----------------|---------------|
| Oscillator params | 1000 Hz | 5ms |
| Filter Cutoff | 500 Hz | 10ms |
| Amplitude | 2000 Hz | 2ms |
| Effects | 100 Hz | 50ms |
| Spatial | 200 Hz | 25ms |

### CPU Load Management

- **LOD System**: Reduce particle count for CPU saving
- **Parameter Freezing**: Lock stable parameters
- **Smart Oversampling**: Only where needed (filters, distortion)

---

## 8. MIDI Learn & Automation

### Recommended MIDI CC Mappings

| **CC#** | **Parameter** | **Typical Use** |
|--------|--------------|----------------|
| 1 | Macro 1 (Complexity) | Mod wheel |
| 2 | Macro 2 (Brightness) | Breath control |
| 7 | Master volume | Channel volume |
| 10 | Spatial balance | Pan |
| 71 | Filter resonance | Sound variation |
| 74 | Filter cutoff | Brightness |
| 91 | Reverb send | Effects depth |
| 93 | Delay send | Effects depth |

### DAW Automation Tips

1. **Smooth automation curves** for particle physics parameters
2. **Stepped automation** for preset/ecosystem changes
3. **Parameter locks** during critical sections
4. **Automation lanes** for visual feedback sync

---

## 9. Preset Design Guidelines

### Creating Musical Presets

1. **Start with ecosystem behavior**
   - Choose particle dynamics that match intended rhythm
   - Adjust species balance for timbral variety

2. **Map critical parameters**
   - Ensure pitch range is musical
   - Set filter ranges to avoid harsh resonances
   - Balance modulation depths

3. **Fine-tune dynamics**
   - Adjust envelope responses
   - Set compression for consistent output
   - Configure velocity sensitivity

4. **Add character with effects**
   - Use reverb to place in space
   - Add delays for rhythmic interest
   - Apply subtle saturation for warmth

### Preset Categories

**Ambient/Pad Presets**:
- Slow particle movement
- High reverb mix
- Long envelope times
- Wide stereo field

**Lead/Solo Presets**:
- Fast, focused particles
- Minimal reverb
- Quick envelopes
- Center-focused spatial

**Bass Presets**:
- Heavy, low particles
- Minimal high frequencies
- Tight envelopes
- Mono or narrow stereo

**Rhythmic Presets**:
- Collision-based triggering
- Synced delays
- Quantized parameters
- Clear transients

---

*This reference guide provides the technical foundation for understanding how multi-particle behaviors translate into musical parameters. Use these mappings as starting points and experiment with combinations to discover new sonic possibilities.*