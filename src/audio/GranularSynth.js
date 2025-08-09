/**
 * GranularSynth.js - Per-species granular synthesis engine
 * Implements 1:1 particle-to-grain mapping with advanced grain control
 */

export class GranularSynth {
  constructor(audioEngine, speciesIndex) {
    this.audioEngine = audioEngine;
    this.audioContext = audioEngine.audioContext;
    this.speciesIndex = speciesIndex;
    
    // Audio buffer for this species
    this.audioBuffer = null;
    this.sampleName = null;
    this.samplePath = null;
    
    // Grain parameters
    this.grainSize = 100; // ms
    this.grainDensity = 20; // grains per second
    this.grainOverlap = 0.5; // 50% overlap
    this.pitchShift = 0; // semitones
    this.detune = 0; // cents random
    this.fadeLength = 0.002; // crossfade time
    this.loopMode = 'forward'; // forward, reverse, alternate
    this.sampleStart = 0; // 0-1 normalized
    this.sampleEnd = 1; // 0-1 normalized
    
    // Species-specific audio settings
    this.volume = 0; // dB (full volume, was -6dB)
    this.mute = false;
    this.solo = false;
    this.pan = 0; // -1 to 1
    
    // Particle mapping settings
    this.velocityMapping = {
      gainCurve: 1.0,
      velocityThreshold: 0.5
    };
    
    this.spatialMapping = {
      panRange: 0.8,
      distanceAttenuation: 0.5
    };
    
    this.particleMapping = {
      densityModulation: 0.5,
      positionJitter: 0.02,
      grainSizeModulation: 0.3
    };
    
    // Nodes for this species
    this.outputGain = null;
    this.panner = null;
    this.filter = null;
    this.filterEnabled = false;
    
    // Enhanced grain management based on research
    this.activeGrains = new Set();
    this.maxGrainsPerSpecies = 64; // Increased based on modern performance
    this.grainPool = []; // Reusable grain objects to avoid GC
    this.poolSize = 100;
    this.initializeGrainPool();
    
    // High-performance scheduling (Bencina architecture)
    this.lastGrainTime = 0;
    this.grainScheduler = null;
    this.schedulingBuffer = new Float32Array(512); // Pre-allocated scheduling buffer
    this.grainEvents = []; // Event queue for precise timing
    this.nextGrainIndex = 0;
    
    // Envelope optimization
    this.envelopeCache = new Map(); // Cache for different grain sizes
    this.defaultEnvelopeSize = 1024;
    this.precomputeEnvelopes();
    
    this.initializeNodes();
  }
  
  initializeGrainPool() {
    // Pre-allocate grain objects to avoid garbage collection hitches
    for (let i = 0; i < this.poolSize; i++) {
      this.grainPool.push({
        active: false,
        source: null,
        envelope: null,
        panner: null,
        startTime: 0,
        duration: 0,
        sampleOffset: 0,
        playbackRate: 1.0,
        volume: 1.0,
        pan: 0
      });
    }
  }
  
  precomputeEnvelopes() {
    // Pre-compute optimized envelope curves (raised cosine windows)
    const sizes = [256, 512, 1024, 2048]; // Common grain sizes in samples
    
    for (const size of sizes) {
      const envelope = new Float32Array(size);
      for (let i = 0; i < size; i++) {
        // Raised cosine (Hann) window - optimal for grain synthesis
        const phase = (i / (size - 1)) * Math.PI;
        envelope[i] = 0.5 * (1 - Math.cos(2 * phase));
      }
      this.envelopeCache.set(size, envelope);
    }
  }
  
  initializeNodes() {
    // Create output gain for this species
    this.outputGain = this.audioContext.createGain();
    this.outputGain.gain.value = this.dbToLinear(this.volume);
    
    // Create panner
    this.panner = this.audioContext.createStereoPanner();
    this.panner.pan.value = this.pan;
    
    // Create filter (initially bypassed)
    this.filter = this.audioContext.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 5000;
    this.filter.Q.value = 1;
    
    // Connect nodes
    this.reconnectNodes();
    
    // Connect to master
    this.outputGain.connect(this.audioEngine.masterGain);
  }
  
