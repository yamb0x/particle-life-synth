/**
 * AudioSystem.js - Main audio system orchestrator
 * Coordinates all audio components and provides unified interface
 */

import { getAudioEngine } from './AudioEngine.js';
import { GranularSynth } from './GranularSynth.js';
import { SamplingArea } from './SamplingArea.js';
import { DecoupledAudioBridge } from './DecoupledAudioBridge.js';
import { IntelligentSampler } from './IntelligentSampler.js';
import { GrainOrganizer } from './GrainOrganizer.js';
import { SampleManager } from './SampleManager.js';

export class AudioSystem {
  constructor() {
    // Core components
    this.audioEngine = null;
    this.sampleManager = null;
    this.samplingArea = null;
    this.audioBridge = null;
    this.intelligentSampler = null;
    this.grainOrganizer = null;
    
    // Species synthesizers
    this.synthesizers = new Map(); // species index -> GranularSynth
    this.maxSpecies = 10; // Support up to 10 species
    
    // Canvas dimensions
    this.canvasWidth = 800;
    this.canvasHeight = 600;
    
    // Audio state
    this.isInitialized = false;
    this.isPlaying = false;
    this.isMuted = false;
    
    // Performance mode
    this.performanceMode = 'balanced';
    this.qualityPresets = {
      ultra: { maxGrains: 256, sampleRate: 48000, quality: 'high' },
      high: { maxGrains: 192, sampleRate: 44100, quality: 'high' },
      balanced: { maxGrains: 128, sampleRate: 44100, quality: 'medium' },
      performance: { maxGrains: 64, sampleRate: 22050, quality: 'low' },
      emergency: { maxGrains: 32, sampleRate: 22050, quality: 'minimal' }
    };
    
    // Callbacks
    this.onInitialized = null;
    this.onStateChange = null;
    this.onPerformanceUpdate = null;
    
    // Audio processing state
    this.lastProcessTime = 0;
    this.processInterval = 16.67; // 60Hz
  }
  
  /**
   * Initialize the audio system
   */
  async initialize(canvasWidth = 800, canvasHeight = 600) {
    if (this.isInitialized) {
      console.warn('AudioSystem already initialized');
      return true;
    }
    
    // AudioSystem initialization started
    
    try {
      // Update canvas dimensions
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      
      // Initialize audio engine
      // Getting audio engine
      this.audioEngine = getAudioEngine();
      
      // Initializing audio engine
      await this.audioEngine.initialize();
      
      // Initialize sample manager
      // Initializing sample manager
      this.sampleManager = new SampleManager(this.audioEngine);
      
      // Set up callback to assign samples to synthesizers when loaded
      this.sampleManager.onSampleLoaded = (speciesIndex, sampleName, audioBuffer) => {
        // Sample loaded for species ${speciesIndex}
        // Defer assignment to ensure synthesizer exists
        setTimeout(() => {
          const synth = this.synthesizers.get(speciesIndex);
          if (synth) {
            // Assigning sample to synthesizer
            synth.loadSample(audioBuffer, sampleName, this.sampleManager.stemsPath + sampleName)
              .then(() => {
                // Species ready with sample
              })
              .catch(err => {
                console.error(`Failed to assign sample to species ${speciesIndex}:`, err);
              });
          } else {
            // Synthesizer not found yet, will retry...
            // Retry after a short delay
            setTimeout(() => {
              const retrySynth = this.synthesizers.get(speciesIndex);
              if (retrySynth) {
                retrySynth.loadSample(audioBuffer, sampleName, this.sampleManager.stemsPath + sampleName);
              }
            }, 500);
          }
        }, 10);
      };
      
      await this.sampleManager.initialize();
      // Sample manager initialized
      
      // Initialize sampling area
      // Initializing sampling area
      this.samplingArea = new SamplingArea(canvasWidth, canvasHeight);
      
      // Initialize audio bridge
      // Initializing audio bridge
      this.audioBridge = new DecoupledAudioBridge();
      
      // Initialize intelligent sampler
      // Initializing intelligent sampler
      this.intelligentSampler = new IntelligentSampler(canvasWidth, canvasHeight);
      
      // Initialize grain organizer
      // Initializing grain organizer
      this.grainOrganizer = new GrainOrganizer();
      
      // Create initial synthesizers
      // Creating initial synthesizers for 4 species
      await this.createSynthesizers(4);
      
      // Start audio update loop
      // Starting audio processing loop
      this.startAudioProcessing();
      
      this.isInitialized = true;
      this.isPlaying = true;
      
      // AudioSystem initialized
      const contextState = this.audioEngine.audioContext.state;
      if (contextState === 'suspended') {
        console.log('Audio initialized but needs user interaction to start');
      }
      
      if (this.onInitialized) {
        this.onInitialized();
      }
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      return true;
      
    } catch (error) {
      console.error('AudioSystem initialization failed:', error.message);
      this.isInitialized = false;
      throw error;
    }
  }
  
