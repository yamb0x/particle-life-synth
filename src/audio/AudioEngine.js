/**
 * AudioEngine.js - Main audio context manager and orchestrator
 * Manages WebAudio context, master gain, and audio processing chain
 */

export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.compressor = null;
    this.limiter = null;
    this.analyser = null;
    this.isInitialized = false;
    this.isSuspended = false;
    
    // Master settings
    this.masterVolume = 0; // dB (full volume, was -6dB)
    this.globalGrainDensity = 1.0; // Multiplier
    this.globalGrainSize = 1.0; // Multiplier
    
    // Research-based granular settings
    this.adaptiveGrainLimiting = true; // Adaptive grain count management
    this.grainPoolingEnabled = true; // Object pooling for performance
    this.envelopeCaching = true; // Pre-computed envelope curves
    this.unifiedScheduling = true; // Bencina's unified approach
    
    // Performance monitoring
    this.performanceMetrics = {
      audioLoad: 0,
      grainCount: 0,
      bufferUnderruns: 0,
      lastUpdateTime: 0
    };
    
    // Callbacks
    this.onStateChange = null;
    this.onPerformanceUpdate = null;
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Create audio context with optimal settings
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 44100
      });
      
      // AudioContext created
      
      // Create master processing chain
      this.createMasterChain();
      
      // Handle context state changes
      this.audioContext.addEventListener('statechange', () => {
        this.handleStateChange();
      });
      
      // Always try to resume if suspended (Chrome autoplay policy)
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (resumeError) {
          // Will resume on next user interaction
        }
      }
      
      this.isInitialized = true;
      this.startPerformanceMonitoring();
      
      // AudioEngine initialized
      
      // Return success even if suspended (will resume on interaction)
      return true;
      
    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error);
      throw error;
    }
  }
  
  createMasterChain() {
    // Master gain control
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.dbToLinear(this.masterVolume);
    
    // Compressor for dynamics control
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 5;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.1;
    
    // Limiter (another compressor with extreme settings)
    this.limiter = this.audioContext.createDynamicsCompressor();
    this.limiter.threshold.value = -0.3;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = 0.01;
    
    // Analyser for metering
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    
    // Connect the chain
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }
  
  async resume() {
    if (!this.audioContext) {
      console.warn('Cannot resume - AudioContext not created');
      return false;
    }
    
    if (this.audioContext.state === 'running') {
      // AudioContext already running
      return true;
    }
    
    try {
      await this.audioContext.resume();
      this.isSuspended = false;
      return true;
    } catch (error) {
      console.error('Failed to resume AudioEngine:', error);
      return false;
    }
  }
  
  suspend() {
    if (!this.audioContext || this.audioContext.state === 'suspended') return;
    
    this.audioContext.suspend();
    this.isSuspended = true;
    // AudioEngine suspended
  }
  
  handleStateChange() {
    const state = this.audioContext.state;
    // AudioContext state changed
    
    if (this.onStateChange) {
      this.onStateChange(state);
    }
    
    // Auto-resume on user interaction if suspended
    if (state === 'suspended' && !this.isSuspended) {
      const resumeOnInteraction = () => {
        this.resume();
        document.removeEventListener('click', resumeOnInteraction);
        document.removeEventListener('keydown', resumeOnInteraction);
      };
      
      document.addEventListener('click', resumeOnInteraction);
      document.addEventListener('keydown', resumeOnInteraction);
    }
  }
  
  // Audio parameter control methods
  setMasterVolume(dbValue) {
    this.masterVolume = Math.max(-60, Math.min(6, dbValue));
    if (this.masterGain) {
      const linearValue = this.dbToLinear(this.masterVolume);
      this.masterGain.gain.exponentialRampToValueAtTime(
        linearValue,
        this.audioContext.currentTime + 0.05
      );
    }
  }
  
  setGlobalGrainDensity(multiplier) {
    this.globalGrainDensity = Math.max(0.1, Math.min(5.0, multiplier));
  }
  
  setGlobalGrainSize(multiplier) {
    this.globalGrainSize = Math.max(0.1, Math.min(5.0, multiplier));
  }
  
  setCompressorSettings(settings) {
    if (!this.compressor) return;
    
    if (settings.threshold !== undefined) {
      this.compressor.threshold.value = settings.threshold;
    }
    if (settings.ratio !== undefined) {
      this.compressor.ratio.value = settings.ratio;
    }
    if (settings.knee !== undefined) {
      this.compressor.knee.value = settings.knee;
    }
    if (settings.attack !== undefined) {
      this.compressor.attack.value = settings.attack / 1000; // Convert ms to seconds
    }
    if (settings.release !== undefined) {
      this.compressor.release.value = settings.release / 1000;
    }
  }
  
  setLimiterSettings(settings) {
    if (!this.limiter) return;
    
    if (settings.ceiling !== undefined) {
      this.limiter.threshold.value = settings.ceiling;
    }
    if (settings.lookahead !== undefined) {
      // WebAudio doesn't have lookahead, but we can adjust attack
      this.limiter.attack.value = settings.lookahead / 1000;
    }
  }
  
  // Metering and monitoring
  getLevel() {
    if (!this.analyser) return { peak: -60, rms: -60 };
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(dataArray);
    
    let peak = 0;
    let sum = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const sample = Math.abs(dataArray[i]);
      peak = Math.max(peak, sample);
      sum += sample * sample;
    }
    
    const rms = Math.sqrt(sum / bufferLength);
    
    return {
      peak: this.linearToDb(peak),
      rms: this.linearToDb(rms)
    };
  }
  
  startPerformanceMonitoring() {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 100); // Update every 100ms
  }
  
  updatePerformanceMetrics() {
    const now = performance.now();
    const deltaTime = now - this.performanceMetrics.lastUpdateTime;
    
    if (deltaTime > 0) {
      // Calculate audio load based on context timing
      const audioLoad = this.audioContext.currentTime / (now / 1000);
      this.performanceMetrics.audioLoad = Math.min(1, audioLoad);
    }
    
    this.performanceMetrics.lastUpdateTime = now;
    
    if (this.onPerformanceUpdate) {
      this.onPerformanceUpdate(this.performanceMetrics);
    }
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
  
  // Cleanup
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.masterGain = null;
    this.compressor = null;
    this.limiter = null;
    this.analyser = null;
    this.isInitialized = false;
  }
}

// Singleton instance
let audioEngineInstance = null;

export function getAudioEngine() {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}