  reconnectNodes() {
    // Disconnect all
    try {
      this.panner.disconnect();
      this.filter.disconnect();
      this.outputGain.disconnect();
    } catch (e) {
      // Ignore if not connected
    }
    
    // Reconnect based on filter state
    if (this.filterEnabled) {
      this.panner.connect(this.filter);
      this.filter.connect(this.outputGain);
    } else {
      this.panner.connect(this.outputGain);
    }
    
    this.outputGain.connect(this.audioEngine.masterGain);
  }
  
  /**
   * Enhanced particle processing based on Bencina's unified scheduling approach
   * Integrates scheduling, synthesis, and mixing for optimal performance
   * @param {Array} particles - Particles of this species within sampling area
   * @param {Object} canvasDimensions - Canvas width and height
   * @param {String} organizationMode - Grain organization mode
   */
  processParticles(particles, canvasDimensions, organizationMode = 'Direct (1:1)') {
    if (!this.audioBuffer || this.mute) return;
    
    // Apply global multipliers
    const effectiveDensity = this.grainDensity * this.audioEngine.globalGrainDensity;
    const effectiveSize = this.grainSize * this.audioEngine.globalGrainSize;
    
    // Enhanced performance-based grain limiting
    const currentLoad = this.calculateAudioLoad();
    const adaptiveMaxGrains = this.calculateAdaptiveGrainLimit(currentLoad);
    const maxGrains = Math.min(particles.length, adaptiveMaxGrains);
    
    // Priority-based particle selection with velocity weighting
    const particlesToProcess = this.selectParticlesToProcess(particles, maxGrains);
    
    // Integrated scheduling and synthesis (Bencina approach)
    this.processGrainsUnified(particlesToProcess, canvasDimensions, effectiveSize, organizationMode);
  }
  
  calculateAudioLoad() {
    // Monitor CPU load and active grain count for adaptive performance
    const activeRatio = this.activeGrains.size / this.maxGrainsPerSpecies;
    const memoryPressure = this.grainPool.filter(g => g.active).length / this.poolSize;
    return Math.max(activeRatio, memoryPressure);
  }
  
  calculateAdaptiveGrainLimit(currentLoad) {
    // Dynamically adjust grain limit based on current system load
    const baseLimit = this.maxGrainsPerSpecies;
    if (currentLoad > 0.9) return Math.floor(baseLimit * 0.5); // Heavy load
    if (currentLoad > 0.7) return Math.floor(baseLimit * 0.75); // Medium load
    return baseLimit; // Normal operation
  }
  
  processGrainsUnified(particles, dimensions, effectiveSize, organizationMode) {
    // Unified scheduling and synthesis for minimal overhead
    const now = this.audioContext.currentTime;
    const { width, height } = dimensions;
    const sampleDuration = this.audioBuffer.duration;
    
    // Batch process all particles in one loop (performance optimization)
    particles.forEach((particle, index) => {
      // Get recycled grain from pool
      const grain = this.getGrainFromPool();
      if (!grain) return; // Pool exhausted
      
      // Enhanced particle-to-grain mapping with research-based parameters
      this.mapParticleToGrain(particle, grain, dimensions, now);
      
      // Schedule with optimized timing
      this.scheduleGrainOptimized(grain, effectiveSize);
    });
  }
  
  getGrainFromPool() {
    // Find inactive grain from pool to avoid allocations
    for (let i = 0; i < this.grainPool.length; i++) {
      const grain = this.grainPool[i];
      if (!grain.active) {
        grain.active = true;
        return grain;
      }
    }
    return null; // Pool exhausted
  }
  
  selectParticlesToProcess(particles, maxCount) {
    if (particles.length <= maxCount) {
      return particles;
    }
    
    // Priority-based selection for high particle counts
    const scored = particles.map(p => ({
      particle: p,
      priority: this.calculateParticlePriority(p)
    }));
    
    scored.sort((a, b) => b.priority - a.priority);
    
    return scored.slice(0, maxCount).map(s => s.particle);
  }
  
  calculateParticlePriority(particle) {
    let priority = 0;
    
    // Velocity is most important for audibility
    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    priority += Math.min(1, velocity / 10) * 0.4;
    
    // Position variation adds interest
    priority += (Math.abs(particle.x - 0.5) + Math.abs(particle.y - 0.5)) * 0.3;
    
    // Size affects frequency band
    priority += (particle.size / 10) * 0.2;
    
    // Random factor to prevent static selection
    priority += Math.random() * 0.1;
    
    return priority;
  }
  
