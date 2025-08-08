# Granular Synthesizer Implementation Plan - v2.0

## Executive Summary

This document outlines the complete implementation plan for integrating a sophisticated granular synthesis engine into the Particle Life Synth application. The system implements a **1:1 particle-to-grain mapping** where each visual particle represents one audio grain, with circular sampling area control to manage density and prevent audio chaos at high particle counts.

### Core Concept: 1:1 Particle-Grain Mapping
Each particle IS a grain. When 20 particles of Species A exist and a sample is loaded, that sample gets chopped into 20 grains following the particles' positions. This creates a direct, intuitive relationship between visual and audio elements.

### Key Design Requirements
- **1:1 Particle-to-Grain Mapping**: Each particle = one grain position in the sample
- **Circular Sampling Area**: Control which particles generate audio to prevent chaos
- **Handle 5,000-10,000 particles** at potentially 5-15 FPS
- **Adjustable sampling capacity** from 50-1000 particles within circle
- **Smart Grain Organization**: Multiple modes for grain behavior
- **Automatic Sample Loading**: Random samples from "stems" folder
- **Firebase Integration**: Save all audio settings with presets
- **Trail Length → Grain Length**: Visual trails control audio grain duration

## Core Architecture Overview

### System Components

1. **Circular Sampling System**
   - 2D crosshair overlay with controllable center point
   - Adjustable circular sampling radius
   - Only particles within circle trigger audio grains
   - Visual feedback with difference blend mode

2. **Dual-Panel UI Architecture**
   - **Left Panel**: Audio controls (mirrors right panel style)
   - **Right Panel**: Existing particle controls (unchanged)
   - Both panels use CollapsibleSection components

3. **Granular Synthesis Engine**
   - Per-species audio sample assignment
   - Real-time grain generation from particle positions
   - WebAudio API implementation
   - **Decoupled from particle rendering for 5-10K particle support**

### Critical Performance Architecture

**Problem**: System must handle 5,000-10,000 particles at potentially low FPS (5-15 FPS) while maintaining smooth audio playback.

**Solution**: Complete decoupling of audio from visual systems with intelligent data sampling and interpolation.

```javascript
DecoupledArchitecture {
  ParticleSystem: {
    fps: 5-60,  // Variable, can drop very low
    particles: 5000-10000,
    updateRate: "variable"
  },
  
  AudioSystem: {
    updateRate: 60Hz,  // Fixed audio control rate
    grainRate: 44100Hz,  // Audio sample rate
    latency: <10ms,
    independent: true  // Runs regardless of particle FPS
  }
}

## Critical Design: 1:1 Particle-Grain Mapping System

### The Core Mapping Logic
```javascript
ParticleGrainMapping {
  // Each particle directly maps to a grain
  mapParticleToGrain(particle, species) {
    const sample = species.audioBuffer;
    const sampleDuration = sample.duration;
    
    // X-axis: Position in sample (0-1 normalized)
    const grainPosition = particle.x / canvasWidth;
    const grainStartTime = grainPosition * sampleDuration;
    
    // Y-axis: Frequency/pitch modulation
    const normalizedY = particle.y / canvasHeight;
    const frequencyBand = species.particleSize * 0.1; // Size affects frequency range
    const pitchShift = (normalizedY - 0.5) * frequencyBand * 24; // ±12 semitones * band
    
    // X-axis also controls panning
    const panPosition = (particle.x / canvasWidth) * 2 - 1; // -1 to 1
    
    // Velocity controls volume
    const velocity = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
    const grainVolume = Math.min(1, velocity / MAX_VELOCITY);
    
    // Trail length controls grain duration
    const trailLength = species.trailLength || 0.95;
    const grainDuration = mapTrailToGrainLength(trailLength); // 10-500ms
    
    return {
      startTime: grainStartTime,
      duration: grainDuration,
      pitchShift: pitchShift,
      pan: panPosition,
      volume: grainVolume
    };
  }
}
```

### Circular Sampling Area - Density Control
The circular sampling area solves the chaos problem when thousands of particles create thousands of grains:

```javascript
// Layer 1: Particle System (5-60 FPS, variable)
ParticleSystem {
  update() {
    // Heavy computation: O(n²) force calculations
    // Can take 100-200ms with 10K particles
    this.calculateForces();
    this.updatePositions();
    
    // Push snapshot to audio bridge (non-blocking)
    audioBridge.pushSnapshot(this.particles);
  }
}

// Layer 2: Audio Control Loop (60 Hz, fixed)
AudioControlLoop {
  constructor() {
    setInterval(() => {
      // Get interpolated particle data
      const data = audioBridge.getSmoothedData();
      
      // Update grain parameters
      grainScheduler.update(data);
    }, 16.67); // Exactly 60 Hz
  }
}

// Layer 3: Audio Rendering (44.1 kHz, real-time)
AudioRenderer {
  // Runs in audio thread, never blocked
  processAudio(outputBuffer) {
    // Generate grains based on scheduled parameters
    grainPool.render(outputBuffer);
  }
}
```

### Grain Organization Algorithms

```javascript
class GrainOrganizer {
  constructor() {
    this.mode = 'Direct (1:1)';
    this.particlesInCircle = [];
  }
  
  organizeGrains(particles, mode) {
    switch(mode) {
      case 'Direct (1:1)':
        // Original HTML behavior - each particle is a grain
        return particles.map(p => this.mapParticleToGrain(p));
      
      case 'Clustered Amplitude':
        // Particles close together create louder grains
        return this.clusterAmplitudeMode(particles);
      
      case 'Density Modulation':
        // Dense areas trigger grains faster
        return this.densityModulationMode(particles);
      
      case 'Swarm Intelligence':
        // Collective movement creates patterns
        return this.swarmIntelligenceMode(particles);
      
      case 'Harmonic Layers':
        // Y-position creates harmonic series
        return this.harmonicLayersMode(particles);
      
      case 'Rhythmic Patterns':
        // Velocity creates rhythmic triggering
        return this.rhythmicPatternsMode(particles);
      
      case 'Spatial Zones':
        // Different behaviors in circle zones
        return this.spatialZonesMode(particles);
      
      case 'Chaos Modulation':
        // System chaos affects grain behavior
        return this.chaosModulationMode(particles);
    }
  }
  
  clusterAmplitudeMode(particles) {
    const clusters = this.findClusters(particles, this.clusterThreshold);
    return clusters.map(cluster => {
      const centerParticle = this.getClusterCenter(cluster);
      const grain = this.mapParticleToGrain(centerParticle);
      grain.volume *= Math.sqrt(cluster.length); // Louder with more particles
      grain.voices = cluster.length; // Multiple voices for thickness
      return grain;
    });
  }
  
  densityModulationMode(particles) {
    const densityGrid = this.calculateDensityGrid(particles);
    return particles.map(p => {
      const grain = this.mapParticleToGrain(p);
      const density = densityGrid.getDensityAt(p.x, p.y);
      grain.triggerRate = density * 10; // Denser = faster triggering
      grain.overlap = Math.min(0.9, density * 0.5); // More overlap in dense areas
      return grain;
    });
  }
  
