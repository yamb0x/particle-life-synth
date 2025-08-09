/**
 * IntelligentSampler.js - High-performance particle sampling for audio
 * Uses spatial hashing and adaptive sampling for 5K-10K particles
 */

export class IntelligentSampler {
  constructor(canvasWidth, canvasHeight) {
    // Canvas dimensions
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Spatial hash grid for O(1) lookups
    this.gridSize = 50; // Grid cell size in pixels
    this.grid = new Map(); // Spatial hash map
    this.gridCols = Math.ceil(canvasWidth / this.gridSize);
    this.gridRows = Math.ceil(canvasHeight / this.gridSize);
    
    // Adaptive sampling parameters
    this.adaptiveSampleSize = 200; // Target sample size for audio
    this.minSampleSize = 50; // Minimum particles to sample
    this.maxSampleSize = 500; // Maximum particles to sample
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.updateCount = 0;
    this.averageParticleCount = 0;
    this.performanceMode = 'balanced'; // 'full', 'balanced', 'performance', 'emergency'
    
    // Statistical sampling
    this.statisticalCache = {
      clusters: [],
      densityMap: null,
      lastUpdate: 0
    };
    
    // Importance weights for different particle properties
    this.importanceWeights = {
      velocity: 0.35,
      position: 0.25,
      density: 0.20,
      size: 0.10,
      random: 0.10
    };
  }
  
  /**
   * Update canvas dimensions and rebuild grid
   */
  updateDimensions(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.gridCols = Math.ceil(width / this.gridSize);
    this.gridRows = Math.ceil(height / this.gridSize);
    this.clearGrid();
  }
  
  /**
   * Build spatial hash grid from particles - O(n) operation
   */
  buildSpatialGrid(particles) {
    const startTime = performance.now();
    
    // Clear previous grid
    this.clearGrid();
    
    // Insert particles into grid cells
    for (const particle of particles) {
      const cellKey = this.getCellKey(particle.x, particle.y);
      
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, []);
      }
      
