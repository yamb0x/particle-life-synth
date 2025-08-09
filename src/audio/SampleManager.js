/**
 * SampleManager.js - Audio sample loading and management
 * Handles loading samples from stems folder and managing sample buffers
 */

export class SampleManager {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.audioContext = audioEngine.audioContext;
    
    // Sample paths and cache
    this.stemsPath = 'stems/';
    this.sampleCache = new Map(); // path -> AudioBuffer
    this.availableSamples = [];
    this.loadedSamples = new Map(); // species -> { path, buffer, name }
    
    // Loading state
    this.isLoading = false;
    this.loadingProgress = 0;
    this.onLoadProgress = null;
    this.onSampleLoaded = null;
    
    // Default sample list (fallback if manifest not available)
    this.defaultSamples = [
      'ambient fiddle 01.wav',
      'ambient fiddle 02.wav',
      'ambient fiddle 03.wav',
      'ambient fiddle 04.wav',
      'ambient fiddle 06.wav',
      'ambient fiddle 07.wav',
      'ambient fiddle 13.wav',
      'ambient fiddle 14.wav',
      'ambient fiddle 15.wav',
      'ambient fiddle 16.wav',
      'ambient fiddle 20.wav',
      'Turbulent Beat (2).wav',
      'Nice Subtle Magic Drone.wav',
      'substonearp_arp_115bpm.wav',
      'substonearp_texture.wav'
    ];
  }
  
  /**
   * Initialize sample manager and load available samples
   */
  async initialize() {
    // Initializing SampleManager
    
    // Try to load manifest first
    try {
      await this.loadManifest();
    } catch (error) {
      console.warn('Could not load manifest, using default sample list:', error);
      this.availableSamples = [...this.defaultSamples];
    }
    
    // Don't pre-load samples during initialization - load them on demand
    // This reduces initial load time significantly
    // SampleManager initialized
    
    // Schedule sample loading after initialization to not block
    // Increased delay to ensure synthesizers are created first
    setTimeout(() => {
      // Start background sample loading for 4 species
      this.loadRandomSamplesForAllSpecies(4).catch(err => {
        console.error('Background sample loading failed:', err);
      });
    }, 500); // Increased from 100ms to 500ms to ensure synthesizers exist
  }
  
  /**
   * Load sample manifest from server
   */
  async loadManifest() {
    try {
      // Add cache-busting parameter to avoid loading old cached manifest
      const cacheBuster = `?v=${Date.now()}`;
      const response = await fetch(this.stemsPath + 'manifest.json' + cacheBuster);
      if (!response.ok) throw new Error('Manifest not found');
      
      const manifest = await response.json();
      this.availableSamples = manifest.files || [];
      
      // Loaded manifest with samples
      
      // Double-check we're not loading old data
      if (this.availableSamples.includes('ambient fiddle 08.wav')) {
        // Old manifest data detected, filtering...
        // Filter out non-existent files
        this.availableSamples = this.availableSamples.filter(file => 
          !file.includes('ambient fiddle 08') && 
          !file.includes('ambient fiddle 09') && 
          !file.includes('ambient fiddle 10') && 
          !file.includes('ambient fiddle 11') && 
          !file.includes('ambient fiddle 12') &&
          !file.includes('ambient fiddle 17') &&
          !file.includes('ambient fiddle 18') &&
          !file.includes('ambient fiddle 19') &&
          !file.includes('immune_01') &&
          !file.includes('immune_02')
        );
        // Filtered to valid samples
      }
    } catch (error) {
      console.warn('Could not load manifest, using default sample list:', error);
      // Use the corrected default list
      this.availableSamples = [...this.defaultSamples];
    }
  }
  
  /**
   * Scan stems folder for available samples
   */
  async scanStemsFolder() {
    // Try to fetch a known sample to test if stems folder exists
    try {
      const testResponse = await fetch(this.stemsPath + this.defaultSamples[0]);
      if (testResponse.ok) {
        // Stems folder exists, use default list
        this.availableSamples = [...this.defaultSamples];
      }
    } catch (error) {
      console.error('Could not access stems folder:', error);
      this.availableSamples = [];
    }
  }
  
  /**
   * Load a sample from URL
   */
  async loadSample(samplePath) {
    // Check cache first
    if (this.sampleCache.has(samplePath)) {
      return this.sampleCache.get(samplePath);
    }
    
    this.isLoading = true;
    
    try {
      // Properly encode the URL to handle spaces and special characters
      const encodedPath = encodeURI(samplePath);
      // Loading sample
      
      const response = await fetch(encodedPath);
      if (!response.ok) throw new Error(`Failed to load sample: ${samplePath}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Cache the decoded buffer
      this.sampleCache.set(samplePath, audioBuffer);
      
      // Sample loaded successfully
      
      return audioBuffer;
      
    } catch (error) {
      console.error('Error loading sample:', samplePath, error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Load a random sample for a species
   */
  async loadRandomSampleForSpecies(speciesIndex) {
    if (this.availableSamples.length === 0) {
      console.warn('No samples available');
      return null;
    }
    
    // Try up to 3 times to load a valid sample
    let attempts = 0;
    const maxAttempts = 3;
    const triedIndices = new Set();
    
    while (attempts < maxAttempts && triedIndices.size < this.availableSamples.length) {
      // Pick random sample that we haven't tried yet
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * this.availableSamples.length);
      } while (triedIndices.has(randomIndex) && triedIndices.size < this.availableSamples.length);
      
      triedIndices.add(randomIndex);
      const sampleName = this.availableSamples[randomIndex];
      const samplePath = this.stemsPath + sampleName;
      
      try {
        const audioBuffer = await this.loadSample(samplePath);
      
      // Store for this species
      this.loadedSamples.set(speciesIndex, {
        path: samplePath,
        buffer: audioBuffer,
        name: sampleName
      });
      
      if (this.onSampleLoaded) {
        this.onSampleLoaded(speciesIndex, sampleName, audioBuffer);
      }
      
      // Update waveform display in UI
      this.updateWaveformDisplay(speciesIndex, audioBuffer);
      
        return audioBuffer;
        
      } catch (error) {
        console.warn(`Attempt ${attempts + 1} failed for species ${speciesIndex}: ${sampleName}`);
        attempts++;
        
        // Remove non-existent sample from list
        if (error.message.includes('Failed to load')) {
          const index = this.availableSamples.indexOf(sampleName);
          if (index > -1) {
            this.availableSamples.splice(index, 1);
            // Removed non-existent sample
          }
        }
      }
    }
    
    console.error(`Failed to load any sample for species ${speciesIndex} after ${attempts} attempts`);
    return null;
  }
  
  /**
   * Load random samples for all species
   */
  async loadRandomSamplesForAllSpecies(speciesCount = 4) {
    const promises = [];
    
    for (let i = 0; i < speciesCount; i++) {
      promises.push(this.loadRandomSampleForSpecies(i));
    }
    
    const results = await Promise.allSettled(promises);
    
    const loaded = results.filter(r => r.status === 'fulfilled').length;
    // Loaded species samples
    
    return results;
  }
  
  /**
   * Load specific sample for a species
   */
  async loadSampleForSpecies(speciesIndex, sampleName) {
    const samplePath = this.stemsPath + sampleName;
    
    try {
      const audioBuffer = await this.loadSample(samplePath);
      
      this.loadedSamples.set(speciesIndex, {
        path: samplePath,
        buffer: audioBuffer,
        name: sampleName
      });
      
      if (this.onSampleLoaded) {
        this.onSampleLoaded(speciesIndex, sampleName, audioBuffer);
      }
      
      return audioBuffer;
      
    } catch (error) {
      console.error('Failed to load sample for species', speciesIndex, error);
      throw error;
    }
  }
  
  /**
   * Load sample from file input
   */
  async loadSampleFromFile(speciesIndex, file) {
    if (!file) return null;
    
    // Check file type
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/flac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|ogg|flac)$/i)) {
      throw new Error('Invalid file type. Please use WAV, MP3, OGG, or FLAC files.');
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 10MB.');
    }
    
    this.isLoading = true;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Create a pseudo-path for caching
      const pseudoPath = `user-upload/${file.name}`;
      this.sampleCache.set(pseudoPath, audioBuffer);
      
      // Store for this species
      this.loadedSamples.set(speciesIndex, {
        path: pseudoPath,
        buffer: audioBuffer,
        name: file.name
      });
      
      if (this.onSampleLoaded) {
        this.onSampleLoaded(speciesIndex, file.name, audioBuffer);
      }
      
      // Update waveform display in UI
      this.updateWaveformDisplay(speciesIndex, audioBuffer);
      
      // User sample loaded successfully
      
      return audioBuffer;
      
    } catch (error) {
      console.error('Failed to load user sample:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Get sample for a species
   */
  getSampleForSpecies(speciesIndex) {
    return this.loadedSamples.get(speciesIndex);
  }
  
  /**
   * Clear sample for a species
   */
  clearSampleForSpecies(speciesIndex) {
    this.loadedSamples.delete(speciesIndex);
    // Cleared sample for species
    
    // Clear waveform display in UI
    this.updateWaveformDisplay(speciesIndex, null);
  }
  
  /**
   * Update waveform display for a species
   */
  updateWaveformDisplay(speciesIndex, audioBuffer) {
    // Find the species audio control in the left panel
    if (window.leftPanel && window.leftPanel.speciesControls) {
      const control = window.leftPanel.speciesControls.get(speciesIndex);
      if (control) {
        if (audioBuffer) {
          control.updateWaveformDisplay(audioBuffer);
        } else {
          control.clearWaveformDisplay();
        }
      }
    }
  }
  
  /**
   * Clear all samples
   */
  clearAllSamples() {
    this.loadedSamples.clear();
    console.log('Cleared all species samples');
  }
  
  /**
   * Randomize all species samples
   */
  async randomizeAllSamples() {
    const speciesCount = this.loadedSamples.size || 4;
    await this.loadRandomSamplesForAllSpecies(speciesCount);
  }
  
  /**
   * Get sample configuration for saving
   */
  getSampleConfig() {
    const config = [];
    
    for (const [species, data] of this.loadedSamples) {
      config.push({
        species,
        sampleName: data.name,
        samplePath: data.path
      });
    }
    
    return config;
  }
  
  /**
   * Load sample configuration
   */
  async loadSampleConfig(config) {
    if (!config || !Array.isArray(config)) return;
    
    const promises = [];
    
    for (const item of config) {
      if (item.sampleName && item.species !== undefined) {
        // Try to load from stems folder first
        if (this.availableSamples.includes(item.sampleName)) {
          promises.push(
            this.loadSampleForSpecies(item.species, item.sampleName)
          );
        } else {
          // Try to load from cache if it's a user upload
          const cached = this.sampleCache.get(item.samplePath);
          if (cached) {
            this.loadedSamples.set(item.species, {
              path: item.samplePath,
              buffer: cached,
              name: item.sampleName
            });
          }
        }
      }
    }
    
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }
  
  /**
   * Preload samples for better performance
   */
  async preloadSamples(sampleNames) {
    const promises = [];
    
    for (const name of sampleNames) {
      const path = this.stemsPath + name;
      if (!this.sampleCache.has(path)) {
        promises.push(this.loadSample(path));
      }
    }
    
    if (promises.length > 0) {
      await Promise.allSettled(promises);
      // Preloaded samples
    }
  }
  
  /**
   * Get list of available samples
   */
  getAvailableSamples() {
    return [...this.availableSamples];
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    let totalSize = 0;
    
    for (const buffer of this.sampleCache.values()) {
      // Estimate size: samples * channels * 4 bytes per float32
      totalSize += buffer.length * buffer.numberOfChannels * 4;
    }
    
    return {
      cachedSamples: this.sampleCache.size,
      loadedSpecies: this.loadedSamples.size,
      estimatedMemoryMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  }
  
  /**
   * Clear cache to free memory
   */
  clearCache() {
    // Keep loaded species samples
    const keepPaths = new Set();
    for (const data of this.loadedSamples.values()) {
      keepPaths.add(data.path);
    }
    
    // Clear everything else
    for (const [path, _] of this.sampleCache) {
      if (!keepPaths.has(path)) {
        this.sampleCache.delete(path);
      }
    }
    
    // Cleared sample cache
  }
}