  harmonicLayersMode(particles) {
    // Group particles by Y position into harmonic bands
    const bands = this.groupByYPosition(particles, 8); // 8 harmonic bands
    const harmonicRatios = [1, 2, 3, 4, 5, 6, 7, 8];
    
    return bands.flatMap((band, i) => {
      return band.particles.map(p => {
        const grain = this.mapParticleToGrain(p);
        grain.pitchMultiplier = harmonicRatios[i];
        grain.volume *= 1 / harmonicRatios[i]; // Quieter for higher harmonics
        return grain;
      });
    });
  }
}
```

### Firebase Integration for Audio Settings

```javascript
class AudioSettingsFirebase {
  constructor(hybridPresetManager) {
    this.presetManager = hybridPresetManager;
  }
  
  // Extend existing preset structure with audio data
  extendPresetWithAudio(preset) {
    return {
      ...preset,
      audio: {
        // Sample assignments
        samples: Array.from(this.sampleManager.loadedSamples.entries()).map(([species, data]) => ({
          species: species,
          sampleName: data.name,
          samplePath: data.path,
          // Don't save actual buffer, just reference
        })),
        
        // Sampling control settings
        samplingControl: {
          centerX: this.samplingArea.centerX,
          centerY: this.samplingArea.centerY,
          radius: this.samplingArea.radius,
          maxParticles: this.maxParticleSample,
          organizationMode: this.grainOrganization.mode,
          organizationParams: this.grainOrganization.params
        },
        
        // Master audio settings
        masterAudio: {
          gain: this.masterGain,
          compressor: this.compressorSettings,
          limiter: this.limiterSettings,
          globalGrainDensity: this.globalGrainDensity,
          globalGrainSize: this.globalGrainSize
        },
        
        // Per-species audio settings
        speciesAudio: this.species.map(s => ({
          grainSize: s.grainSize,
          grainDensity: s.grainDensity,
          grainOverlap: s.grainOverlap,
          pitchShift: s.pitchShift,
          detune: s.detune,
          fadeLength: s.fadeLength,
          loopMode: s.loopMode,
          sampleStart: s.sampleStart,
          sampleEnd: s.sampleEnd,
          volume: s.volume,
          mute: s.mute,
          solo: s.solo,
          velocityMapping: s.velocityMapping,
          spatialMapping: s.spatialMapping,
          filter: s.filterSettings
        })),
        
        // Modulation matrix
        modulationMatrix: this.modulationMatrix.getAllMappings(),
        
        // Performance settings
        performanceSettings: {
          qualityPreset: this.qualityPreset,
          adaptiveSampling: this.adaptiveSampling,
          targetCPU: this.targetCPU,
          maxTotalGrains: this.maxTotalGrains
        }
      }
    };
  }
  
  // Load audio settings from preset
  loadAudioFromPreset(preset) {
    if (!preset.audio) {
      // Initialize with defaults if no audio data
      this.initializeDefaultAudio();
      return;
    }
    
    const audio = preset.audio;
    
    // Load samples (async)
    this.loadSamplesFromPreset(audio.samples);
    
    // Apply sampling control
    this.applySamplingControl(audio.samplingControl);
    
    // Apply master audio
    this.applyMasterAudio(audio.masterAudio);
    
    // Apply per-species settings
    this.applySpeciesAudio(audio.speciesAudio);
    
    // Apply modulation matrix
    this.applyModulationMatrix(audio.modulationMatrix);
    
    // Apply performance settings
    this.applyPerformanceSettings(audio.performanceSettings);
  }
}

## Technical Implementation Details

## Sample Management System

### Automatic Sample Loading from "stems" Folder
```javascript
class SampleManager {
  constructor() {
    this.stemsPath = '/stems/';  // Project root folder
    this.sampleCache = new Map();
    this.availableSamples = [];
    this.loadedSamples = new Map(); // species -> sample mapping
  }
  
  async initialize() {
    // Scan stems folder on startup
    this.availableSamples = await this.scanStemsFolder();
    
    // Pre-load random samples for each species
    await this.loadRandomSamplesForAllSpecies();
  }
  
  async scanStemsFolder() {
    try {
      const response = await fetch('/stems/manifest.json');
      // manifest.json auto-generated during build listing all audio files
      const manifest = await response.json();
      return manifest.files.filter(f => 
        f.endsWith('.wav') || 
        f.endsWith('.mp3') || 
        f.endsWith('.ogg') ||
        f.endsWith('.flac')
      );
    } catch (e) {
      // Fallback: Try to load from predefined list
      return this.getDefaultSampleList();
    }
  }
  
  async loadRandomSampleForSpecies(speciesIndex) {
    if (this.availableSamples.length === 0) return null;
    
    // Pick random sample from available
    const randomIndex = Math.floor(Math.random() * this.availableSamples.length);
    const samplePath = this.stemsPath + this.availableSamples[randomIndex];
    
    // Load and cache
    const audioBuffer = await this.loadSample(samplePath);
    this.loadedSamples.set(speciesIndex, {
      path: samplePath,
      buffer: audioBuffer,
      name: this.availableSamples[randomIndex]
    });
    
    return audioBuffer;
  }
  
  // UI Controls
  uiControls: {
    randomSampleButton: {
      label: 'Random Sample',
      action: 'loadRandomSampleForSpecies',
      perSpecies: true
    },
    
    loadSampleButton: {
      label: 'Load Sample',
      action: 'openFileDialog',
      perSpecies: true
    },
    
    currentSampleDisplay: {
      showName: true,
      showWaveform: true,
      showDuration: true
    },
    
    batchOperations: {
      randomizeAll: {
        label: 'Randomize All Species',
        action: 'loadRandomSamplesForAllSpecies'
      },
      
      clearAll: {
        label: 'Clear All Samples',
        action: 'clearAllSamples'
      }
    }
  }
}
```

### Build Process Integration
```javascript
// build-scripts/generate-stems-manifest.js
const fs = require('fs');
const path = require('path');

function generateStemsManifest() {
  const stemsDir = path.join(__dirname, '../stems');
  const files = fs.readdirSync(stemsDir)
    .filter(f => ['.wav', '.mp3', '.ogg', '.flac'].some(ext => f.endsWith(ext)));
  
  const manifest = {
    generated: new Date().toISOString(),
    count: files.length,
    files: files
  };
  
  fs.writeFileSync(
    path.join(stemsDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}
```

### Phase 1: Audio Foundation (Week 1)

#### 1.1 WebAudio Context Setup
```javascript
// Core audio architecture
AudioEngine {
  - AudioContext initialization
  - Master gain node
  - Compressor/limiter chain
  - Sample rate: 44100Hz
  - Latency mode: 'interactive'
}
```

**Files to Create:**
- `src/audio/AudioEngine.js`
- `src/audio/GranularSynth.js`
- `src/audio/AudioBuffer.js`

