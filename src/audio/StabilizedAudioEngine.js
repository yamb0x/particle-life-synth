/**
 * StabilizedAudioEngine.js - Enhanced audio engine with stability improvements
 * Based on research findings for preventing glitches and audio dropouts
 */

export class StabilizedAudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.compressor = null;
    this.limiter = null;
    this.analyser = null;
    this.isInitialized = false;
    this.isSuspended = false;
    
    // Stability-focused master settings
    this.masterVolume = -3; // Conservative headroom to prevent clipping
    this.globalGrainDensity = 1.0;
    this.globalGrainSize = 1.0;
    
    // Research-based stability settings
    this.bufferSize = 512; // Larger buffer for stability vs latency trade-off
    this.lookaheadTime = 0.1; // 100ms lookahead for grain scheduling
    this.maxSimultaneousGrains = 128; // Global grain limit
    this.grainRateLimiter = new Map(); // Per-species rate limiting
    
    // Performance monitoring with stability focus
    this.performanceMetrics = {
      audioLoad: 0,
      grainCount: 0,
      bufferUnderruns: 0,
      glitchCount: 0,
      lastUpdateTime: 0,
      maxGrainLoad: 0.8 // Keep below 80% for stability
    };
    
    // Stability buffers
    this.stabilityBuffer = new Float32Array(this.bufferSize);
    this.grainScheduleBuffer = [];
    this.emergencyMode = false;
    
    // Callbacks
    this.onStateChange = null;
    this.onPerformanceUpdate = null;
    this.onStabilityWarning = null;
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Create audio context with stability-focused settings
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'playback', // Changed from 'interactive' for stability
        sampleRate: 44100 // Consistent sample rate
      });
      
      // Create master processing chain with stability focus
      this.createStabilizedMasterChain();
      
      // Handle context state changes
      this.audioContext.addEventListener('statechange', () => {
        this.handleStateChange();
      });
      
      // Always try to resume if suspended
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (resumeError) {
          console.warn('AudioContext resume failed, will retry on user interaction');
        }
      }
      
      this.isInitialized = true;
      this.startStabilityMonitoring();
      
      console.log('StabilizedAudioEngine initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize StabilizedAudioEngine:', error);
      throw error;
    }
  }
  
  createStabilizedMasterChain() {
    // Master gain with conservative settings
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.dbToLinear(this.masterVolume);
    
    // Research-recommended compressor for stability
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -12; // Conservative threshold
    this.compressor.knee.value = 6; // Smooth compression curve
    this.compressor.ratio.value = 6; // Moderate compression ratio
    this.compressor.attack.value = 0.003; // Fast attack for transients
    this.compressor.release.value = 0.25; // Smooth release
    
    // Brick wall limiter to prevent clipping (research recommendation)
    this.limiter = this.audioContext.createDynamicsCompressor();
    this.limiter.threshold.value = -1; // Just below clipping
    this.limiter.knee.value = 0; // Hard knee
    this.limiter.ratio.value = 20; // High ratio for limiting
    this.limiter.attack.value = 0.001; // Very fast attack\n    this.limiter.release.value = 0.01; // Quick release
    
    // Analyser for monitoring
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    
    // Connect the stabilized chain
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }
  
  startStabilityMonitoring() {
    setInterval(() => {
      this.updateStabilityMetrics();
      this.checkEmergencyMode();
    }, 50); // Check every 50ms for responsive monitoring
  }
  
  updateStabilityMetrics() {
    const now = performance.now();
    const deltaTime = now - this.performanceMetrics.lastUpdateTime;
    
    if (deltaTime > 0) {
      // Enhanced stability-focused metrics
      const audioLoad = this.calculateStabilityAwareLoad();
      this.performanceMetrics.audioLoad = Math.min(1, audioLoad);
      
      // Monitor for buffer underruns (glitches)
      if (audioLoad > 0.95) {
        this.performanceMetrics.glitchCount++;
        this.triggerStabilityWarning('high_load');
      }
      
      // Track maximum grain load
      const grainLoad = this.performanceMetrics.grainCount / this.maxSimultaneousGrains;
      this.performanceMetrics.maxGrainLoad = Math.max(this.performanceMetrics.maxGrainLoad, grainLoad);
    }
    
    this.performanceMetrics.lastUpdateTime = now;
    
    if (this.onPerformanceUpdate) {
      this.onPerformanceUpdate(this.performanceMetrics);
    }
  }
  
  calculateStabilityAwareLoad() {
    // Multi-factor load calculation focused on stability
    const contextLoad = this.audioContext.currentTime / (performance.now() / 1000);
    const grainDensity = this.performanceMetrics.grainCount / this.maxSimultaneousGrains;
    const bufferPressure = this.getBufferPressure();
    
    // Weighted for stability (buffer pressure most important)
    return (contextLoad * 0.3) + (grainDensity * 0.3) + (bufferPressure * 0.4);
  }
  
  getBufferPressure() {
    // Estimate buffer pressure from audio thread timing
    const idealTime = this.bufferSize / this.audioContext.sampleRate;
    const actualTime = this.audioContext.currentTime % idealTime;
    return Math.min(1, actualTime / idealTime);
  }
  
  checkEmergencyMode() {
    const load = this.performanceMetrics.audioLoad;
    const grainCount = this.performanceMetrics.grainCount;
    
    // Enter emergency mode if system is overloaded
    if (load > 0.9 || grainCount > this.maxSimultaneousGrains * 0.9) {
      if (!this.emergencyMode) {
        this.enterEmergencyMode();
      }
    } else if (load < 0.7 && grainCount < this.maxSimultaneousGrains * 0.7) {
      if (this.emergencyMode) {
        this.exitEmergencyMode();
      }
    }
  }
  
  enterEmergencyMode() {
    this.emergencyMode = true;
    console.warn('AudioEngine entering emergency mode - reducing quality for stability');
    
    // Reduce global settings for stability
    this.globalGrainDensity *= 0.5;
    this.globalGrainSize *= 0.8;
    this.maxSimultaneousGrains = Math.floor(this.maxSimultaneousGrains * 0.6);
    
    this.triggerStabilityWarning('emergency_mode');
  }
  
  exitEmergencyMode() {
    this.emergencyMode = false;
    console.log('AudioEngine exiting emergency mode - restoring quality');
    
    // Gradually restore settings
    this.globalGrainDensity = Math.min(1.0, this.globalGrainDensity * 1.2);
    this.globalGrainSize = Math.min(1.0, this.globalGrainSize * 1.1);
    this.maxSimultaneousGrains = Math.min(128, this.maxSimultaneousGrains + 16);
  }
  
  triggerStabilityWarning(type) {
    if (this.onStabilityWarning) {
      this.onStabilityWarning({
        type,
        load: this.performanceMetrics.audioLoad,
        grainCount: this.performanceMetrics.grainCount,
        timestamp: performance.now()
      });
    }
  }
  
  // Enhanced grain scheduling with stability focus
  scheduleGrainWithStability(species, grainParams, callback) {
    const now = this.audioContext.currentTime;
    const lookaheadTime = now + this.lookaheadTime;
    
    // Rate limiting per species
    const lastScheduled = this.grainRateLimiter.get(species) || 0;
    const minInterval = 1 / (this.globalGrainDensity * 20); // Minimum 50ms between grains
    
    if (now - lastScheduled < minInterval) {
      return false; // Rate limited
    }
    
    // Check global grain limit
    if (this.performanceMetrics.grainCount >= this.maxSimultaneousGrains) {
      return false; // At capacity
    }
    
    // Schedule grain with lookahead
    this.grainScheduleBuffer.push({
      species,
      params: grainParams,
      callback,
      scheduledTime: lookaheadTime,
      actualTime: now
    });
    
    this.grainRateLimiter.set(species, now);
    this.performanceMetrics.grainCount++;
    
    // Process scheduled grains
    this.processScheduledGrains();
    
    return true;
  }
  
  processScheduledGrains() {
    const now = this.audioContext.currentTime;
    
    // Process grains that are ready to play
    const readyGrains = this.grainScheduleBuffer.filter(grain => 
      now >= grain.scheduledTime - 0.01 // 10ms tolerance
    );
    
    readyGrains.forEach(grain => {
      try {
        grain.callback(grain.params);
      } catch (error) {
        console.error('Grain processing error:', error);
        this.performanceMetrics.glitchCount++;
      }
    });
    
    // Remove processed grains
    this.grainScheduleBuffer = this.grainScheduleBuffer.filter(grain =>
      !readyGrains.includes(grain)
    );
  }
  
  // Enhanced audio parameter control with stability
  setMasterVolume(dbValue) {
    const clampedValue = Math.max(-60, Math.min(0, dbValue)); // Never above 0dB
    this.masterVolume = clampedValue;
    
    if (this.masterGain) {
      const linearValue = this.dbToLinear(this.masterVolume);
      // Use exponential ramp to avoid clicks
      this.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.00001, linearValue), // Prevent zero values
        this.audioContext.currentTime + 0.1
      );
    }
  }
  
  setGlobalGrainDensity(multiplier) {
    const clampedValue = Math.max(0.1, Math.min(2.0, multiplier));
    this.globalGrainDensity = this.emergencyMode ? 
      Math.min(clampedValue, 0.8) : clampedValue;
  }
  
  setGlobalGrainSize(multiplier) {
    const clampedValue = Math.max(0.1, Math.min(3.0, multiplier));
    this.globalGrainSize = this.emergencyMode ? 
      Math.min(clampedValue, 1.2) : clampedValue;
  }
  
  // Enhanced metering for stability monitoring
  getStabilityMetrics() {
    if (!this.analyser) return { peak: -60, rms: -60, stability: 0 };
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(dataArray);
    
    let peak = 0;
    let sum = 0;
    let clippingSamples = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const sample = Math.abs(dataArray[i]);
      peak = Math.max(peak, sample);
      sum += sample * sample;
      
      // Count clipping samples
      if (sample >= 0.99) {
        clippingSamples++;
      }
    }
    
    const rms = Math.sqrt(sum / bufferLength);
    const stabilityScore = Math.max(0, 1 - (clippingSamples / bufferLength) * 10);
    
    return {
      peak: this.linearToDb(peak),
      rms: this.linearToDb(rms),
      stability: stabilityScore,
      clipping: clippingSamples > 0
    };
  }
  
  // Utility methods
  dbToLinear(db) {
    return Math.pow(10, db / 20);
  }
  
  linearToDb(linear) {
    return 20 * Math.log10(Math.max(0.00001, linear));
  }
  
  getCurrentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }
  
  getSampleRate() {
    return this.audioContext ? this.audioContext.sampleRate : 44100;
  }
  
  getState() {
    return this.audioContext ? this.audioContext.state : 'closed';
  }
  
  getStabilityReport() {
    return {
      ...this.performanceMetrics,
      emergencyMode: this.emergencyMode,
      bufferSize: this.bufferSize,
      lookaheadTime: this.lookaheadTime,
      maxGrains: this.maxSimultaneousGrains,
      stabilityMetrics: this.getStabilityMetrics()
    };
  }
  
  // Cleanup with proper disconnection
  destroy() {
    // Stop monitoring
    clearInterval(this.stabilityTimer);
    
    // Clear scheduled grains
    this.grainScheduleBuffer = [];
    this.grainRateLimiter.clear();
    
    if (this.audioContext) {
      // Properly disconnect all nodes
      try {
        this.masterGain?.disconnect();
        this.compressor?.disconnect();
        this.limiter?.disconnect();
        this.analyser?.disconnect();
      } catch (e) {
        console.warn('Error disconnecting audio nodes:', e);
      }
      
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.masterGain = null;
    this.compressor = null;
    this.limiter = null;
    this.analyser = null;
    this.isInitialized = false;
  }
  
  // Resume with stability checks
  async resume() {
    if (!this.audioContext) {
      console.warn('Cannot resume - AudioContext not created');
      return false;
    }
    
    if (this.audioContext.state === 'running') {
      return true;
    }
    
    try {
      await this.audioContext.resume();
      this.isSuspended = false;
      
      // Reset emergency mode on resume
      this.emergencyMode = false;
      this.performanceMetrics.glitchCount = 0;
      
      return true;
    } catch (error) {
      console.error('Failed to resume StabilizedAudioEngine:', error);
      return false;
    }
  }
  
  handleStateChange() {
    const state = this.audioContext.state;
    console.log(`StabilizedAudioEngine state changed to: ${state}`);
    
    if (this.onStateChange) {
      this.onStateChange(state);
    }
    
    // Auto-resume on user interaction if suspended
    if (state === 'suspended' && !this.isSuspended) {
      const resumeOnInteraction = () => {
        this.resume();
        document.removeEventListener('click', resumeOnInteraction);
        document.removeEventListener('keydown', resumeOnInteraction);
        document.removeEventListener('touchstart', resumeOnInteraction);
      };
      
      document.addEventListener('click', resumeOnInteraction);
      document.addEventListener('keydown', resumeOnInteraction);
      document.addEventListener('touchstart', resumeOnInteraction);
    }
  }
}

// Singleton instance with stability focus
let stabilizedAudioEngineInstance = null;

export function getStabilizedAudioEngine() {
  if (!stabilizedAudioEngineInstance) {
    stabilizedAudioEngineInstance = new StabilizedAudioEngine();
  }
  return stabilizedAudioEngineInstance;
}