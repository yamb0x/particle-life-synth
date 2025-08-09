/**
 * GrainOrganizer.js - Advanced grain organization modes
 * Implements 8 different ways particles can generate audio grains
 */

export class GrainOrganizer {
  constructor() {
    // Current organization mode
    this.mode = 'Direct (1:1)';
    
    // Mode-specific parameters
    this.params = {
      // Clustered Amplitude
      clusterThreshold: 30, // pixels
      minClusterSize: 2,
      
      // Density Modulation
      densityGridSize: 50, // pixels
      maxDensityMultiplier: 3,
      
      // Swarm Intelligence
      swarmCohesion: 0.5,
      swarmAlignment: 0.5,
      swarmSeparation: 0.5,
      
      // Harmonic Layers
      harmonicRatios: [1, 2, 3, 4, 5, 6, 7, 8],
      activeHarmonics: [1, 2, 4],
      harmonicBands: 8,
      
      // Rhythmic Patterns
      rhythmicGrid: '1/16',
      rhythmicSwing: 0,
      rhythmicAccents: [1, 5, 9, 13],
      
      // Spatial Zones
      zoneCount: 4,
      zoneRules: [
        { density: 1.0, pitch: 0 },    // Center
        { density: 0.8, pitch: 0.5 },  // Inner
        { density: 0.6, pitch: 1.0 },  // Middle
        { density: 0.4, pitch: 2.0 }   // Outer
      ],
      
      // Chaos Modulation
      chaosThreshold: 0.5,
      chaosResponseCurve: 'exponential'
    };
    
    // Performance tracking
    this.lastOrganizationTime = 0;
    this.organizationStats = {
      clustersFound: 0,
      harmonicsGenerated: 0,
      rhythmicEvents: 0
    };
  }
  
  /**
   * Main organization method - routes to specific mode
   */
  organizeGrains(particles, canvasDimensions, audioBuffer) {
    const startTime = performance.now();
    
    let organized;
    
    switch (this.mode) {
      case 'Direct (1:1)':
        organized = this.directMode(particles, canvasDimensions, audioBuffer);
        break;
        
      case 'Clustered Amplitude':
        organized = this.clusteredAmplitudeMode(particles, canvasDimensions, audioBuffer);
        break;
        
      case 'Density Modulation':
        organized = this.densityModulationMode(particles, canvasDimensions, audioBuffer);
        break;
        
      case 'Swarm Intelligence':
        organized = this.swarmIntelligenceMode(particles, canvasDimensions, audioBuffer);
        break;
        
      case 'Harmonic Layers':
        organized = this.harmonicLayersMode(particles, canvasDimensions, audioBuffer);
        break;
        
      case 'Rhythmic Patterns':
        organized = this.rhythmicPatternsMode(particles, canvasDimensions, audioBuffer);
        break;
        
      case 'Spatial Zones':
        organized = this.spatialZonesMode(particles, canvasDimensions, audioBuffer);
        break;
        
      case 'Chaos Modulation':
        organized = this.chaosModulationMode(particles, canvasDimensions, audioBuffer);
        break;
        
      default:
        organized = this.directMode(particles, canvasDimensions, audioBuffer);
    }
    
    this.lastOrganizationTime = performance.now() - startTime;
    return organized;
  }
  
  /**
   * Direct (1:1) Mode - Original behavior, each particle is a grain
   */
  directMode(particles, dimensions, audioBuffer) {
    const { width, height } = dimensions;
    
    // Return empty if no audio buffer
    if (!audioBuffer || !audioBuffer.duration) {
      return [];
    }
    
    const sampleDuration = audioBuffer.duration;
    
    return particles.map(p => ({
      particle: p,
      grainParams: {
        startTime: (p.x / width) * sampleDuration,
        pitchShift: ((p.y / height) - 0.5) * 24,
        pan: (p.x / width) * 2 - 1,
        volume: Math.min(1, Math.sqrt(p.vx * p.vx + p.vy * p.vy) / 10),
        duration: this.velocityToGrainSize(p),
        trigger: true
      }
    }));
  }
  