**Risk Mitigation:**
- Implement fallback for unsupported browsers
- Add AudioContext resume on user interaction
- Handle sample rate mismatches

#### 1.2 Granular Synthesis Core
Based on HTML implementation, adapt:
- Grain size: 10-200ms
- Grain overlap: 0.1-0.9
- Playback rate: 0.25-4.0x
- Pitch shift: ±24 semitones
- Detune: ±50 cents

**Key Differences from HTML:**
- Remove global particle sampling
- Implement circular area detection
- Add position-based grain triggering

### Phase 2: High-Performance Sampling System (Week 1-2)

#### 2.1 Intelligent Particle Sampling
```javascript
class IntelligentSampler {
  constructor() {
    this.sampleRate = 60; // Hz - independent of particle FPS
    this.spatialGrid = new SpatialHashGrid(100); // 100x100 grid
    this.interpolationBuffer = new RingBuffer(4); // Store last 4 frames
    this.statisticalCache = new Map(); // Cache expensive calculations
  }
  
  // Called at particle FPS (5-60 Hz)
  updateFromParticleSystem(particles) {
    // Only process what's needed
    this.spatialGrid.update(particles);
    this.interpolationBuffer.push({
      timestamp: performance.now(),
      grid: this.spatialGrid.snapshot()
    });
  }
  
  // Called at audio control rate (60 Hz)
  getParticlesInCircle(centerX, centerY, radius) {
    if (this.interpolationBuffer.isEmpty()) return [];
    
    // Use spatial hashing for O(1) lookup instead of O(n)
    const cells = this.spatialGrid.getCircleCells(centerX, centerY, radius);
    
    // Interpolate between frames if particle system is slow
    if (this.needsInterpolation()) {
      return this.interpolateParticles(cells);
    }
    
    return this.spatialGrid.getParticlesInCells(cells);
  }
}
```

**Optimization Strategies:**
- **Spatial Hashing**: O(1) particle lookup vs O(n) iteration
- **Frame Interpolation**: Smooth audio when particles run at 5 FPS
- **Statistical Sampling**: For 10K particles, sample 100-200 representatives
- **Cached Calculations**: Reuse expensive distance calculations

#### 2.2 Decoupled Circular Sampling Area
```javascript
class DecoupledSamplingArea {
  centerX: 0.5,  // Normalized 0-1
  centerY: 0.5,  // Normalized 0-1
  radius: 0.2,   // Normalized 0-1
  
  // Adaptive sampling based on particle count
  adaptiveSampleSize(totalParticles) {
    if (totalParticles < 1000) return totalParticles;
    if (totalParticles < 5000) return Math.min(500, totalParticles * 0.2);
    return 200; // Hard cap for 5K-10K particles
  }
  
  // Statistical representation for audio
  getAudioRepresentation(particles) {
    const sample = this.adaptiveSample(particles);
    return {
      density: this.calculateDensity(sample),
      centroid: this.calculateCentroid(sample),
      velocity: this.calculateAverageVelocity(sample),
      speciesDistribution: this.getSpeciesDistribution(sample)
    };
  }
}
```

**Visual Overlay Implementation:**
- Canvas layer with `mix-blend-mode: difference`
- 2px dark lines for crosshair
- Circle outline with adjustable radius
- **Update rate independent of particle FPS**
- **Smooth animation via requestAnimationFrame**