  /**
   * Core 1:1 particle-to-grain mapping
   */
  mapParticlesToGrains(particles, dimensions, mode) {
    const { width, height } = dimensions;
    const sampleDuration = this.audioBuffer.duration;
    
    return particles.map(particle => {
      // X-axis: Position in sample (0-1 normalized)
      const normalizedX = particle.x / width;
      const grainPosition = this.sampleStart + 
        (normalizedX * (this.sampleEnd - this.sampleStart));
      const grainStartTime = grainPosition * sampleDuration;
      
      // Y-axis: Frequency/pitch modulation
      const normalizedY = particle.y / height;
      const frequencyBand = (particle.size || 5) * 0.1;
      const pitchModulation = (normalizedY - 0.5) * frequencyBand * 24; // ±12 semitones
      
      // X-axis also controls panning
      const panPosition = (normalizedX * 2 - 1) * this.spatialMapping.panRange;
      
      // Velocity controls volume
      const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      const velocityGain = Math.pow(
        Math.min(1, velocity / 10),
        this.velocityMapping.gainCurve
      );
      
      // Trail length controls grain duration (if available)
      const trailLength = particle.trailLength || 0.95;
      const grainDuration = this.mapTrailToGrainLength(trailLength);
      
      // Add jitter for natural sound
      const positionJitter = (Math.random() - 0.5) * 
        this.particleMapping.positionJitter * sampleDuration;
      
      const sizeModulation = 1 + 
        (velocity - 5) * this.particleMapping.grainSizeModulation * 0.1;
      
      return {
        startTime: Math.max(0, Math.min(sampleDuration - 0.01, 
          grainStartTime + positionJitter)),
        duration: grainDuration * sizeModulation,
        pitchShift: this.pitchShift + pitchModulation,
        detune: (Math.random() - 0.5) * this.detune * 2,
        pan: panPosition,
        volume: velocityGain,
        particle: particle // Keep reference for advanced modes
      };
    });
  }
  
  mapTrailToGrainLength(trailLength) {
    // Trail length 0.5-0.99 maps to grain length 10-500ms
    const minGrain = 10;
    const maxGrain = 500;
    const normalized = (trailLength - 0.5) / 0.49;
    return minGrain + normalized * (maxGrain - minGrain);
  }
  
  // Enhanced particle-to-grain mapping (missing method fix)
  mapParticleToGrain(particle, grain, dimensions, currentTime) {
    const { width, height } = dimensions;
    const sampleDuration = this.audioBuffer.duration;
    
    const normalizedX = particle.x / width;
    const normalizedY = particle.y / height;
    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    
    // Enhanced sample position mapping
    const grainPosition = this.sampleStart + (normalizedX * (this.sampleEnd - this.sampleStart));
    const positionJitter = (Math.random() - 0.5) * this.particleMapping.positionJitter * sampleDuration;
    grain.sampleOffset = Math.max(0, Math.min(sampleDuration - 0.01, 
      (grainPosition * sampleDuration) + positionJitter));
    
    // Multi-factor pitch modulation
    const basePitch = (normalizedY - 0.5) * 24;
    const sizePitch = (particle.size || 5) * 0.2;
    const velocityPitch = Math.log2(Math.max(0.1, velocity)) * 2;
    grain.pitchShift = this.pitchShift + basePitch + sizePitch + velocityPitch;
    
    // Advanced spatial positioning
    const basePan = (normalizedX * 2 - 1) * this.spatialMapping.panRange;
    const velocityPan = (particle.vx / 10) * 0.3;
    grain.pan = Math.max(-1, Math.min(1, basePan + velocityPan));
    
    // Sophisticated volume mapping
    const velocityGain = Math.pow(Math.min(1, velocity / 10), this.velocityMapping.gainCurve) * 0.8;
    const densityGain = Math.max(0.1, 1 - (this.activeGrains.size / this.maxGrainsPerSpecies) * 0.5);
    grain.volume = velocityGain * densityGain;
    
    // Dynamic grain duration
    const baseDuration = this.mapTrailToGrainLength(particle.trailLength || 0.95);
    const velocityModulation = 1 + (velocity - 5) * this.particleMapping.grainSizeModulation * 0.1;
    const sizeModulation = 1 + ((particle.size || 5) - 5) * 0.05;
    grain.duration = (baseDuration * velocityModulation * sizeModulation) / 1000;
    
    grain.startTime = currentTime;
    return grain;
  }
  