  /**
   * Clustered Amplitude Mode - Grouped particles create louder grains
   */
  clusteredAmplitudeMode(particles, dimensions, audioBuffer) {
    // Return empty if no audio buffer
    if (!audioBuffer || !audioBuffer.duration) {
      return [];
    }
    
    const clusters = this.findClusters(particles, this.params.clusterThreshold);
    const { width, height } = dimensions;
    const sampleDuration = audioBuffer.duration;
    
    this.organizationStats.clustersFound = clusters.length;
    
    const organized = [];
    
    for (const cluster of clusters) {
      if (cluster.particles.length < this.params.minClusterSize) {
        // Too small, treat as individual particles
        cluster.particles.forEach(p => {
          organized.push({
            particle: p,
            grainParams: this.getBasicGrainParams(p, dimensions, audioBuffer)
          });
        });
      } else {
        // Create cluster grain
        const center = this.getClusterCenter(cluster);
        const clusterSize = cluster.particles.length;
        
        organized.push({
          particle: center,
          grainParams: {
            startTime: (center.x / width) * sampleDuration,
            pitchShift: ((center.y / height) - 0.5) * 24,
            pan: (center.x / width) * 2 - 1,
            volume: Math.min(1, Math.sqrt(clusterSize) * 0.3), // Louder with more particles
            duration: 100 + clusterSize * 10, // Longer grains for bigger clusters
            voices: Math.min(8, clusterSize), // Multiple voices for thickness
            trigger: true
          }
        });
      }
    }
    
    return organized;
  }
  
  /**
   * Density Modulation Mode - Dense areas trigger grains faster
   */
  densityModulationMode(particles, dimensions, audioBuffer) {
    const densityGrid = this.calculateDensityGrid(particles, dimensions);
    const { width, height } = dimensions;
    const sampleDuration = audioBuffer.duration;
    
    return particles.map(p => {
      const density = densityGrid.getDensityAt(p.x, p.y);
      const densityMultiplier = Math.min(
        this.params.maxDensityMultiplier, 
        1 + density * 0.1
      );
      
      return {
        particle: p,
        grainParams: {
          startTime: (p.x / width) * sampleDuration,
          pitchShift: ((p.y / height) - 0.5) * 24,
          pan: (p.x / width) * 2 - 1,
          volume: Math.min(1, Math.sqrt(p.vx * p.vx + p.vy * p.vy) / 10),
          duration: this.velocityToGrainSize(p) / densityMultiplier, // Shorter in dense areas
          triggerRate: densityMultiplier, // More triggers in dense areas
          overlap: Math.min(0.9, density * 0.5), // More overlap in dense areas
          trigger: true
        }
      };
    });
  }
  
  /**
   * Swarm Intelligence Mode - Collective movement creates patterns
   */
  swarmIntelligenceMode(particles, dimensions, audioBuffer) {
    const swarmBehavior = this.analyzeSwarmBehavior(particles);
    const { width, height } = dimensions;
    const sampleDuration = audioBuffer.duration;
    
    return particles.map(p => {
      const alignment = this.getLocalAlignment(p, particles);
      const cohesion = this.getLocalCohesion(p, particles);
      const separation = this.getLocalSeparation(p, particles);
      
      // Swarm metrics affect grain parameters
      const swarmScore = 
        alignment * this.params.swarmAlignment +
        cohesion * this.params.swarmCohesion +
        separation * this.params.swarmSeparation;
      
      return {
        particle: p,
        grainParams: {
          startTime: (p.x / width) * sampleDuration,
          pitchShift: ((p.y / height) - 0.5) * 24 + swarmScore * 5,
          pan: (p.x / width) * 2 - 1,
          volume: Math.min(1, 0.3 + swarmScore * 0.7),
          duration: this.velocityToGrainSize(p) * (1 + swarmScore),
          detune: swarmBehavior.chaos * 50, // Chaos adds detune
          trigger: swarmScore > 0.3 // Only trigger if swarm is coherent
        }
      };
    });
  }
  
