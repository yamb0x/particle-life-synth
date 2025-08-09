/**
 * StabilizedGrainScheduler.js - Advanced grain scheduling with stability focus
 * Implements buffering, rate limiting, and predictive scheduling
 */

export class StabilizedGrainScheduler {
  constructor(audioEngine, maxGrains = 128) {
    this.audioEngine = audioEngine;
    this.audioContext = audioEngine.audioContext;
    this.maxGrains = maxGrains;
    
    // Scheduling buffers
    this.scheduleBuffer = [];
    this.grainQueue = [];
    this.lookaheadTime = 0.1; // 100ms lookahead
    this.minGrainInterval = 0.01; // 10ms minimum between grains
    
    // Rate limiting per species
    this.speciesRateLimiter = new Map();
    this.speciesGrainCount = new Map();
    
    // Performance adaptation
    this.adaptiveScheduling = true;
    this.performanceMode = 'balanced';
    this.baseSchedulingRate = 60; // Hz
    this.currentSchedulingRate = 60;
    
    // Scheduling timer
    this.schedulingTimer = null;
    this.isRunning = false;
    this.lastScheduleTime = 0;
    
    // Statistics
    this.stats = {
      scheduledGrains: 0,
      droppedGrains: 0,
      activeGrains: 0,
      averageLatency: 0,
      bufferUtilization: 0
    };
    
    // Prediction system for smooth scheduling
    this.predictor = {
      particleVelocityHistory: new Map(),
      historyLength: 5,
      predictionHorizon: 0.05 // 50ms prediction
    };
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleGrains();
    console.log('StabilizedGrainScheduler started');
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.schedulingTimer) {
      clearTimeout(this.schedulingTimer);
      this.schedulingTimer = null;
    }
    
    // Clear all pending grains
    this.scheduleBuffer = [];
    this.grainQueue = [];
    this.speciesRateLimiter.clear();
    this.speciesGrainCount.clear();
    