#### 2.3 XY Control Graph with Smoothing
```javascript
XYControlGraph extends XYGraph {
  - Inherits from existing XYGraph component
  - Maps to sampling center position
  - **Input smoothing with 100ms interpolation**
  - **Decoupled from particle system updates**
  - Visual feedback runs at display refresh rate
}

### Phase 3: Left Panel UI (Week 2)

#### 3.1 Panel Structure & Organization
```javascript
LeftPanel {
  // Mirrors right panel CollapsibleSection architecture
  structure: {
    width: '350px',
    position: 'sticky',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  
  // Hierarchical Section Organization
  sections: [
    {
      id: 'sampling-control',
      title: '🎯 Sampling Area',
      icon: '🎯',
      defaultOpen: true,
      content: [
        'XY Control Graph',
        'Sampling Radius Slider',
        'Max Particles Sampled Slider',
        'Visual Overlay Controls'
      ]
    },
    
    {
      id: 'master-audio',
      title: '🎚️ Master Audio',
      icon: '🎚️',
      defaultOpen: true,
      content: [
        'Master Volume',
        'Global Grain Controls',
        'Compressor Settings',
        'Output Limiter',
        'Level Meters'
      ]
    },
    
    {
      id: 'performance-controls',
      title: '⚡ Performance',
      icon: '⚡',
      defaultOpen: false,
      content: [
        'Quality Preset Selector',
        'Max Particles Sampled',
        'CPU Target',
        'Grain Pool Settings',
        'Adaptive Sampling Options'
      ]
    },
    
    {
      id: 'modulation-matrix',
      title: '🔄 Modulation',
      icon: '🔄',
      defaultOpen: false,
      content: [
        'Mapping Slots (8x)',
        'Preset Mappings',
        'Curve Editor',
        'Smoothing Controls'
      ]
    },
    
    // Dynamic Species Sections (auto-generated)
    {
      id: 'species-audio-{index}',
      title: '🎵 Species {letter}',
      icon: '🎵',
      defaultOpen: false,
      dynamic: true,
      colorCoded: true,  // Use species color
      content: [
        'Sample Loader',
        'Waveform Display',
        'Loop Mode Buttons',
        'Grain Parameters',
        'Pitch & Detune',
        'Modulation Settings',
        'Output Controls',
        'Filter (optional)',
        'Level Meter'
      ]
    }
  ],
  
  // Responsive Behavior
  responsive: {
    tablet: {
      width: '280px',
      collapseByDefault: ['performance-controls', 'modulation-matrix']
    },
    mobile: {
      width: '100%',
      position: 'bottom',
      maxHeight: '40vh',
      startCollapsed: true
    }
  }
}
```

#### 3.2 Sampling Control Section
```javascript
SamplingControlUI {
  // XY Graph for sampling position
  xyGraph: {
    size: '200x200px',
    centerX: 0.5,  // Normalized position
    centerY: 0.5,
    smoothing: 100ms  // Input smoothing
  },
  
  // Critical Performance Controls
  samplingRadius: {
    label: 'Sampling Radius',
    range: [0.05, 0.5],  // 5-50% of canvas
    default: 0.2,
    unit: '%',
    description: 'Size of circular sampling area'
  },
  
  maxParticleSample: {
    label: 'Max Particles Sampled',
    range: [50, 1000],  // Allow pushing beyond 200
    default: 200,
    adaptive: true,  // Auto-reduce if performance drops
    description: 'Maximum particles to process for audio (affects CPU)'
  },
  
  // Grain Organization Modes (NEW)
  grainOrganization: {
    label: 'Grain Organization',
    type: 'select',
    options: [
      'Direct (1:1)',           // Original HTML behavior
      'Clustered Amplitude',    // Grouped particles = louder
      'Density Modulation',     // Dense areas = faster grains
      'Swarm Intelligence',     // Collective movement patterns
      'Harmonic Layers',        // Particles at similar Y = harmonics
      'Rhythmic Patterns',      // Velocity-based rhythmic triggering
      'Spatial Zones',          // Different behaviors in circle zones
      'Chaos Modulation'        // System chaos affects grain behavior
    ],
    default: 'Direct (1:1)',
    description: 'How particles within the circle generate grains'
  },
  
  // Organization-specific parameters
  organizationParams: {
    clusterThreshold: {
      label: 'Cluster Distance',
      range: [10, 100],
      default: 30,
      unit: 'px',
      visibleWhen: 'Clustered Amplitude'
    },
    
    harmonicRatios: {
      label: 'Harmonic Series',
      type: 'multi-select',
      options: [1, 2, 3, 4, 5, 6, 7, 8],
      default: [1, 2, 4],
      visibleWhen: 'Harmonic Layers'
    },
    
    rhythmicGrid: {
      label: 'Rhythm Grid',
      type: 'select',
      options: ['1/4', '1/8', '1/16', '1/32', 'Triplets', 'Free'],
      default: '1/16',
      visibleWhen: 'Rhythmic Patterns'
    },
    
    zoneCount: {
      label: 'Spatial Zones',
      range: [2, 8],
      default: 4,
      visibleWhen: 'Spatial Zones'
    }
  },
  
  // Visual Controls
  overlayOpacity: {
    label: 'Overlay Visibility',
    range: [0, 1],
    default: 0.7
  },
  
  showCrosshair: {
    type: 'checkbox',
    default: true
  },
  
  showZones: {
    type: 'checkbox',
    default: false,
    description: 'Visualize spatial zones in overlay'
  }
}
```

#### 3.3 Master Audio Section
```javascript
MasterAudioControls {
  // Main Volume
  masterGain: {
    label: 'Master Volume',
    range: [-60, 6],  // dB
    default: -6,
    unit: 'dB'
  },
  
  // Global Grain Settings (affects all species)
  globalGrainDensity: {
    label: 'Global Grain Density',
    range: [0.5, 2.0],  // Multiplier for all species
    default: 1.0,
    description: 'Scales grain density for all species'
  },
  
  globalGrainSize: {
    label: 'Global Grain Size',
    range: [0.5, 2.0],  // Multiplier
    default: 1.0,
    description: 'Scales grain size for all species'
  },
  
  // Dynamics Processing
  compressor: {
    threshold: { range: [-60, 0], default: -24, unit: 'dB' },
    ratio: { range: [1, 20], default: 4 },
    attack: { range: [0, 100], default: 5, unit: 'ms' },
    release: { range: [0, 1000], default: 100, unit: 'ms' },
    knee: { range: [0, 40], default: 5, unit: 'dB' }
  },
  
  limiter: {
    ceiling: { range: [-10, 0], default: -0.3, unit: 'dB' },
    lookahead: { range: [0, 10], default: 5, unit: 'ms' }
  },
  
  // Monitoring
  meters: {
    showPeak: true,
    showRMS: true,
    holdTime: 2000  // ms
  }
}

#### 3.4 Dynamic Species Audio Sections
Per-species controls (auto-generated based on active species):
```javascript
SpeciesAudioControl {
  // Sample Management
  sampleLoader: {
    fileInput: true,
    dragDrop: true,
    maxFileSize: '10MB',
    supportedFormats: ['wav', 'mp3', 'ogg', 'flac']
  },
  
  waveformDisplay: {
    height: 40,
    showPlayhead: true,
    zoomable: true
  },
  
  // Sample Playback Controls (from HTML reference)
  sampleRange: {
    start: { range: [0, 1], default: 0, label: 'Sample Start' },
    end: { range: [0, 1], default: 1, label: 'Sample End' },
    visualization: 'waveform overlay'
  },
  
  loopMode: {
    type: 'button-group',
    options: ['forward', 'reverse', 'alternate'],
    default: 'forward',
    description: 'Grain playback direction'
  },
  
  // Core Grain Parameters (matching HTML implementation)
  grainSize: {
    label: 'Grain Size',
    range: [10, 200],  // ms
    default: 100,
    unit: 'ms',
    exponential: true  // Logarithmic scaling for better control
  },
  
  grainDensity: {
    label: 'Grain Density', 
    range: [1, 100],  // grains per second
    default: 20,
    unit: 'gr/s',
    description: 'Number of grains triggered per second'
  },
  
  grainOverlap: {
    label: 'Grain Overlap',
    range: [0.1, 0.9],  // 10-90%
    default: 0.5,
    unit: '%',
    description: 'Amount of grain overlap'
  },
  
  // Pitch & Tuning (from HTML)
  pitchShift: {
    label: 'Pitch Shift',
    range: [0, 24],  // semitones (only positive in HTML)
    default: 0,
    unit: 'st',
    description: 'Transposition in semitones'
  },
  
  detune: {
    label: 'Detune Random',
    range: [0, 50],  // cents
    default: 0,
    unit: '¢',
    description: 'Random detune amount per grain'
  },
  
  // Advanced Grain Parameters
  fadeLength: {
    label: 'Crossfade',
    range: [0.001, 0.02],  // 1-20ms
    default: 0.002,
    unit: 'ms',
    display: (v) => `${(v * 1000).toFixed(1)}ms`,
    description: 'Grain envelope fade time'
  },
  
  // Modulation & Mapping
  velocityMapping: {
    gainCurve: {
      label: 'Velocity→Gain Curve',
      range: [0.1, 3.0],
      default: 1.0,
      description: 'Exponential curve for velocity to gain mapping'
    },
    
    velocityThreshold: {
      label: 'Velocity Threshold',
      range: [0, 10],
      default: 0.5,
      unit: 'px/frame',
      description: 'Minimum velocity to trigger grains'
    }
  },
  
  spatialMapping: {
    panRange: {
      label: 'Pan Range',
      range: [0, 1],  // 0 = center, 1 = full stereo
      default: 0.8,
      description: 'Stereo width based on X position'
    },
    
    distanceAttenuation: {
      label: 'Distance Falloff',
      range: [0, 1],
      default: 0.5,
      description: 'Volume reduction based on distance from center'
    }
  },
  
  // Particle-to-Grain Mapping
  particleMapping: {
    densityModulation: {
      label: 'Density by Count',
      range: [0, 1],
      default: 0.5,
      description: 'How particle count affects grain density'
    },
    
    positionJitter: {
      label: 'Position Jitter',
      range: [0, 0.1],  // 0-10% of sample length
      default: 0.02,
      description: 'Random grain position variation'
    },
    
    grainSizeModulation: {
      label: 'Size by Velocity',
      range: [0, 1],
      default: 0.3,
      description: 'How velocity affects grain size'
    }
  },
  
  // Output Controls
  output: {
    volume: {
      label: 'Species Volume',
      range: [-60, 6],  // dB
      default: -6,
      unit: 'dB'
    },
    
    mute: {
      type: 'button',
      togglable: true
    },
    
    solo: {
      type: 'button',
      togglable: true,
      exclusive: true  // Only one species can be soloed
    }
  },
  
  // Visual Feedback
  grainIndicators: {
    maxDisplay: 10,
    showActive: true,
    colorByPitch: true
  },
  
  levelMeter: {
    showPeak: true,
    showRMS: false,
    range: [-60, 0]  // dB
  }
}

### Phase 4: High-Performance Audio-Visual Integration (Week 2-3)

#### 4.1 Decoupled Particle Data Bridge
```javascript
class DecoupledParticleAudioBridge {
  constructor() {
    this.audioUpdateInterval = 1000/60; // 60Hz fixed
    this.lastParticleUpdate = 0;
    this.particleData = new SharedArrayBuffer(1024 * 1024); // 1MB shared memory
    this.dataView = new DataView(this.particleData);
    this.audioTimer = null;
  }
  
  // Called whenever particle system updates (5-60 FPS)
  updateFromParticles(particles, samplingArea) {
    // Non-blocking write to shared memory
    this.writeParticleSnapshot(particles, samplingArea);
    this.lastParticleUpdate = performance.now();
  }
  
  // Called at fixed 60Hz for audio
  startAudioUpdates(callback) {
    this.audioTimer = setInterval(() => {
      const data = this.getInterpolatedData();
      callback(data);
    }, this.audioUpdateInterval);
  }
  
  getInterpolatedData() {
    const timeSinceUpdate = performance.now() - this.lastParticleUpdate;
    
    if (timeSinceUpdate > 200) {
      // Particle system is very slow, use predictive modeling
      return this.predictParticleState(timeSinceUpdate);
    }
    
    // Normal interpolation
    return this.interpolateFromSnapshot();
  }
}
```

#### 4.2 Adaptive Grain Triggering
```javascript
class AdaptiveGrainScheduler {
  constructor() {
    this.maxConcurrentGrains = 128;
    this.grainPool = new GrainPool(256); // Pre-allocated grains
    this.priorityQueue = new PriorityQueue();
  }
  
  // Intelligent grain scheduling based on particle density
  scheduleGrains(audioData) {
    const { density, speciesDistribution } = audioData;
    
    // Adaptive grain rate based on particle count
    const grainRate = this.calculateAdaptiveRate(density);
    
    // Priority-based species selection for high particle counts
    const prioritySpecies = this.getPrioritySpecies(speciesDistribution);
    
    // Schedule grains efficiently
    prioritySpecies.forEach(species => {
      const grainsForSpecies = Math.floor(grainRate * species.ratio);
      this.scheduleSpeciesGrains(species, grainsForSpecies);
    });
  }
  
  calculateAdaptiveRate(density) {
    // Logarithmic scaling for high particle counts
    if (density < 100) return density;
    if (density < 1000) return 100 + Math.log10(density) * 20;
    return 150; // Cap at 150 grains/sec for 1000+ particles
  }
}
```

#### 4.3 Advanced Performance Optimization
```javascript
class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      particleFPS: 60,
      audioLoad: 0,
      grainCount: 0,
      bufferUnderruns: 0
    };
    
    this.strategies = {
      FULL_QUALITY: { sampleRate: 44100, grainQuality: 'high', maxGrains: 128 },
      BALANCED: { sampleRate: 22050, grainQuality: 'medium', maxGrains: 96 },
      PERFORMANCE: { sampleRate: 22050, grainQuality: 'low', maxGrains: 64 },
      EMERGENCY: { sampleRate: 11025, grainQuality: 'minimal', maxGrains: 32 }
    };
    
    this.currentStrategy = 'BALANCED';
  }
  
  // Dynamic quality adjustment
  adjustQuality() {
    const { particleFPS, audioLoad } = this.metrics;
    
    if (particleFPS < 10 || audioLoad > 0.8) {
      this.currentStrategy = 'EMERGENCY';
    } else if (particleFPS < 20 || audioLoad > 0.6) {
      this.currentStrategy = 'PERFORMANCE';
    } else if (particleFPS < 30 || audioLoad > 0.4) {
      this.currentStrategy = 'BALANCED';
    } else {
      this.currentStrategy = 'FULL_QUALITY';
    }
    
    return this.strategies[this.currentStrategy];
  }
}
```

**Optimization Features:**
- **Spatial Hashing**: O(1) particle lookups for 10K particles
- **Adaptive Sampling**: Sample 100-200 particles from 10K for audio
- **Frame Interpolation**: Smooth audio at 5 FPS particle updates
- **Dynamic Quality**: Auto-adjust audio quality based on performance
- **Grain Pooling**: Pre-allocated grains to avoid GC pressure
- **Priority Scheduling**: Focus on audibly important particles
- **Predictive Modeling**: Estimate particle positions during lag

### Phase 5: Advanced Audio Controls & Features (Week 3-4)

#### 5.0 Advanced Performance Controls
```javascript
AdvancedPerformanceControls {
  // Adaptive Sampling Controls
  adaptiveSampling: {
    enabled: { type: 'checkbox', default: true },
    
    minSampleSize: {
      label: 'Min Sample Size',
      range: [10, 100],
      default: 50,
      description: 'Minimum particles to sample even under load'
    },
    
    qualityPreset: {
      type: 'select',
      options: ['Ultra', 'High', 'Balanced', 'Performance', 'Emergency'],
      default: 'Balanced',
      manual: true,  // Allow manual override
      description: 'Override automatic quality adjustment'
    },
    
    interpolationDepth: {
      label: 'Frame Interpolation',
      range: [1, 8],  // frames
      default: 4,
      description: 'Number of frames to interpolate between updates'
    }
  },
  
  // CPU Management
  cpuManagement: {
    targetCPU: {
      label: 'Target CPU %',
      range: [10, 50],
      default: 25,
      description: 'Target CPU usage for audio system'
    },
    
    priorityMode: {
      type: 'select',
      options: ['Audio First', 'Balanced', 'Visual First'],
      default: 'Audio First',
      description: 'Priority when system is under load'
    }
  },
  
  // Grain Pool Management
  grainPooling: {
    maxTotalGrains: {
      label: 'Max Total Grains',
      range: [32, 256],
      default: 128,
      description: 'Maximum concurrent grains across all species'
    },
    
    voiceStealingMode: {
      type: 'select',
      options: ['Oldest', 'Quietest', 'Furthest', 'Random'],
      default: 'Oldest',
      description: 'Which grains to remove when limit reached'
    },
    
    preAllocateBuffers: {
      label: 'Pre-allocate Buffers',
      range: [64, 512],
      default: 256,
      description: 'Number of audio buffers to pre-allocate'
    }
  }
}
```

#### 5.1 Advanced Audio Processing
```javascript
AdvancedAudioProcessing {
  // Spatial Audio Enhancement
  spatialAudio: {
    mode: {
      type: 'select',
      options: ['Stereo', 'Binaural', '3D HRTF', 'Ambisonic'],
      default: 'Stereo'
    },
    
    roomSize: {
      label: 'Virtual Room Size',
      range: [0.1, 10],
      default: 1.0,
      enabled: (mode) => mode !== 'Stereo'
    },
    
    earlyReflections: {
      label: 'Early Reflections',
      range: [0, 1],
      default: 0.3,
      description: 'Simulate room acoustics'
    }
  },
  
  // Granular Texture Controls
  textureControls: {
    grainSpray: {
      label: 'Grain Spray',
      range: [0, 1],
      default: 0,
      description: 'Randomize grain timing for texture'
    },
    
    harmonicSeries: {
      label: 'Harmonic Series',
      type: 'multi-select',
      options: [1, 2, 3, 4, 5, 6, 7, 8],
      default: [1],
      description: 'Generate grains at harmonic intervals'
    },
    
    spectralSpread: {
      label: 'Spectral Spread',
      range: [0, 1],
      default: 0,
      description: 'Frequency dispersion of grains'
    }
  },
  
  // Filter Bank per Species
  filterBank: {
    enabled: { type: 'checkbox', default: false },
    
    filterType: {
      type: 'select',
      options: ['Lowpass', 'Highpass', 'Bandpass', 'Notch', 'Allpass'],
      default: 'Lowpass'
    },
    
    cutoff: {
      label: 'Cutoff Frequency',
      range: [20, 20000],
      default: 5000,
      unit: 'Hz',
      exponential: true
    },
    
    resonance: {
      label: 'Resonance',
      range: [0.1, 30],
      default: 1,
      unit: 'Q'
    },
    
    modulation: {
      source: {
        type: 'select',
        options: ['None', 'Particle Density', 'Average Velocity', 'Center of Mass Y'],
        default: 'None'
      },
      depth: {
        range: [0, 1],
        default: 0.5
      }
    }
  }
}
```

#### 5.2 Modulation Matrix & Mapping
```javascript
ModulationMatrix {
  // Sources (from particle system)
  sources: [
    'Particle Count in Circle',
    'Average Velocity',
    'Species Density',
    'Center of Mass X',
    'Center of Mass Y',
    'Dispersion (spread)',
    'Chaos Index',
    'Orbital Frequency',
    'Collision Rate',
    'Distance from Center'
  ],
  
  // Destinations (audio parameters)
  destinations: [
    'Grain Size',
    'Grain Density',
    'Pitch Shift',
    'Detune Amount',
    'Filter Cutoff',
    'Filter Resonance',
    'Pan Position',
    'Volume',
    'Reverb Send',
    'Delay Send'
  ],
  
  // Mapping Configuration
  mappingSlots: {
    count: 8,  // 8 modulation slots per species
    
    perSlot: {
      source: 'dropdown',
      destination: 'dropdown',
      depth: { range: [-1, 1], default: 0 },
      curve: {
        type: 'select',
        options: ['Linear', 'Exponential', 'Logarithmic', 'S-Curve', 'Step'],
        default: 'Linear'
      },
      smoothing: {
        label: 'Smoothing Time',
        range: [0, 1000],
        default: 100,
        unit: 'ms'
      }
    }
  },
  
  // Preset Mappings
  presetMappings: [
    {
      name: 'Dynamic Swarm',
      mappings: [
        { source: 'Particle Count', dest: 'Grain Density', depth: 0.8 },
        { source: 'Average Velocity', dest: 'Pitch Shift', depth: 0.5 },
        { source: 'Center of Mass X', dest: 'Pan Position', depth: 1.0 }
      ]
    },
    {
      name: 'Spatial Texture',
      mappings: [
        { source: 'Distance from Center', dest: 'Filter Cutoff', depth: -0.7 },
        { source: 'Dispersion', dest: 'Reverb Send', depth: 0.6 },
        { source: 'Chaos Index', dest: 'Detune Amount', depth: 0.4 }
      ]
    }
  ]
}
```

### Phase 5: Advanced Features (Week 3-4)

#### 5.1 Spatial Audio
- **Binaural Panning**: HRTF-based 3D positioning
- **Distance Attenuation**: Based on particle distance from center
- **Doppler Effect**: Optional velocity-based pitch shift

#### 5.2 Modulation Matrix
- **Source Metrics**: Position, velocity, acceleration, species density
- **Destinations**: All grain parameters
- **Mapping Curves**: Linear, exponential, logarithmic, custom
- **Depth Control**: Per-mapping intensity

#### 5.3 Effects Chain (Optional)
- **Per-Species**: Filter, delay, reverb send
- **Master Bus**: EQ, compression, limiting
- **Send Effects**: Shared reverb, delay buses

## Robustness & Performance for Large Particle Counts

### Handling 5K-10K Particles with 1:1 Grain Mapping

```javascript
class RobustGrainSystem {
  constructor() {
    this.maxActiveGrains = 256; // Hard limit for audio
    this.grainPool = new Array(512); // Pre-allocated pool
    this.activeGrains = new Set();
    this.priorityQueue = new PriorityQueue();
    
    // Initialize grain pool
    for (let i = 0; i < this.grainPool.length; i++) {
      this.grainPool[i] = new Grain();
    }
  }
  