  /**
   * Harmonic Layers Mode - Y position creates harmonic series
   */
  harmonicLayersMode(particles, dimensions, audioBuffer) {
    const bands = this.groupByYPosition(particles, this.params.harmonicBands);
    const { width, height } = dimensions;
    const sampleDuration = audioBuffer.duration;
    
    const organized = [];
    this.organizationStats.harmonicsGenerated = 0;
    
    bands.forEach((band, bandIndex) => {
      const harmonicRatio = this.params.harmonicRatios[
        bandIndex % this.params.harmonicRatios.length
      ];
      
      // Only use active harmonics
      if (!this.params.activeHarmonics.includes(harmonicRatio)) {
        return;
      }
      
      band.particles.forEach(p => {
        this.organizationStats.harmonicsGenerated++;
        
        organized.push({
          particle: p,
          grainParams: {
            startTime: (p.x / width) * sampleDuration,
            pitchShift: Math.log2(harmonicRatio) * 12, // Harmonic pitch shift
            pan: (p.x / width) * 2 - 1,
            volume: Math.min(1, 1 / harmonicRatio) * // Quieter for higher harmonics
                   Math.sqrt(p.vx * p.vx + p.vy * p.vy) / 10,
            duration: this.velocityToGrainSize(p),
            harmonicIndex: bandIndex,
            trigger: true
          }
        });
      });
    });
    
    return organized;
  }
  
  /**
   * Rhythmic Patterns Mode - Velocity creates rhythmic triggering
   */
  rhythmicPatternsMode(particles, dimensions, audioBuffer) {
    const currentTime = performance.now();
    const { width, height } = dimensions;
    const sampleDuration = audioBuffer.duration;
    
    // Calculate rhythmic grid timing
    const gridMs = this.getGridTiming(this.params.rhythmicGrid);
    const gridPosition = Math.floor(currentTime / gridMs) % 16;
    const isAccent = this.params.rhythmicAccents.includes(gridPosition + 1);
    
    this.organizationStats.rhythmicEvents = 0;
    
    return particles.map(p => {
      const velocity = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const rhythmicProbability = velocity / 10;
      
      // Determine if this particle triggers on this grid position
      const shouldTrigger = Math.random() < rhythmicProbability;
      
      if (shouldTrigger) {
        this.organizationStats.rhythmicEvents++;
      }
      
      return {
        particle: p,
        grainParams: {
          startTime: (p.x / width) * sampleDuration,
          pitchShift: ((p.y / height) - 0.5) * 24,
          pan: (p.x / width) * 2 - 1,
          volume: Math.min(1, velocity / 10) * (isAccent ? 1.5 : 1),
          duration: gridMs * (isAccent ? 1.2 : 1),
          trigger: shouldTrigger,
          rhythmicPosition: gridPosition
        }
      };
    });
  }
  
  /**
   * Spatial Zones Mode - Different behaviors in circle zones
   */
  spatialZonesMode(particles, dimensions, audioBuffer) {
    const { width, height } = dimensions;
    const sampleDuration = audioBuffer.duration;
    
    return particles.map(p => {
      const zone = p.zone || 0;
      const zoneRule = this.params.zoneRules[
        Math.min(zone, this.params.zoneRules.length - 1)
      ];
      
      return {
        particle: p,
        grainParams: {
          startTime: (p.x / width) * sampleDuration,
          pitchShift: ((p.y / height) - 0.5) * 24 + zoneRule.pitch * 12,
          pan: (p.x / width) * 2 - 1,
          volume: Math.min(1, Math.sqrt(p.vx * p.vx + p.vy * p.vy) / 10) * 
                 zoneRule.density,
          duration: this.velocityToGrainSize(p) * (1 + zone * 0.5),
          zoneIndex: zone,
          trigger: true
        }
      };
    });
  }
  
