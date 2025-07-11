# Particle System Core - Sound Engineer's Guide

## Overview
This document explains the core particle system mechanics to help sound engineers understand how to map particle behaviors to synthesis parameters.

## Current Implementation

### Force Relationships
The heart of the system is an **asymmetric force matrix** where each species has unique attraction/repulsion relationships:

```
Forces range from -1.0 (strong repulsion) to +1.0 (strong attraction)
Example Predator-Prey pattern:
         Red   Green  Blue   Yellow Purple
Red      0.3   0.8   -0.7    0.2   -0.3  
Green   -0.8   0.3    0.8   -0.4    0.2
Blue     0.8  -0.8    0.3    0.1   -0.2
Yellow  -0.2   0.4   -0.1    0.5   -0.6
Purple   0.3  -0.2    0.2    0.6    0.4
```

### Physics Parameters
- **Force Factor** (0.1-2.0): Overall strength of interactions
- **Friction** (0.9-0.99): Velocity damping over time
- **Wall Damping** (0.5-1.0): Energy loss on boundary collision
- **Particle Count** (0-1000 per species): Population density
- **Number of Species** (1-5): Active particle types

### Emergent Behaviors

1. **Clustering**: Same-species attraction creates tight groups
   - Sound mapping: Unison voices, chorus density
   
2. **Orbiting**: Balanced attraction/repulsion creates circular motion
   - Sound mapping: LFO rate, phaser speed
   
3. **Swarming**: Multiple species with complex relationships
   - Sound mapping: Filter modulation, harmonic complexity
   
4. **Crystallization**: Particles form stable geometric patterns
   - Sound mapping: Harmonic series, resonance peaks
   
5. **Chaos**: High forces create unpredictable motion
   - Sound mapping: Noise amount, distortion level

### Measurable Metrics

**Per-Species Metrics**:
- Population center position (X, Y)
- Average velocity
- Density/clustering coefficient
- Distance to other species centers

**Global Metrics**:
- Total kinetic energy
- Pattern stability (velocity variance)
- Species separation distances
- Collision frequency

**Interaction Metrics**:
- Border activity between species
- Chase/flee dynamics intensity
- Orbital period detection
- Pattern formation strength

### Visual Feedback
- Trail system shows motion history
- Species colors: Red, Green, Blue, Yellow, Purple
- Real-time force visualization in UI

## Key Concepts for Sound Design

1. **Population-Level Behavior**: Track collective properties, not individual particles
2. **Asymmetric Relationships**: A→B ≠ B→A creates complex dynamics
3. **Phase Transitions**: Small parameter changes can cause dramatic behavioral shifts
4. **Stability vs. Chaos**: Balance between ordered and chaotic states
5. **Multi-Scale Dynamics**: Fast local interactions + slow global patterns

## Implementation Details

The system runs at 60 FPS with these update phases:
1. Force calculation (O(n²) particle interactions)
2. Physics integration (velocity, position updates)
3. Boundary handling (wrap or bounce)
4. Metric extraction (for sound parameter mapping)

All parameters are accessible in real-time for dynamic sound control.