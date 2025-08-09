/**
 * DecoupledAudioBridge.js - Bridge between particle system and audio engine
 * Allows audio to run at 60Hz while particles may run at 5-60 FPS
 */

export class DecoupledAudioBridge {
  constructor() {
    // Update rates
    this.audioUpdateRate = 60; // Hz - fixed audio control rate
    this.audioUpdateInterval = 1000 / this.audioUpdateRate;
    this.lastParticleUpdate = 0;
    this.lastAudioUpdate = 0;
    
    // Particle data snapshots for interpolation
    this.snapshots = [];
    this.maxSnapshots = 4; // Keep last 4 frames for interpolation
    this.currentSnapshot = null;
    
    // Statistical data cache
    this.statisticsCache = {
      density: 0,
      centroid: { x: 0.5, y: 0.5 },
      averageVelocity: 0,
      speciesDistribution: new Map(),
      chaos: 0
    };
    
    // Performance monitoring
    this.performanceMetrics = {
      particleFPS: 60,
      audioFPS: 60,
      interpolationActive: false,
      lagCompensation: 0
    };
    
    // Audio update timer
    this.audioTimer = null;
    this.audioCallback = null;
    
    // Predictive modeling for extreme lag
    this.predictionModel = {
      velocityHistory: [],
      positionHistory: [],
      maxHistoryLength: 10
    };
  }
  
  /**
   * Called whenever particle system updates (5-60 FPS)
   * Non-blocking write to avoid slowing down particle system
   */
  updateFromParticles(particles, samplingArea) {
    const now = performance.now();
    const deltaTime = now - this.lastParticleUpdate;
    
    // Calculate particle FPS
    if (deltaTime > 0) {
      this.performanceMetrics.particleFPS = 1000 / deltaTime;
    }
    
    // Create snapshot of current state
    const snapshot = this.createSnapshot(particles, samplingArea, now);
    
    // Add to snapshot buffer
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    
    this.currentSnapshot = snapshot;
    this.lastParticleUpdate = now;
    
    // Update statistics cache
    this.updateStatisticsCache(snapshot);
    
    // Update prediction model
    this.updatePredictionModel(snapshot);
  }
  
  /**
   * Start fixed-rate audio updates (60Hz)
   */
  startAudioUpdates(callback) {
    this.audioCallback = callback;
    
    // Use high-precision timer for audio
    const audioLoop = () => {
      const now = performance.now();
      const deltaTime = now - this.lastAudioUpdate;
      
      if (deltaTime >= this.audioUpdateInterval) {
        this.performanceMetrics.audioFPS = 1000 / deltaTime;
        this.lastAudioUpdate = now;
        
        // Get interpolated or predicted data
        const audioData = this.getAudioData(now);
        
        // Call audio update callback
        if (this.audioCallback && audioData) {
          this.audioCallback(audioData);
        }
      }
      
      this.audioTimer = requestAnimationFrame(audioLoop);
    };
    
    audioLoop();
  }
  
  stopAudioUpdates() {
    if (this.audioTimer) {
      cancelAnimationFrame(this.audioTimer);
      this.audioTimer = null;
    }
  }
  