  /**
   * Chaos Modulation Mode - System chaos affects grain behavior
   */
  chaosModulationMode(particles, dimensions, audioBuffer) {
    const chaos = this.calculateSystemChaos(particles);
    const { width, height } = dimensions;
    const sampleDuration = audioBuffer.duration;
    
    // Apply chaos response curve
    let chaosMultiplier = chaos;
    if (this.params.chaosResponseCurve === 'exponential') {
      chaosMultiplier = Math.pow(chaos, 2);
    } else if (this.params.chaosResponseCurve === 'logarithmic') {
      chaosMultiplier = Math.log(1 + chaos) / Math.log(2);
    }
    
    return particles.map(p => {
      const velocity = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      
      return {
        particle: p,
        grainParams: {
          startTime: (p.x / width) * sampleDuration + 
                   (Math.random() - 0.5) * chaos * 0.1, // Chaos adds jitter
          pitchShift: ((p.y / height) - 0.5) * 24 + 
                     (Math.random() - 0.5) * chaos * 12, // Random pitch
          pan: (p.x / width) * 2 - 1 + 
               (Math.random() - 0.5) * chaos * 0.5, // Random pan
          volume: Math.min(1, velocity / 10) * (1 - chaos * 0.3), // Quieter when chaotic
          duration: this.velocityToGrainSize(p) * (1 + chaos),
          detune: chaos * 100 * (Math.random() - 0.5), // Random detune
          trigger: chaos > this.params.chaosThreshold || velocity > 5
        }
      };
    });
  }
  
  // Helper methods
  
  findClusters(particles, threshold) {
    const clusters = [];
    const assigned = new Set();
    
    for (const particle of particles) {
      if (assigned.has(particle)) continue;
      
      const cluster = {
        particles: [particle],
        center: { x: particle.x, y: particle.y }
      };
      assigned.add(particle);
      
      // Find nearby particles
      for (const other of particles) {
        if (assigned.has(other)) continue;
        
        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < threshold) {
          cluster.particles.push(other);
          assigned.add(other);
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }
  
  getClusterCenter(cluster) {
    let sumX = 0, sumY = 0, sumVx = 0, sumVy = 0;
    
    for (const p of cluster.particles) {
      sumX += p.x;
      sumY += p.y;
      sumVx += p.vx || 0;
      sumVy += p.vy || 0;
    }
    
    const count = cluster.particles.length;
    return {
      x: sumX / count,
      y: sumY / count,
      vx: sumVx / count,
      vy: sumVy / count,
      size: cluster.particles[0].size || 5
    };
  }
  
  calculateDensityGrid(particles, dimensions) {
    const gridSize = this.params.densityGridSize;
    const cols = Math.ceil(dimensions.width / gridSize);
    const rows = Math.ceil(dimensions.height / gridSize);
    const grid = Array(rows).fill(0).map(() => Array(cols).fill(0));
    
    // Count particles in each cell
    for (const p of particles) {
      const col = Math.floor(p.x / gridSize);
      const row = Math.floor(p.y / gridSize);
      
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        grid[row][col]++;
      }
    }
    
    return {
      getDensityAt: (x, y) => {
        const col = Math.floor(x / gridSize);
        const row = Math.floor(y / gridSize);
        
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          return grid[row][col];
        }
        return 0;
      }
    };
  }
  
  analyzeSwarmBehavior(particles) {
    let avgVx = 0, avgVy = 0;
    let varVx = 0, varVy = 0;
    
    // Calculate average velocity
    for (const p of particles) {
      avgVx += p.vx || 0;
      avgVy += p.vy || 0;
    }
    
    avgVx /= particles.length;
    avgVy /= particles.length;
    
    // Calculate variance
    for (const p of particles) {
      varVx += Math.pow((p.vx || 0) - avgVx, 2);
      varVy += Math.pow((p.vy || 0) - avgVy, 2);
    }
    
    varVx /= particles.length;
    varVy /= particles.length;
    
    const chaos = Math.sqrt(varVx + varVy) / Math.max(1, Math.sqrt(avgVx * avgVx + avgVy * avgVy));
    
    return {
      averageVelocity: { x: avgVx, y: avgVy },
      variance: { x: varVx, y: varVy },
      chaos: Math.min(1, chaos)
    };
  }
  