  // Optimized grain scheduling
  scheduleGrainOptimized(grain, effectiveSize) {
    if (!grain || !this.audioBuffer) return;
    
    const now = this.audioContext.currentTime;
    const minInterval = 1 / (this.grainDensity * this.audioEngine.globalGrainDensity * 10);
    if (now - this.lastGrainTime < minInterval) {
      grain.active = false;
      return;
    }
    
    const audioGrain = this.createGrainOptimized(grain, effectiveSize);
    if (audioGrain) {
      this.activeGrains.add(audioGrain);
      this.lastGrainTime = now;
      setTimeout(() => {
        this.activeGrains.delete(audioGrain);
        grain.active = false;
      }, (grain.duration * 1000) + 100);
    } else {
      grain.active = false;
    }
  }
  
  // Optimized grain creation
  createGrainOptimized(grainParams, grainSize) {
    if (!this.audioBuffer) return null;
    
    const now = this.audioContext.currentTime;
    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;
    
    const pitchMultiplier = Math.pow(2, grainParams.pitchShift / 12);
    source.playbackRate.value = pitchMultiplier;
    
    const envelope = this.audioContext.createGain();
    envelope.gain.value = 0;
    
    const grainPanner = this.audioContext.createStereoPanner();
    grainPanner.pan.value = Math.max(-1, Math.min(1, grainParams.pan));
    
    source.connect(envelope);
    envelope.connect(grainPanner);
    grainPanner.connect(this.panner);
    
    const grainDuration = grainParams.duration;
    const fadeTime = Math.min(this.fadeLength, grainDuration / 4);
    const peakGain = grainParams.volume * 0.5;
    
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(peakGain, now + fadeTime);
    envelope.gain.setValueAtTime(peakGain, now + grainDuration - fadeTime);
    envelope.gain.linearRampToValueAtTime(0, now + grainDuration);
    
    source.start(now, grainParams.sampleOffset, grainDuration);
    source.stop(now + grainDuration);
    
    source.envelope = envelope;
    source.panner = grainPanner;
    source.onended = () => {
      try {
        envelope.disconnect();
        grainPanner.disconnect();
      } catch (e) {}
    };
    
    return source;
  }
  
  scheduleGrain(params, effectiveSize) {
    const now = this.audioContext.currentTime;
    
    // Limit grain scheduling rate
    if (now - this.lastGrainTime < 1 / (this.grainDensity * 10)) {
      return;
    }
    
    // Check if we've hit the grain limit
    if (this.activeGrains.size >= this.maxGrainsPerSpecies) {
      // Remove oldest grain
      const oldest = this.activeGrains.values().next().value;
      if (oldest) {
        oldest.stop();
        this.activeGrains.delete(oldest);
      }
    }
    
    // Create grain
    const grain = this.createGrain(params, effectiveSize);
    if (grain) {
      this.activeGrains.add(grain);
      this.lastGrainTime = now;
      
      // Auto-remove after grain finishes
      setTimeout(() => {
        this.activeGrains.delete(grain);
      }, params.duration + 100);
    }
  }
  
  createGrain(params, grainSize) {
    if (!this.audioBuffer) return null;
    
    const now = this.audioContext.currentTime;
    
    // Create buffer source
    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;
    
    // Set loop mode
    if (this.loopMode === 'reverse') {
      source.playbackRate.value = -Math.abs(source.playbackRate.value);
    }
    
    // Apply pitch shift and detune
    const pitchMultiplier = Math.pow(2, params.pitchShift / 12);
    source.playbackRate.value = pitchMultiplier;
    source.detune.value = params.detune;
    
    // Create grain envelope
    const envelope = this.audioContext.createGain();
    envelope.gain.value = 0;
    
    // Create grain panner
    const grainPanner = this.audioContext.createStereoPanner();
    grainPanner.pan.value = Math.max(-1, Math.min(1, params.pan));
    
    // Connect nodes
    source.connect(envelope);
    envelope.connect(grainPanner);
    grainPanner.connect(this.panner);
    
    // Calculate grain timing
    const grainDuration = Math.min(params.duration || grainSize, 
      this.audioBuffer.duration * 1000) / 1000;
    const fadeTime = Math.min(this.fadeLength, grainDuration / 4);
    
    // Apply envelope
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(params.volume * 0.5, now + fadeTime);
    envelope.gain.setValueAtTime(params.volume * 0.5, 
      now + grainDuration - fadeTime);
    envelope.gain.linearRampToValueAtTime(0, now + grainDuration);
    
    // Start and stop grain
    const startOffset = params.startTime;
    source.start(now, startOffset, grainDuration);
    source.stop(now + grainDuration);
    
    // Store reference for cleanup
    source.envelope = envelope;
    source.panner = grainPanner;
    source.onended = () => {
      envelope.disconnect();
      grainPanner.disconnect();
      this.activeGrains.delete(source);
    };
    
    return source;
  }
  