  // Intelligent grain allocation for high particle counts
  processParticlesInCircle(particles) {
    const count = particles.length;
    
    if (count <= this.maxActiveGrains) {
      // Direct 1:1 mapping when under limit
      return this.directMapping(particles);
    } else {
      // Smart reduction strategies when over limit
      return this.intelligentReduction(particles, count);
    }
  }
  
  intelligentReduction(particles, count) {
    const strategy = this.selectStrategy(count);
    
    switch(strategy) {
      case 'PRIORITY_SAMPLING':
        // Sample based on velocity, position, species importance
        return this.prioritySampling(particles);
      
      case 'SPATIAL_CLUSTERING':
        // Group nearby particles, one grain per cluster
        return this.spatialClustering(particles);
      
      case 'TEMPORAL_SPREADING':
        // Spread grain triggers over time
        return this.temporalSpreading(particles);
      
      case 'SPECIES_QUOTA':
        // Allocate grains per species proportionally
        return this.speciesQuota(particles);
      
      case 'HYBRID':
        // Combine multiple strategies
        return this.hybridStrategy(particles);
    }
  }
  
  prioritySampling(particles) {
    // Score each particle
    const scored = particles.map(p => ({
      particle: p,
      score: this.calculatePriority(p)
    }));
    
    // Sort by priority
    scored.sort((a, b) => b.score - a.score);
    
    // Take top N
    return scored
      .slice(0, this.maxActiveGrains)
      .map(s => this.mapParticleToGrain(s.particle));
  }
  