  /**
   * Create synthesizers for species
   */
  async createSynthesizers(count) {
    for (let i = 0; i < count; i++) {
      if (!this.synthesizers.has(i)) {
        const synth = new GranularSynth(this.audioEngine, i);
        this.synthesizers.set(i, synth);
        
        // Don't wait for sample loading during initialization
        // Check if sample is already loaded (from background loading)
        const sampleData = this.sampleManager.getSampleForSpecies(i);
        if (sampleData && sampleData.buffer) {
          // Load sample asynchronously without waiting
          synth.loadSample(
            sampleData.buffer,
            sampleData.name,
            sampleData.path
          ).catch(err => {
            console.warn(`Failed to load sample for species ${i}:`, err);
          });
        }
      }
    }
    
    // Created synthesizers
  }
  
  /**
   * Start audio processing loop
   */
  startAudioProcessing() {
    // Start decoupled audio updates
    this.audioBridge.startAudioUpdates((audioData) => {
      this.processAudioFrame(audioData);
    });
  }
  
  /**
   * Process audio frame with particle data
   */
  processAudioFrame(audioData) {
    if (!this.isPlaying || this.isMuted || !audioData) {
      return;
    }
    
    const now = performance.now();
    
    // Throttle processing
    if (now - this.lastProcessTime < this.processInterval) {
      return;
    }
    
    this.lastProcessTime = now;
    
    // Debug: Log if we have data
    if (!audioData.particlesBySpecies || audioData.particlesBySpecies.size === 0) {
      // No particles to process
      return;
    }
    
    // Process each species
    for (const [species, particles] of audioData.particlesBySpecies) {
      const synth = this.synthesizers.get(species);
      
      if (synth && !synth.mute) {
        // Check if synth has a sample loaded
        if (!synth.audioBuffer) {
          // No sample loaded for this species - can't generate audio
          continue;
        }
        
        // Organize grains based on current mode
        const organized = this.grainOrganizer.organizeGrains(
          particles,
          { width: this.canvasWidth, height: this.canvasHeight },
          synth.audioBuffer
        );
        
        // Process organized grains
        if (organized && organized.length > 0) {
          synth.processParticles(
            organized.map(o => o.particle),
            { width: this.canvasWidth, height: this.canvasHeight },
            this.grainOrganizer.mode
          );
        }
      }
    }
  }
  
  /**
   * Update particle data from particle system
   * Called at particle FPS (5-60 Hz)
   */
  updateParticles(particles) {
    if (!this.isInitialized) return;
    
    // Build spatial grid for efficient lookups
    this.intelligentSampler.buildSpatialGrid(particles);
    
    // Get particles in sampling area
    const particlesInArea = this.intelligentSampler.getParticlesInCircle(
      this.samplingArea.centerX * this.canvasWidth,
      this.samplingArea.centerY * this.canvasHeight,
      this.samplingArea.radius * Math.sqrt(
        this.canvasWidth * this.canvasWidth + 
        this.canvasHeight * this.canvasHeight
      )
    );
    
    // Apply adaptive sampling if needed
    const sampled = this.intelligentSampler.adaptiveSample(particlesInArea);
    
    // Update audio bridge with sampled particles
    this.audioBridge.updateFromParticles(sampled, this.samplingArea);
  }
  
  /**
   * Update canvas dimensions
   */
  updateDimensions(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    if (this.samplingArea) {
      this.samplingArea.updateDimensions(width, height);
    }
    
    if (this.intelligentSampler) {
      this.intelligentSampler.updateDimensions(width, height);
    }
  }
  
  /**
   * Draw sampling area overlay
   */
  drawOverlay(ctx) {
    if (this.samplingArea) {
      this.samplingArea.drawOverlay(ctx);
    }
  }
  
  // Control methods
  
  play() {
    this.isPlaying = true;
    if (this.audioEngine) {
      this.audioEngine.resume();
    }
  }
  
  pause() {
    this.isPlaying = false;
    if (this.audioEngine) {
      this.audioEngine.suspend();
    }
  }
  
  mute() {
    this.isMuted = true;
    if (this.audioEngine) {
      this.audioEngine.setMasterVolume(-60);
    }
  }
  