  /**
   * Create a snapshot of particle data
   */
  createSnapshot(particles, samplingArea, timestamp) {
    // Get particles in sampling area grouped by species
    const particlesInArea = samplingArea.getParticlesInArea(particles);
    
    // Create compact snapshot for interpolation
    const snapshot = {
      timestamp,
      particlesBySpecies: new Map(),
      totalCount: 0,
      bounds: { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    };
    
    // Process each species
    for (const [species, speciesParticles] of particlesInArea) {
      const compactParticles = speciesParticles.map(p => ({
        x: p.x,
        y: p.y,
        vx: p.vx || 0,
        vy: p.vy || 0,
        size: p.size || 5,
        distanceFromCenter: p.distanceFromCenter || 0,
        angleFromCenter: p.angleFromCenter || 0,
        zone: p.zone || 0
      }));
      
      snapshot.particlesBySpecies.set(species, compactParticles);
      snapshot.totalCount += compactParticles.length;
      
      // Update bounds for spatial analysis
      compactParticles.forEach(p => {
        snapshot.bounds.minX = Math.min(snapshot.bounds.minX, p.x);
        snapshot.bounds.maxX = Math.max(snapshot.bounds.maxX, p.x);
        snapshot.bounds.minY = Math.min(snapshot.bounds.minY, p.y);
        snapshot.bounds.maxY = Math.max(snapshot.bounds.maxY, p.y);
      });
    }
    
    return snapshot;
  }
  
  /**
   * Get interpolated or predicted audio data
   */
  getAudioData(currentTime) {
    if (!this.currentSnapshot) {
      return null;
    }
    
    const timeSinceUpdate = currentTime - this.lastParticleUpdate;
    
    // Check if we need interpolation or prediction
    if (timeSinceUpdate > 200) {
      // Particle system is very slow (< 5 FPS), use prediction
      this.performanceMetrics.interpolationActive = true;
      this.performanceMetrics.lagCompensation = timeSinceUpdate;
      return this.predictParticleState(timeSinceUpdate);
    } else if (timeSinceUpdate > this.audioUpdateInterval * 2) {
      // Moderate lag, use interpolation
      this.performanceMetrics.interpolationActive = true;
      return this.interpolateSnapshots(currentTime);
    } else {
      // Recent update, use current snapshot with statistics
      this.performanceMetrics.interpolationActive = false;
      return this.processSnapshot(this.currentSnapshot);
    }
  }
  
  /**
   * Interpolate between snapshots for smooth audio
   */
  interpolateSnapshots(currentTime) {
    if (this.snapshots.length < 2) {
      return this.processSnapshot(this.currentSnapshot);
    }
    
    // Find two snapshots to interpolate between
    let prev = this.snapshots[this.snapshots.length - 2];
    let next = this.snapshots[this.snapshots.length - 1];
    
    // Calculate interpolation factor
    const totalTime = next.timestamp - prev.timestamp;
    const elapsed = currentTime - prev.timestamp;
    const t = Math.min(1, elapsed / totalTime);
    
    // Create interpolated snapshot
    const interpolated = {
      timestamp: currentTime,
      particlesBySpecies: new Map(),
      totalCount: 0
    };
    
    // Interpolate each species
    for (const [species, prevParticles] of prev.particlesBySpecies) {
      const nextParticles = next.particlesBySpecies.get(species) || [];
      const interpolatedParticles = [];
      
      // Match and interpolate particles
      const minCount = Math.min(prevParticles.length, nextParticles.length);
      for (let i = 0; i < minCount; i++) {
        const p1 = prevParticles[i];
        const p2 = nextParticles[i];
        
        interpolatedParticles.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
          vx: p1.vx + (p2.vx - p1.vx) * t,
          vy: p1.vy + (p2.vy - p1.vy) * t,
          size: p1.size,
          distanceFromCenter: p1.distanceFromCenter + 
            (p2.distanceFromCenter - p1.distanceFromCenter) * t,
          angleFromCenter: p1.angleFromCenter,
          zone: p1.zone
        });
      }
      
      interpolated.particlesBySpecies.set(species, interpolatedParticles);
      interpolated.totalCount += interpolatedParticles.length;
    }
    