  calculatePriority(particle) {
    let score = 0;
    
    // Velocity contributes most (fast = audible)
    score += particle.velocity * 0.4;
    
    // Distance from center (closer = more important)
    const distFromCenter = this.distanceFromSamplingCenter(particle);
    score += (1 - distFromCenter / this.samplingRadius) * 0.3;
    
    // Species importance (user-defined or auto)
    score += this.speciesImportance[particle.species] * 0.2;
    
    // Randomness to prevent static selection
    score += Math.random() * 0.1;
    
    return score;
  }
}
```

### Memory Management for Large-Scale Audio

```javascript
class MemoryEfficientAudio {
  constructor() {
    // Use SharedArrayBuffer for zero-copy between threads
    this.sharedMemory = new SharedArrayBuffer(10 * 1024 * 1024); // 10MB
    this.dataView = new DataView(this.sharedMemory);
    
    // Ring buffers for audio data
    this.grainBuffers = new RingBufferPool(256, 4096); // 256 buffers, 4KB each
    
    // Object pools to prevent GC
    this.grainPool = new ObjectPool(Grain, 512);
    this.envelopePool = new ObjectPool(Envelope, 512);
    
    // Weak references for automatic cleanup
    this.sampleCache = new WeakMap();
  }
  
  // Efficient grain scheduling
  scheduleGrain(particle, audioBuffer) {
    // Get grain from pool (no allocation)
    const grain = this.grainPool.acquire();
    
    // Configure grain (reuse existing buffer)
    grain.configure(particle, audioBuffer);
    
    // Schedule with Web Audio API
    grain.schedule(this.audioContext.currentTime);
    
    // Return to pool when done
    grain.onended = () => this.grainPool.release(grain);
  }
}
```

### CPU Optimization Strategies

```javascript
class CPUOptimizer {
  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.adaptiveQuality = new AdaptiveQuality();
  }
  
  // Dynamic quality adjustment based on performance
  adjustQualityForPerformance() {
    const metrics = this.performanceMonitor.getMetrics();
    
    if (metrics.audioLoad > 0.7 || metrics.particleFPS < 10) {
      // Emergency mode
      this.adaptiveQuality.setMode('EMERGENCY');
      this.maxActiveGrains = 32;
      this.sampleRate = 22050;
      this.grainQuality = 'low';
    } else if (metrics.audioLoad > 0.5 || metrics.particleFPS < 20) {
      // Performance mode
      this.adaptiveQuality.setMode('PERFORMANCE');
      this.maxActiveGrains = 64;
      this.sampleRate = 44100;
      this.grainQuality = 'medium';
    } else if (metrics.audioLoad > 0.3 || metrics.particleFPS < 30) {
      // Balanced mode
      this.adaptiveQuality.setMode('BALANCED');
      this.maxActiveGrains = 128;
      this.sampleRate = 44100;
      this.grainQuality = 'high';
    } else {
      // Full quality
      this.adaptiveQuality.setMode('FULL');
      this.maxActiveGrains = 256;
      this.sampleRate = 48000;
      this.grainQuality = 'ultra';
    }
  }
  
  // Batch processing for efficiency
  processBatch(particles) {
    // Process in chunks to prevent blocking
    const chunkSize = 100;
    const chunks = [];
    
    for (let i = 0; i < particles.length; i += chunkSize) {
      chunks.push(particles.slice(i, i + chunkSize));
    }
    
    // Process chunks with microtasks
    return chunks.reduce((promise, chunk) => {
      return promise.then(() => 
        new Promise(resolve => {
          queueMicrotask(() => {
            this.processChunk(chunk);
            resolve();
          });
        })
      );
    }, Promise.resolve());
  }
}
```

## File Structure

```
src/
├── audio/
│   ├── AudioEngine.js              # Main audio context manager
│   ├── GranularSynth.js            # Per-species granular engine
│   ├── SamplingArea.js             # Circular area detection
│   ├── DecoupledAudioBridge.js     # Decoupled particle-audio bridge
│   ├── IntelligentSampler.js       # Smart particle sampling for 10K support
│   ├── SpatialHashGrid.js          # O(1) particle lookups
│   ├── AdaptiveGrainScheduler.js   # Dynamic grain allocation
│   ├── PerformanceOptimizer.js     # Auto quality adjustment
│   └── AudioBufferPool.js          # Pre-allocated buffer management
├── ui/
│   ├── LeftPanel.js                # New left panel container
│   ├── SamplingControl.js          # XY graph for sampling
│   ├── MasterAudioControl.js       # Global audio settings
│   ├── SpeciesAudioControl.js      # Per-species audio UI
│   └── AudioMeter.js               # Level meters
└── utils/
    ├── AudioHelpers.js             # Audio utility functions
    ├── ModulationMatrix.js         # Parameter mapping system
    ├── RingBuffer.js               # Frame interpolation buffer
    └── PriorityQueue.js            # Grain scheduling queue