    console.log('StabilizedGrainScheduler stopped');
  }
  
  /**
   * Schedule grains for multiple species with stability controls
   */
  scheduleSpeciesGrains(speciesGrainMap, canvasDimensions) {
    if (!this.isRunning) return;
    
    const now = this.audioContext.currentTime;
    const scheduleTime = now + this.lookaheadTime;
    
    // Adaptive rate limiting based on performance
    this.adaptSchedulingRate();
    
    // Process each species
    for (const [speciesIndex, grainData] of speciesGrainMap) {
      this.scheduleSpeciesGrainsStabilized(
        speciesIndex, 
        grainData.particles, 
        grainData.synthesizer,
        canvasDimensions,
        scheduleTime
      );
    }
    
    // Update statistics
    this.updateStatistics();
  }
  
  scheduleSpeciesGrainsStabilized(speciesIndex, particles, synthesizer, dimensions, scheduleTime) {
    // Check species rate limiting
    const lastScheduled = this.speciesRateLimiter.get(speciesIndex) || 0;
    const currentTime = this.audioContext.currentTime;
    
    if (currentTime - lastScheduled < this.minGrainInterval) {
      this.stats.droppedGrains++;
      return;
    }
    
    // Adaptive grain limiting based on current load
    const currentGrainCount = this.speciesGrainCount.get(speciesIndex) || 0;
    const maxSpeciesGrains = this.calculateMaxGrainsForSpecies(speciesIndex);
    
    if (currentGrainCount >= maxSpeciesGrains) {
      this.stats.droppedGrains++;
      return;
    }
    
    // Predictive particle selection
    const selectedParticles = this.selectParticlesWithPrediction(particles, maxSpeciesGrains);
    
    // Schedule grains with buffering
    selectedParticles.forEach((particle, index) => {
      const grainDelay = (index * this.minGrainInterval) / selectedParticles.length;
      const grainScheduleTime = scheduleTime + grainDelay;
      
      this.scheduleIndividualGrain({
        speciesIndex,
        particle,
        synthesizer,
        dimensions,
        scheduleTime: grainScheduleTime,
        priority: this.calculateGrainPriority(particle)
      });
    });
    
    this.speciesRateLimiter.set(speciesIndex, currentTime);
  }
  
  scheduleIndividualGrain(grainRequest) {
    // Add to schedule buffer with timestamp
    const bufferedGrain = {
      ...grainRequest,
      bufferTime: performance.now(),
      processed: false
    };\n    \n    this.scheduleBuffer.push(bufferedGrain);\n    this.stats.scheduledGrains++;\n    \n    // Keep buffer size manageable\n    if (this.scheduleBuffer.length > this.maxGrains * 2) {\n      // Remove oldest unprocessed grains\n      this.scheduleBuffer = this.scheduleBuffer\n        .sort((a, b) => b.priority - a.priority)\n        .slice(0, this.maxGrains);\n    }\n  }\n  \n  /**\n   * Process scheduled grains at regular intervals\n   */\n  scheduleGrains() {\n    if (!this.isRunning) return;\n    \n    const now = this.audioContext.currentTime;\n    const processingTime = performance.now();\n    \n    // Process grains that are ready\n    const readyGrains = this.scheduleBuffer.filter(grain => \n      !grain.processed && now >= (grain.scheduleTime - 0.005) // 5ms tolerance\n    );\n    \n    // Sort by priority for processing order\n    readyGrains.sort((a, b) => b.priority - a.priority);\n    \n    // Process grains with error handling\n    const processedCount = this.processGrains(readyGrains);\n    \n    // Update active grain counts\n    this.updateActiveGrainCounts(processedCount);\n    \n    // Clean up processed grains\n    this.scheduleBuffer = this.scheduleBuffer.filter(grain => !grain.processed);\n    \n    // Calculate next scheduling interval\n    const processingDuration = performance.now() - processingTime;\n    const nextInterval = Math.max(\n      1000 / this.currentSchedulingRate,\n      processingDuration * 2 // Ensure we don't overload\n    );\n    \n    // Schedule next iteration\n    this.schedulingTimer = setTimeout(() => {\n      this.scheduleGrains();\n    }, nextInterval);\n    \n    this.lastScheduleTime = processingTime;\n  }\n  \n  processGrains(readyGrains) {\n    let processedCount = 0;\n    \n    for (const grain of readyGrains) {\n      try {\n        // Create grain parameters\n        const grainParams = this.createGrainParameters(grain);\n        \n        // Process grain through synthesizer\n        if (grain.synthesizer && grain.synthesizer.scheduleGrainOptimized) {\n          const success = grain.synthesizer.scheduleGrainOptimized(grainParams);\n          \n          if (success) {\n            processedCount++;\n            // Update species grain count\n            const current = this.speciesGrainCount.get(grain.speciesIndex) || 0;\n            this.speciesGrainCount.set(grain.speciesIndex, current + 1);\n          } else {\n            this.stats.droppedGrains++;\n          }\n        }\n        \n        grain.processed = true;\n        \n      } catch (error) {\n        console.error('Grain processing error:', error);\n        grain.processed = true;\n        this.stats.droppedGrains++;\n      }\n    }\n    \n    return processedCount;\n  }\n  \n  createGrainParameters(grain) {\n    const { particle, dimensions, scheduleTime } = grain;\n    const { width, height } = dimensions;\n    \n    // Enhanced parameter mapping with prediction\n    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);\n    const predictedPosition = this.predictParticlePosition(particle);\n    \n    // Use predicted position for smoother audio\n    const normalizedX = (predictedPosition.x || particle.x) / width;\n    const normalizedY = (predictedPosition.y || particle.y) / height;\n    \n    return {\n      sampleOffset: normalizedX,\n      pitchShift: (normalizedY - 0.5) * 24 + Math.log2(Math.max(0.1, velocity)) * 2,\n      pan: (normalizedX * 2 - 1) * 0.8,\n      volume: Math.pow(Math.min(1, velocity / 10), 1.0) * 0.8,\n      duration: this.calculateOptimalGrainDuration(particle, velocity),\n      startTime: scheduleTime,\n      particle: particle\n    };\n  }\n  \n  predictParticlePosition(particle) {\n    // Simple linear prediction based on current velocity\n    const dt = this.predictor.predictionHorizon;\n    \n    return {\n      x: particle.x + (particle.vx || 0) * dt,\n      y: particle.y + (particle.vy || 0) * dt\n    };\n  }\n  \n  calculateOptimalGrainDuration(particle, velocity) {\n    // Adaptive grain duration based on particle behavior\n    const baseDuration = 50; // ms\n    const velocityFactor = Math.min(2, Math.max(0.5, 1 + velocity / 20));\n    const sizeFactor = (particle.size || 5) / 5;\n    \n    return (baseDuration * velocityFactor * sizeFactor) / 1000; // Convert to seconds\n  }\n  \n  selectParticlesWithPrediction(particles, maxCount) {\n    if (particles.length <= maxCount) {\n      return particles;\n    }\n    \n    // Score particles with prediction-aware priorities\n    const scoredParticles = particles.map(particle => ({\n      particle,\n      score: this.calculatePredictiveScore(particle)\n    }));\n    \n    // Sort by score and take top particles\n    scoredParticles.sort((a, b) => b.score - a.score);\n    return scoredParticles.slice(0, maxCount).map(sp => sp.particle);\n  }\n  \n  calculatePredictiveScore(particle) {\n    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);\n    const predictedPos = this.predictParticlePosition(particle);\n    \n    // Score based on current and predicted states\n    let score = 0;\n    \n    // Velocity importance (moving particles are more interesting)\n    score += Math.min(1, velocity / 10) * 0.4;\n    \n    // Position variation (particles near edges/centers are interesting)\n    const centerDistance = Math.abs(predictedPos.x - 0.5) + Math.abs(predictedPos.y - 0.5);\n    score += centerDistance * 0.3;\n    \n    // Size factor\n    score += ((particle.size || 5) / 10) * 0.2;\n    \n    // Random factor for variation\n    score += Math.random() * 0.1;\n    \n    return score;\n  }\n  \n  calculateGrainPriority(particle) {\n    // Higher priority for more active/interesting particles\n    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);\n    const size = particle.size || 5;\n    \n    return velocity * 0.6 + size * 0.3 + Math.random() * 0.1;\n  }\n  \n  calculateMaxGrainsForSpecies(speciesIndex) {\n    // Adaptive grain limiting based on system performance\n    const baseLimit = Math.floor(this.maxGrains / 10); // Assume 10 species max\n    const currentLoad = this.audioEngine.performanceMetrics?.audioLoad || 0;\n    \n    if (currentLoad > 0.8) {\n      return Math.floor(baseLimit * 0.6);\n    } else if (currentLoad > 0.6) {\n      return Math.floor(baseLimit * 0.8);\n    }\n    \n    return baseLimit;\n  }\n  \n  adaptSchedulingRate() {\n    if (!this.adaptiveScheduling) return;\n    \n    const currentLoad = this.audioEngine.performanceMetrics?.audioLoad || 0;\n    const targetRate = this.baseSchedulingRate;\n    \n    if (currentLoad > 0.8) {\n      this.currentSchedulingRate = Math.max(20, targetRate * 0.5);\n    } else if (currentLoad > 0.6) {\n      this.currentSchedulingRate = Math.max(30, targetRate * 0.75);\n    } else {\n      this.currentSchedulingRate = targetRate;\n    }\n  }\n  \n  updateActiveGrainCounts(newGrainsCount) {\n    // Decay grain counts over time (approximate cleanup)\n    const decayFactor = 0.95;\n    \n    for (const [species, count] of this.speciesGrainCount.entries()) {\n      const decayedCount = count * decayFactor;\n      if (decayedCount < 1) {\n        this.speciesGrainCount.delete(species);\n      } else {\n        this.speciesGrainCount.set(species, decayedCount);\n      }\n    }\n    \n    this.stats.activeGrains = Array.from(this.speciesGrainCount.values())\n      .reduce((sum, count) => sum + count, 0);\n  }\n  \n  updateStatistics() {\n    const bufferUtilization = this.scheduleBuffer.length / (this.maxGrains * 2);\n    this.stats.bufferUtilization = bufferUtilization;\n    \n    // Calculate average latency\n    if (this.scheduleBuffer.length > 0) {\n      const now = performance.now();\n      const totalLatency = this.scheduleBuffer.reduce((sum, grain) => {\n        return sum + (now - grain.bufferTime);\n      }, 0);\n      this.stats.averageLatency = totalLatency / this.scheduleBuffer.length;\n    }\n  }\n  \n  getStatistics() {\n    return {\n      ...this.stats,\n      bufferSize: this.scheduleBuffer.length,\n      maxGrains: this.maxGrains,\n      schedulingRate: this.currentSchedulingRate,\n      speciesGrainCounts: Object.fromEntries(this.speciesGrainCount),\n      performanceMode: this.performanceMode\n    };\n  }\n  \n  setPerformanceMode(mode) {\n    this.performanceMode = mode;\n    \n    switch (mode) {\n      case 'maximum':\n        this.maxGrains = 256;\n        this.baseSchedulingRate = 120;\n        this.minGrainInterval = 0.005;\n        this.adaptiveScheduling = false;\n        break;\n        \n      case 'high':\n        this.maxGrains = 192;\n        this.baseSchedulingRate = 90;\n        this.minGrainInterval = 0.008;\n        this.adaptiveScheduling = true;\n        break;\n        \n      case 'balanced':\n        this.maxGrains = 128;\n        this.baseSchedulingRate = 60;\n        this.minGrainInterval = 0.01;\n        this.adaptiveScheduling = true;\n        break;\n        \n      case 'efficient':\n        this.maxGrains = 64;\n        this.baseSchedulingRate = 30;\n        this.minGrainInterval = 0.02;\n        this.adaptiveScheduling = true;\n        break;\n    }\n    \n    console.log(`GrainScheduler performance mode set to: ${mode}`);\n  }\n  \n  // Cleanup\n  destroy() {\n    this.stop();\n    this.predictor.particleVelocityHistory.clear();\n    console.log('StabilizedGrainScheduler destroyed');\n  }\n}