    return this.processSnapshot(interpolated);
  }
  
  /**
   * Predict particle state when system is very slow
   */
  predictParticleState(lagTime) {
    if (!this.currentSnapshot || this.snapshots.length < 2) {
      return this.processSnapshot(this.currentSnapshot);
    }
    
    // Use velocity and acceleration history for prediction
    const predicted = {
      timestamp: performance.now(),
      particlesBySpecies: new Map(),
      totalCount: 0
    };
    
    // Predict each species
    for (const [species, particles] of this.currentSnapshot.particlesBySpecies) {
      const predictedParticles = particles.map(p => {
        // Simple linear prediction based on velocity
        const dt = lagTime / 1000; // Convert to seconds
        
        return {
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt,
          vx: p.vx * 0.99, // Apply friction
          vy: p.vy * 0.99,
          size: p.size,
          distanceFromCenter: p.distanceFromCenter,
          angleFromCenter: p.angleFromCenter + (p.vx / 100) * dt, // Orbital motion
          zone: p.zone
        };
      });
      
      predicted.particlesBySpecies.set(species, predictedParticles);
      predicted.totalCount += predictedParticles.length;
    }
    
    return this.processSnapshot(predicted);
  }
  
  /**
   * Process snapshot into audio-ready data
   */
  processSnapshot(snapshot) {
    if (!snapshot) return null;
    
    return {
      particlesBySpecies: snapshot.particlesBySpecies,
      totalCount: snapshot.totalCount,
      statistics: this.statisticsCache,
      performanceMetrics: { ...this.performanceMetrics },
      timestamp: snapshot.timestamp
    };
  }
  
  /**
   * Update statistics cache for efficient repeated queries
   */
  updateStatisticsCache(snapshot) {
    let totalX = 0, totalY = 0;
    let totalVelocity = 0;
    let particleCount = 0;
    
    const speciesDistribution = new Map();
    
    for (const [species, particles] of snapshot.particlesBySpecies) {
      speciesDistribution.set(species, {
        count: particles.length,
        ratio: particles.length / Math.max(1, snapshot.totalCount)
      });
      
      particles.forEach(p => {
        totalX += p.x;
        totalY += p.y;
        totalVelocity += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        particleCount++;
      });
    }
    
    if (particleCount > 0) {
      this.statisticsCache.centroid = {
        x: totalX / particleCount,
        y: totalY / particleCount
      };
      this.statisticsCache.averageVelocity = totalVelocity / particleCount;
    }
    
    this.statisticsCache.density = snapshot.totalCount;
    this.statisticsCache.speciesDistribution = speciesDistribution;
    
    // Calculate chaos index (variance in velocities)
    if (particleCount > 1) {
      let varianceSum = 0;
      const avgVel = this.statisticsCache.averageVelocity;
      
      for (const [_, particles] of snapshot.particlesBySpecies) {
        particles.forEach(p => {
          const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          varianceSum += Math.pow(vel - avgVel, 2);
        });
      }
      
      this.statisticsCache.chaos = Math.sqrt(varianceSum / particleCount) / 
        Math.max(1, avgVel);
    }
  }
  
  /**
   * Update prediction model for extreme lag compensation
   */
  updatePredictionModel(snapshot) {
    // Store velocity and position history
    if (snapshot.totalCount > 0) {
      const avgVelocity = this.statisticsCache.averageVelocity;
      const centroid = this.statisticsCache.centroid;
      
      this.predictionModel.velocityHistory.push(avgVelocity);
      this.predictionModel.positionHistory.push({ ...centroid });
      
      // Limit history length
      if (this.predictionModel.velocityHistory.length > 
          this.predictionModel.maxHistoryLength) {
        this.predictionModel.velocityHistory.shift();
        this.predictionModel.positionHistory.shift();
      }
    }
  }
  
  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      snapshotCount: this.snapshots.length,
      cacheHitRate: this.statisticsCache.density > 0 ? 1 : 0
    };
  }
  
  /**
   * Clear all data
   */
  clear() {
    this.snapshots = [];
    this.currentSnapshot = null;
    this.lastParticleUpdate = 0;
    this.lastAudioUpdate = 0;
    this.predictionModel.velocityHistory = [];
    this.predictionModel.positionHistory = [];
  }
  
  /**
   * Destroy and cleanup
   */
  destroy() {
    this.stopAudioUpdates();
    this.clear();
    this.audioCallback = null;
  }
}