      this.grid.get(cellKey).push(particle);
    }
    
    // Update performance metrics
    const buildTime = performance.now() - startTime;
    this.updatePerformanceMode(particles.length, buildTime);
    
    // Update statistics if needed
    if (performance.now() - this.statisticalCache.lastUpdate > 100) {
      this.updateStatistics(particles);
    }
  }
  
  /**
   * Get cell key for a position
   */
  getCellKey(x, y) {
    const col = Math.floor(x / this.gridSize);
    const row = Math.floor(y / this.gridSize);
    return `${col},${row}`;
  }
  
  /**
   * Get particles within a circular area using spatial hashing - O(1) average
   */
  getParticlesInCircle(centerX, centerY, radius) {
    const particles = [];
    const radiusSquared = radius * radius;
    
    // Calculate which grid cells to check
    const minCol = Math.floor((centerX - radius) / this.gridSize);
    const maxCol = Math.floor((centerX + radius) / this.gridSize);
    const minRow = Math.floor((centerY - radius) / this.gridSize);
    const maxRow = Math.floor((centerY + radius) / this.gridSize);
    
    // Only check cells that intersect with the circle
    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const cellKey = `${col},${row}`;
        const cellParticles = this.grid.get(cellKey);
        
        if (cellParticles) {
          // Check each particle in the cell
          for (const particle of cellParticles) {
            const dx = particle.x - centerX;
            const dy = particle.y - centerY;
            const distSquared = dx * dx + dy * dy;
            
            if (distSquared <= radiusSquared) {
              particles.push({
                ...particle,
                distanceFromCenter: Math.sqrt(distSquared) / radius
              });
            }
          }
        }
      }
    }
    
    return particles;
  }
  
  /**
   * Adaptive sampling based on particle count and performance
   */
  adaptiveSample(particles) {
    const count = particles.length;
    
    // Determine sample size based on performance mode
    let targetSampleSize = this.calculateAdaptiveSampleSize(count);
    
    if (count <= targetSampleSize) {
      return particles;
    }
    
    // Use different sampling strategies based on count
    if (count < 1000) {
      return this.importanceSampling(particles, targetSampleSize);
    } else if (count < 5000) {
      return this.hybridSampling(particles, targetSampleSize);
    } else {
      return this.statisticalSampling(particles, targetSampleSize);
    }
  }
  
  /**
   * Calculate adaptive sample size based on performance
   */
  calculateAdaptiveSampleSize(particleCount) {
    switch (this.performanceMode) {
      case 'full':
        return Math.min(particleCount, this.maxSampleSize);
      case 'balanced':
        return Math.min(particleCount, this.adaptiveSampleSize);
      case 'performance':
        return Math.min(particleCount, 100);
      case 'emergency':
        return Math.min(particleCount, this.minSampleSize);
      default:
        return this.adaptiveSampleSize;
    }
  }
  
  /**
   * Importance-based sampling for moderate particle counts
   */
  importanceSampling(particles, targetSize) {
    // Calculate importance score for each particle
    const scored = particles.map(p => ({
      particle: p,
      score: this.calculateImportance(p)
    }));
    
    // Sort by importance
    scored.sort((a, b) => b.score - a.score);
    
    // Take top N particles
    return scored.slice(0, targetSize).map(s => s.particle);
  }
  
  /**
   * Hybrid sampling combining clustering and importance
   */
  hybridSampling(particles, targetSize) {
    // First, cluster particles
    const clusters = this.clusterParticles(particles);
    
    // Allocate samples per cluster based on size
    const samplesPerCluster = Math.floor(targetSize / clusters.length);
    const sampled = [];
    
    for (const cluster of clusters) {
      if (cluster.particles.length <= samplesPerCluster) {
        sampled.push(...cluster.particles);
      } else {
        // Sample from cluster based on importance
        const clusterSample = this.importanceSampling(
          cluster.particles, 
          samplesPerCluster
        );
        sampled.push(...clusterSample);
      }
    }
    
    return sampled.slice(0, targetSize);
  }
  
  /**
   * Statistical sampling for very high particle counts
   */
  statisticalSampling(particles, targetSize) {
    // Use cached clusters if recent
    if (this.statisticalCache.clusters.length > 0) {
      return this.sampleFromClusters(targetSize);
    }
    
    // Otherwise, use stratified random sampling
    const strataCount = Math.ceil(Math.sqrt(targetSize));
    const sampled = [];
    
    // Divide space into strata
    const strataWidth = this.canvasWidth / strataCount;
    const strataHeight = this.canvasHeight / strataCount;
    
    // Group particles by strata
    const strata = new Map();
    
    for (const particle of particles) {
      const strataX = Math.floor(particle.x / strataWidth);
      const strataY = Math.floor(particle.y / strataHeight);
      const strataKey = `${strataX},${strataY}`;
      
      if (!strata.has(strataKey)) {
        strata.set(strataKey, []);
      }
      strata.get(strataKey).push(particle);
    }
    
    // Sample from each stratum
    const samplesPerStratum = Math.ceil(targetSize / strata.size);
    
    for (const [_, strataParticles] of strata) {
      if (strataParticles.length <= samplesPerStratum) {
        sampled.push(...strataParticles);
      } else {
        // Random sample from stratum
        for (let i = 0; i < samplesPerStratum && i < strataParticles.length; i++) {
          const index = Math.floor(Math.random() * strataParticles.length);
          sampled.push(strataParticles[index]);
        }
      }
    }
    
    return sampled.slice(0, targetSize);
  }
  
  /**
   * Calculate importance score for a particle
   */
  calculateImportance(particle) {
    let score = 0;
    
    // Velocity component (fast particles are more audible)
    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    score += Math.min(1, velocity / 10) * this.importanceWeights.velocity;
    
    // Position component (particles near center of interest)
    const centerDist = Math.abs(particle.x - this.canvasWidth/2) + 
                      Math.abs(particle.y - this.canvasHeight/2);
    const normalizedDist = centerDist / (this.canvasWidth + this.canvasHeight);
    score += (1 - normalizedDist) * this.importanceWeights.position;
    
    // Local density component (isolated particles are interesting)
    const density = this.getLocalDensity(particle.x, particle.y);
    score += (1 - Math.min(1, density / 10)) * this.importanceWeights.density;
    
    // Size component
    const normalizedSize = Math.min(1, (particle.size || 5) / 20);
    score += normalizedSize * this.importanceWeights.size;
    
    // Random component for variation
    score += Math.random() * this.importanceWeights.random;
    
    return score;
  }
  
  /**
   * Get local particle density around a point
   */
  getLocalDensity(x, y) {
    const cellKey = this.getCellKey(x, y);
    const cellParticles = this.grid.get(cellKey) || [];
    
    // Check neighboring cells too
    let totalCount = cellParticles.length;
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        const neighborKey = this.getCellKey(
          x + dx * this.gridSize,
          y + dy * this.gridSize
        );
        const neighborParticles = this.grid.get(neighborKey);
        if (neighborParticles) {
          totalCount += neighborParticles.length;
        }
      }
    }
    
    return totalCount;
  }
  
  /**
   * Cluster particles for efficient sampling
   */
  clusterParticles(particles) {
    const clusters = [];
    const clusterRadius = 100; // Pixels
    const assigned = new Set();
    
    for (const particle of particles) {
      if (assigned.has(particle)) continue;
      
      // Start new cluster
      const cluster = {
        center: { x: particle.x, y: particle.y },
        particles: [particle]
      };
      assigned.add(particle);
      
      // Find nearby particles
      for (const other of particles) {
        if (assigned.has(other)) continue;
        
        const dx = other.x - cluster.center.x;
        const dy = other.y - cluster.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < clusterRadius) {
          cluster.particles.push(other);
          assigned.add(other);
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }
  
  /**
   * Sample from cached clusters
   */
  sampleFromClusters(targetSize) {
    const sampled = [];
    const clusters = this.statisticalCache.clusters;
    
    if (clusters.length === 0) return sampled;
    
    // Allocate samples per cluster
    const samplesPerCluster = Math.ceil(targetSize / clusters.length);
    
    for (const cluster of clusters) {
      // Take representative particles from cluster
      const clusterSample = Math.min(samplesPerCluster, cluster.particles.length);
      for (let i = 0; i < clusterSample; i++) {
        sampled.push(cluster.particles[i]);
      }
    }
    
    return sampled.slice(0, targetSize);
  }
  
  /**
   * Update performance mode based on metrics
   */
  updatePerformanceMode(particleCount, buildTime) {
    this.updateCount++;
    
    // Update average particle count
    this.averageParticleCount = 
      (this.averageParticleCount * (this.updateCount - 1) + particleCount) / 
      this.updateCount;
    
    // Determine performance mode
    if (particleCount > 10000 || buildTime > 10) {
      this.performanceMode = 'emergency';
    } else if (particleCount > 5000 || buildTime > 5) {
      this.performanceMode = 'performance';
    } else if (particleCount > 1000 || buildTime > 2) {
      this.performanceMode = 'balanced';
    } else {
      this.performanceMode = 'full';
    }
  }
  
  /**
   * Update statistical cache
   */
  updateStatistics(particles) {
    // Update clusters periodically
    if (particles.length > 1000) {
      this.statisticalCache.clusters = this.clusterParticles(
        this.statisticalSampling(particles, 500)
      );
    }
    
    this.statisticalCache.lastUpdate = performance.now();
  }
  
  /**
   * Clear the spatial grid
   */
  clearGrid() {
    this.grid.clear();
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      performanceMode: this.performanceMode,
      averageParticleCount: Math.round(this.averageParticleCount),
      gridCells: this.grid.size,
      clusterCount: this.statisticalCache.clusters.length,
      adaptiveSampleSize: this.calculateAdaptiveSampleSize(
        this.averageParticleCount
      )
    };
  }
  
  /**
   * Reset statistics
   */
  reset() {
    this.clearGrid();
    this.updateCount = 0;
    this.averageParticleCount = 0;
    this.performanceMode = 'balanced';
    this.statisticalCache.clusters = [];
    this.statisticalCache.lastUpdate = 0;
  }
}