  // Audio buffer management
  async loadSample(audioBuffer, sampleName, samplePath) {
    this.audioBuffer = audioBuffer;
    this.sampleName = sampleName;
    this.samplePath = samplePath;
    
    // Sample loaded for species
  }
  
  clearSample() {
    this.audioBuffer = null;
    this.sampleName = null;
    this.samplePath = null;
    
    // Stop all active grains
    this.activeGrains.forEach(grain => {
      try {
        grain.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    this.activeGrains.clear();
  }
  
  // Parameter setters
  setVolume(dbValue) {
    this.volume = Math.max(-60, Math.min(6, dbValue));
    const linearValue = this.dbToLinear(this.volume);
    this.outputGain.gain.exponentialRampToValueAtTime(
      linearValue,
      this.audioContext.currentTime + 0.05
    );
  }
  
  setPan(value) {
    this.pan = Math.max(-1, Math.min(1, value));
    this.panner.pan.linearRampToValueAtTime(
      this.pan,
      this.audioContext.currentTime + 0.05
    );
  }
  
  setMute(muted) {
    this.mute = muted;
    if (muted) {
      this.outputGain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.audioContext.currentTime + 0.05
      );
    } else {
      this.setVolume(this.volume);
    }
  }
  
  setSolo(soloed) {
    this.solo = soloed;
    // Solo logic handled by the parent synthesizer manager
  }
  
  setGrainSize(ms) {
    this.grainSize = Math.max(10, Math.min(500, ms));
  }
  
  setGrainDensity(grainsPerSecond) {
    this.grainDensity = Math.max(1, Math.min(100, grainsPerSecond));
  }
  
  setGrainOverlap(ratio) {
    this.grainOverlap = Math.max(0.1, Math.min(0.9, ratio));
  }
  
  setPitchShift(semitones) {
    this.pitchShift = Math.max(-24, Math.min(24, semitones));
  }
  
  setDetune(cents) {
    this.detune = Math.max(0, Math.min(100, cents));
  }
  
  setSampleRange(start, end) {
    this.sampleStart = Math.max(0, Math.min(1, start));
    this.sampleEnd = Math.max(this.sampleStart, Math.min(1, end));
  }
  
  setLoopMode(mode) {
    if (['forward', 'reverse', 'alternate'].includes(mode)) {
      this.loopMode = mode;
    }
  }
  
  setFilterEnabled(enabled) {
    this.filterEnabled = enabled;
    this.reconnectNodes();
  }
  
  setFilterSettings(type, frequency, resonance) {
    if (this.filter) {
      this.filter.type = type;
      this.filter.frequency.value = frequency;
      this.filter.Q.value = resonance;
    }
  }
  
  // Utility
  dbToLinear(db) {
    return Math.pow(10, db / 20);
  }
  
  getState() {
    return {
      sampleName: this.sampleName,
      grainSize: this.grainSize,
      grainDensity: this.grainDensity,
      grainOverlap: this.grainOverlap,
      pitchShift: this.pitchShift,
      detune: this.detune,
      volume: this.volume,
      mute: this.mute,
      solo: this.solo,
      pan: this.pan,
      loopMode: this.loopMode,
      sampleStart: this.sampleStart,
      sampleEnd: this.sampleEnd,
      filterEnabled: this.filterEnabled,
      activeGrains: this.activeGrains.size
    };
  }
  
  destroy() {
    // Stop all grains
    this.activeGrains.forEach(grain => {
      try {
        grain.stop();
      } catch (e) {
        // Ignore
      }
    });
    this.activeGrains.clear();
    
    // Disconnect nodes
    if (this.outputGain) {
      this.outputGain.disconnect();
    }
    if (this.panner) {
      this.panner.disconnect();
    }
    if (this.filter) {
      this.filter.disconnect();
    }
  }
}