```

## Risk Analysis & Mitigation

### High Risk Areas

1. **Extreme Particle Counts (5K-10K)**
   - **Risk**: O(n) operations become prohibitive at 10K particles
   - **Mitigation**: 
     - Spatial hashing for O(1) lookups
     - Statistical sampling (max 200 particles for audio)
     - Frame interpolation for smooth audio at 5 FPS
   - **Fallback**: Progressive quality reduction, emergency mode at <5 FPS

2. **Audio-Visual Desynchronization**
   - **Risk**: Audio drifts from visual state at low FPS
   - **Mitigation**:
     - Complete decoupling with independent update rates
     - Predictive modeling for >200ms lag
     - Interpolation buffer for smoothing
   - **Fallback**: Snapshot-based audio with acceptable 100-200ms latency

3. **Memory Pressure from 10K Particles**
   - **Risk**: GC pauses causing audio glitches
   - **Mitigation**:
     - Pre-allocated object pools (grains, buffers)
     - SharedArrayBuffer for zero-copy data transfer
     - Fixed-size ring buffers
   - **Monitoring**: Real-time memory metrics, GC pause detection

4. **CPU Saturation**
   - **Risk**: Combined particle + audio processing exceeds capacity
   - **Mitigation**:
     - Dynamic quality adjustment (4 quality levels)
     - Adaptive grain limits based on performance
     - Priority-based particle sampling
   - **Fallback**: Emergency mode with minimal grains

### Medium Risk Areas

1. **UI Complexity**
   - **Risk**: Cluttered interface with dual panels
   - **Mitigation**: Collapsible sections, progressive disclosure
   - **Testing**: User feedback sessions

2. **Sample Loading**
   - **Risk**: Large audio files blocking UI
   - **Mitigation**: Async loading, progress indicators
   - **Limits**: Max 10MB per sample

3. **Synchronization**
   - **Risk**: Audio-visual drift
   - **Mitigation**: Timestamp alignment, interpolation
   - **Tolerance**: ±16ms acceptable

### Low Risk Areas

1. **State Management**
   - Leverage existing preset system
   - Audio parameters in preset JSON
   - Backward compatibility maintained

2. **Visual Overlay**
   - Simple canvas drawing
   - Proven blend mode technique
   - Minimal performance impact

## Implementation Timeline

### Week 1: Foundation
- [ ] Audio context setup
- [ ] Basic granular synth
- [ ] Sampling area overlay
- [ ] Initial audio tests

### Week 2: UI Development
- [ ] Left panel structure
- [ ] Sampling control graph
- [ ] Master volume controls
- [ ] Species audio sections

### Week 3: Integration
- [ ] Particle data bridge
- [ ] Grain triggering logic
- [ ] Performance optimization
- [ ] Cross-browser testing

### Week 4: Polish
- [ ] Modulation matrix
- [ ] Advanced parameters
- [ ] Preset integration
- [ ] Bug fixes and optimization

## Success Metrics

1. **Performance with 5K-10K Particles**
   - **Audio Continuity**: Zero audio dropouts even at 5 FPS particle rendering
   - **Latency**: < 20ms perceived audio latency (acceptable for real-time control)
   - **CPU Usage**: Audio system < 15% CPU independent of particle count
   - **Memory**: < 100MB additional RAM for audio system
   - **Grain Count**: Maintain 32-150 grains/sec based on performance

2. **Scalability**
   - **1K particles**: Full quality (128 grains, 44.1kHz)
   - **5K particles**: Balanced mode (96 grains, 22kHz) 
   - **10K particles**: Performance mode (64 grains, adaptive sampling)
   - **Graceful Degradation**: Automatic quality adjustment without user intervention

3. **User Experience**
   - **Smooth Audio**: No glitches when particle FPS drops
   - **Responsive Controls**: UI updates at 60 FPS regardless of particles
   - **Visual Feedback**: Sampling overlay smooth even at low particle FPS
   - **Intuitive Mapping**: Clear relationship between particles and sound

## Testing Strategy

### Unit Tests
- Audio buffer management
- Grain generation accuracy
- Parameter range validation

### Integration Tests
- Particle-audio synchronization
- UI state persistence
- Preset save/load with audio

### Performance Tests
- **Stress Testing**: 
  - 10K particles at 5 FPS → Audio must remain smooth
  - 5K particles at 15 FPS → Balanced quality maintained
  - 1K particles at 30 FPS → Full quality audio
- **Memory Profiling**: 
  - No memory leaks over 2-hour sessions
  - GC pauses < 5ms
  - Total memory < 500MB with 10K particles
- **Long-running Stability**: 
  - 4+ hour sessions without degradation
  - Automatic recovery from performance dips

### User Tests
- Control responsiveness
- Parameter mapping intuition
- Audio quality perception

## Deployment Considerations

1. **Progressive Enhancement**
   - Audio as optional feature
   - Graceful degradation
   - Feature flags for rollout

2. **Performance Monitoring**
   - FPS tracking with audio
   - Memory usage alerts
   - Error reporting

3. **Documentation**
   - User guide for audio features
   - Technical documentation
   - Troubleshooting guide

## Future Enhancements

1. **JUCE Integration** (Phase 2)
   - VST/AU plugin export
   - Professional DAW integration
   - Hardware acceleration

2. **Machine Learning** (Phase 3)
   - Intelligent grain parameter mapping
   - Pattern recognition for presets
   - Adaptive performance optimization

3. **Collaborative Features** (Phase 4)
   - Multi-user audio sessions
   - Cloud-based processing
   - Real-time parameter sharing

## Implementation Checklist

### Core Requirements ✓
- [x] **1:1 Particle-Grain Mapping**: Each particle = one grain in sample
- [x] **Circular Sampling Control**: XY graph with adjustable radius
- [x] **Particle Position Mapping**:
  - X-axis → Sample position
  - Y-axis → Frequency/pitch
  - X-axis → Stereo panning
- [x] **Visual-Audio Connections**:
  - Particle size → Frequency band width
  - Trail length → Grain duration
  - Velocity → Grain volume
- [x] **Grain Organization Modes**: 8 different modes for experimentation
- [x] **Sample Management**: Auto-load from "stems" folder
- [x] **Firebase Integration**: Complete audio settings in presets
- [x] **Performance Optimization**: Handle 5K-10K particles smoothly

### UI Implementation ✓
- [x] **Left Panel Structure**: Mirrors right panel style
- [x] **Sampling Control**:
  - XY graph for position
  - Radius slider (5-50% canvas)
  - Max particles slider (50-1000)
  - Organization mode selector
- [x] **Per-Species Controls**: All parameters from HTML reference
- [x] **Master Audio**: Global controls and dynamics
- [x] **Performance Controls**: Quality presets and CPU management

### Robustness Features ✓
- [x] **Intelligent Grain Reduction**: Priority sampling when over limit
- [x] **Memory Management**: Object pools, SharedArrayBuffer
- [x] **CPU Optimization**: Dynamic quality adjustment
- [x] **Batch Processing**: Non-blocking chunk processing

## Development Workflow

### Day 1-2: Foundation
1. Setup WebAudio context and basic grain engine
2. Implement 1:1 particle-grain mapping logic
3. Create circular sampling overlay
4. Test with 100-500 particles

### Day 3-4: UI Development
1. Build left panel with CollapsibleSection
2. Implement XY control graph
3. Add all sliders and controls
4. Connect UI to audio engine

### Day 5-6: Sample Management
1. Create stems folder structure
2. Implement auto-loading system
3. Add random sample buttons
4. Test with multiple samples

### Day 7-8: Grain Organization
1. Implement all 8 organization modes
2. Add mode-specific parameters
3. Test each mode thoroughly
4. Optimize performance

### Day 9-10: Firebase Integration
1. Extend preset structure
2. Save/load audio settings
3. Test cloud sync
4. Handle edge cases

### Day 11-12: Performance & Polish
1. Test with 5K-10K particles
2. Implement priority sampling
3. Add CPU optimization
4. Final debugging

## Conclusion

This comprehensive implementation plan provides a complete blueprint for adding professional granular synthesis to the Particle Life Synth. The system maintains the intuitive 1:1 particle-grain mapping from the HTML reference while solving the chaos problem through circular sampling control.

### Key Achievements:
1. **True 1:1 Mapping**: Each particle directly controls a grain position
2. **Density Management**: Circular area prevents audio chaos
3. **Creative Control**: 8 grain organization modes for experimentation
4. **Automatic Workflow**: Random samples from stems folder
5. **Cloud Integration**: Complete Firebase audio preset support
6. **Robust Performance**: Handles 10K particles at low FPS

### Success Metrics:
- Zero audio dropouts with 10K particles at 5 FPS
- Smooth grain generation with intelligent reduction
- Intuitive mapping between visuals and audio
- Complete preset recall including all audio settings
- Professional sound quality matching DAW plugins

The implementation follows a clear 12-day schedule with concrete deliverables, ensuring a smooth development process with minimal issues. The modular architecture allows for future enhancements while the robust performance system ensures stability even under extreme load.