  getLocalAlignment(particle, neighbors, radius = 100) {
    let sumVx = 0, sumVy = 0;
    let count = 0;
    
    for (const n of neighbors) {
      const dx = n.x - particle.x;
      const dy = n.y - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius && dist > 0) {
        sumVx += n.vx || 0;
        sumVy += n.vy || 0;
        count++;
      }
    }
    
    if (count === 0) return 0;
    
    const avgVx = sumVx / count;
    const avgVy = sumVy / count;
    
    const particleSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    const neighborSpeed = Math.sqrt(avgVx * avgVx + avgVy * avgVy);
    
    if (particleSpeed === 0 || neighborSpeed === 0) return 0;
    
    const dotProduct = (particle.vx * avgVx + particle.vy * avgVy) / 
                      (particleSpeed * neighborSpeed);
    
    return (dotProduct + 1) / 2; // Normalize to 0-1
  }
  
  getLocalCohesion(particle, neighbors, radius = 100) {
    let sumX = 0, sumY = 0;
    let count = 0;
    
    for (const n of neighbors) {
      const dx = n.x - particle.x;
      const dy = n.y - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius && dist > 0) {
        sumX += n.x;
        sumY += n.y;
        count++;
      }
    }
    
    if (count === 0) return 0;
    
    const centerX = sumX / count;
    const centerY = sumY / count;
    
    const distToCenter = Math.sqrt(
      Math.pow(particle.x - centerX, 2) + 
      Math.pow(particle.y - centerY, 2)
    );
    
    return 1 - Math.min(1, distToCenter / radius);
  }
  
  getLocalSeparation(particle, neighbors, radius = 50) {
    let minDist = radius;
    
    for (const n of neighbors) {
      const dx = n.x - particle.x;
      const dy = n.y - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0 && dist < minDist) {
        minDist = dist;
      }
    }
    
    return minDist / radius; // Higher value = more separated
  }
  
  groupByYPosition(particles, bandCount) {
    const bands = Array(bandCount).fill(null).map(() => ({
      particles: []
    }));
    
    const minY = Math.min(...particles.map(p => p.y));
    const maxY = Math.max(...particles.map(p => p.y));
    const bandHeight = (maxY - minY) / bandCount;
    
    for (const p of particles) {
      const bandIndex = Math.min(
        bandCount - 1,
        Math.floor((p.y - minY) / bandHeight)
      );
      bands[bandIndex].particles.push(p);
    }
    
    return bands;
  }
  
  getGridTiming(gridString) {
    const bpm = 120; // Default BPM
    const beatMs = 60000 / bpm;
    
    switch (gridString) {
      case '1/4': return beatMs;
      case '1/8': return beatMs / 2;
      case '1/16': return beatMs / 4;
      case '1/32': return beatMs / 8;
      case 'Triplets': return beatMs / 3;
      case 'Free': return 50; // 50ms free timing
      default: return beatMs / 4;
    }
  }
  
  calculateSystemChaos(particles) {
    const behavior = this.analyzeSwarmBehavior(particles);
    return behavior.chaos;
  }
  
  velocityToGrainSize(particle) {
    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    const minSize = 10; // ms
    const maxSize = 200; // ms
    const normalized = Math.min(1, velocity / 10);
    return minSize + normalized * (maxSize - minSize);
  }
  
  getBasicGrainParams(particle, dimensions, audioBuffer) {
    const { width, height } = dimensions;
    const sampleDuration = audioBuffer.duration;
    
    return {
      startTime: (particle.x / width) * sampleDuration,
      pitchShift: ((particle.y / height) - 0.5) * 24,
      pan: (particle.x / width) * 2 - 1,
      volume: Math.min(1, Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy) / 10),
      duration: this.velocityToGrainSize(particle),
      trigger: true
    };
  }
  
  // Configuration methods
  
  setMode(mode) {
    this.mode = mode;
    console.log('Grain organization mode set to:', mode);
  }
  
  setParams(params) {
    Object.assign(this.params, params);
  }
  
  getStats() {
    return {
      mode: this.mode,
      lastOrganizationTime: this.lastOrganizationTime,
      ...this.organizationStats
    };
  }
}