  unmute() {
    this.isMuted = false;
    if (this.audioEngine) {
      this.audioEngine.setMasterVolume(-6);
    }
  }
  
  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }
  
  // Parameter control
  
  setMasterVolume(dbValue) {
    if (this.audioEngine) {
      this.audioEngine.setMasterVolume(dbValue);
    }
  }
  
  setGlobalGrainDensity(multiplier) {
    if (this.audioEngine) {
      this.audioEngine.setGlobalGrainDensity(multiplier);
    }
  }
  
  setGlobalGrainSize(multiplier) {
    if (this.audioEngine) {
      this.audioEngine.setGlobalGrainSize(multiplier);
    }
  }
  
  setSamplingCenter(x, y) {
    if (this.samplingArea) {
      this.samplingArea.setCenter(x, y);
    }
  }
  
  setSamplingRadius(radius) {
    if (this.samplingArea) {
      this.samplingArea.setRadius(radius);
    }
  }
  
  setMaxParticles(max) {
    if (this.samplingArea) {
      this.samplingArea.maxParticles = max;
    }
  }
  
  setOrganizationMode(mode) {
    if (this.grainOrganizer) {
      this.grainOrganizer.setMode(mode);
    }
  }
  
  setOrganizationParams(params) {
    if (this.grainOrganizer) {
      this.grainOrganizer.setParams(params);
    }
  }
  
  // Species control
  
  getSynthesizer(speciesIndex) {
    return this.synthesizers.get(speciesIndex);
  }
  
  async loadSampleForSpecies(speciesIndex, sampleName) {
    const synth = this.synthesizers.get(speciesIndex);
    if (!synth) {
      await this.createSynthesizers(speciesIndex + 1);
    }
    
    const audioBuffer = await this.sampleManager.loadSampleForSpecies(
      speciesIndex,
      sampleName
    );
    
    if (audioBuffer && this.synthesizers.has(speciesIndex)) {
      await this.synthesizers.get(speciesIndex).loadSample(
        audioBuffer,
        sampleName,
        this.sampleManager.stemsPath + sampleName
      );
    }
  }
  
  async loadRandomSampleForSpecies(speciesIndex) {
    const synth = this.synthesizers.get(speciesIndex);
    if (!synth) {
      await this.createSynthesizers(speciesIndex + 1);
    }
    
    const audioBuffer = await this.sampleManager.loadRandomSampleForSpecies(
      speciesIndex
    );
    
    if (audioBuffer) {
      const sampleData = this.sampleManager.getSampleForSpecies(speciesIndex);
      if (sampleData && this.synthesizers.has(speciesIndex)) {
        await this.synthesizers.get(speciesIndex).loadSample(
          audioBuffer,
          sampleData.name,
          sampleData.path
        );
      }
    }
  }
  
  async randomizeAllSamples() {
    await this.sampleManager.randomizeAllSamples();
    
    // Update all synthesizers
    for (const [species, synth] of this.synthesizers) {
      const sampleData = this.sampleManager.getSampleForSpecies(species);
      if (sampleData) {
        await synth.loadSample(
          sampleData.buffer,
          sampleData.name,
          sampleData.path
        );
      }
    }
  }
  
  // Performance management
  
  setPerformanceMode(mode) {
    if (!this.qualityPresets[mode]) {
      console.warn('Invalid performance mode:', mode);
      return;
    }
    
    this.performanceMode = mode;
    const preset = this.qualityPresets[mode];
    
    // Update max grains per species
    for (const synth of this.synthesizers.values()) {
      synth.maxGrainsPerSpecies = preset.maxGrains / this.synthesizers.size;
    }
    
    // Update sampler settings
    if (mode === 'emergency') {
      this.intelligentSampler.adaptiveSampleSize = 50;
    } else if (mode === 'performance') {
      this.intelligentSampler.adaptiveSampleSize = 100;
    } else {
      this.intelligentSampler.adaptiveSampleSize = 200;
    }
    
    // Removed console log for performance mode
  }
  
  setupPerformanceMonitoring() {
    // Disabled automatic performance mode switching
    // Users can manually change performance mode if needed
    /*
    setInterval(() => {
      const metrics = this.getPerformanceMetrics();
      
      // Auto-adjust quality based on performance - DISABLED
      if (metrics.audioLoad > 0.8 || metrics.particleFPS < 10) {
        this.setPerformanceMode('emergency');
      } else if (metrics.audioLoad > 0.6 || metrics.particleFPS < 20) {
        this.setPerformanceMode('performance');
      } else if (metrics.audioLoad > 0.4 || metrics.particleFPS < 30) {
        this.setPerformanceMode('balanced');
      } else if (metrics.audioLoad < 0.2 && metrics.particleFPS > 45) {
        this.setPerformanceMode('high');
      }
    */
      
      // Keep performance metrics collection but don't auto-switch modes
      // if (this.onPerformanceUpdate) {
      //   this.onPerformanceUpdate(metrics);
      // }
    // }, 1000);
  }
  
  getPerformanceMetrics() {
    const engineMetrics = this.audioEngine ? 
      this.audioEngine.performanceMetrics : {};
    const bridgeMetrics = this.audioBridge ? 
      this.audioBridge.getPerformanceMetrics() : {};
    const samplerMetrics = this.intelligentSampler ? 
      this.intelligentSampler.getMetrics() : {};
    
    let totalActiveGrains = 0;
    for (const synth of this.synthesizers.values()) {
      totalActiveGrains += synth.activeGrains.size;
    }
    
    return {
      ...engineMetrics,
      ...bridgeMetrics,
      ...samplerMetrics,
      totalActiveGrains,
      performanceMode: this.performanceMode,
      synthesizers: this.synthesizers.size
    };
  }
  
  // Configuration save/load
  
  getConfig() {
    const config = {
      // Master settings
      masterVolume: this.audioEngine ? this.audioEngine.masterVolume : -6,
      globalGrainDensity: this.audioEngine ? this.audioEngine.globalGrainDensity : 1,
      globalGrainSize: this.audioEngine ? this.audioEngine.globalGrainSize : 1,
      
      // Sampling area
      samplingArea: this.samplingArea ? this.samplingArea.getConfig() : null,
      
      // Grain organization
      organizationMode: this.grainOrganizer ? this.grainOrganizer.mode : 'Direct (1:1)',
      organizationParams: this.grainOrganizer ? { ...this.grainOrganizer.params } : {},
      
      // Samples
      samples: this.sampleManager ? this.sampleManager.getSampleConfig() : [],
      
      // Species settings
      speciesSettings: []
    };
    
    // Get each species settings
    for (const [species, synth] of this.synthesizers) {
      config.speciesSettings.push({
        species,
        ...synth.getState()
      });
    }
    
    return config;
  }
  
  async loadConfig(config) {
    if (!config || !this.isInitialized) return;
    
    // Load master settings
    if (config.masterVolume !== undefined) {
      this.setMasterVolume(config.masterVolume);
    }
    if (config.globalGrainDensity !== undefined) {
      this.setGlobalGrainDensity(config.globalGrainDensity);
    }
    if (config.globalGrainSize !== undefined) {
      this.setGlobalGrainSize(config.globalGrainSize);
    }
    
    // Load sampling area
    if (config.samplingArea && this.samplingArea) {
      this.samplingArea.loadConfig(config.samplingArea);
    }
    
    // Load organization settings
    if (config.organizationMode) {
      this.setOrganizationMode(config.organizationMode);
    }
    if (config.organizationParams) {
      this.setOrganizationParams(config.organizationParams);
    }
    
    // Load samples
    if (config.samples && this.sampleManager) {
      await this.sampleManager.loadSampleConfig(config.samples);
      
      // Update synthesizers with loaded samples
      for (const item of config.samples) {
        const synth = this.synthesizers.get(item.species);
        const sampleData = this.sampleManager.getSampleForSpecies(item.species);
        
        if (synth && sampleData) {
          await synth.loadSample(
            sampleData.buffer,
            sampleData.name,
            sampleData.path
          );
        }
      }
    }
    
    // Load species settings
    if (config.speciesSettings) {
      for (const settings of config.speciesSettings) {
        const synth = this.synthesizers.get(settings.species);
        if (synth) {
          // Apply settings
          if (settings.grainSize !== undefined) synth.setGrainSize(settings.grainSize);
          if (settings.grainDensity !== undefined) synth.setGrainDensity(settings.grainDensity);
          if (settings.grainOverlap !== undefined) synth.grainOverlap = settings.grainOverlap;
          if (settings.pitchShift !== undefined) synth.setPitchShift(settings.pitchShift);
          if (settings.detune !== undefined) synth.setDetune(settings.detune);
          if (settings.volume !== undefined) synth.setVolume(settings.volume);
          if (settings.pan !== undefined) synth.setPan(settings.pan);
          if (settings.mute !== undefined) synth.setMute(settings.mute);
          if (settings.loopMode !== undefined) synth.setLoopMode(settings.loopMode);
          if (settings.sampleStart !== undefined && settings.sampleEnd !== undefined) {
            synth.setSampleRange(settings.sampleStart, settings.sampleEnd);
          }
        }
      }
    }
  }
  
  // Cleanup
  
  destroy() {
    // Stop audio processing
    if (this.audioBridge) {
      this.audioBridge.destroy();
    }
    
    // Destroy synthesizers
    for (const synth of this.synthesizers.values()) {
      synth.destroy();
    }
    this.synthesizers.clear();
    
    // Destroy audio engine
    if (this.audioEngine) {
      this.audioEngine.destroy();
    }
    
    this.isInitialized = false;
    this.isPlaying = false;
    
    console.log('AudioSystem destroyed');
  }
}

// Singleton instance
let audioSystemInstance = null;

export function getAudioSystem() {
  if (!audioSystemInstance) {
    audioSystemInstance = new AudioSystem();
  }
  return audioSystemInstance;
}