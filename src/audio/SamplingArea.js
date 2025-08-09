/**
 * SamplingArea.js - Circular sampling area for controlling audio grain density
 * Manages which particles within a circular region generate audio
 */

export class SamplingArea {
  constructor(canvasWidth, canvasHeight) {
    // Canvas dimensions
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Sampling area parameters (normalized 0-1)
    this.centerX = 0.5; // Center of canvas
    this.centerY = 0.5;
    this.radius = 0.2; // 20% of canvas diagonal
    
    // Performance limits
    this.maxParticles = 200; // Maximum particles to sample
    this.adaptiveSampling = true;
    
    // Visual overlay settings
    this.overlayVisible = true;
    this.overlayOpacity = 0.7;
    this.showCrosshair = true;
    this.showZones = false;
    
    // Grain organization mode
    this.organizationMode = 'Direct (1:1)';
    this.organizationParams = {
      clusterThreshold: 30,
      harmonicRatios: [1, 2, 4],
      rhythmicGrid: '1/16',
      zoneCount: 4
    };
    
    // Performance tracking
    this.lastSampleTime = 0;
    this.sampleRate = 60; // Hz
    this.particlesInLastSample = 0;
    
    // Spatial zones for advanced modes
    this.zones = [];
    this.updateZones();
  }
  
  /**
   * Update canvas dimensions
   */
  updateDimensions(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.updateZones();
  }
  
  /**
   * Set sampling center position (normalized 0-1)
   */
  setCenter(x, y) {
    this.centerX = Math.max(0, Math.min(1, x));
    this.centerY = Math.max(0, Math.min(1, y));
    this.updateZones();
  }
  
  /**
   * Set sampling radius (normalized 0-1)
   */
  setRadius(radius) {
    this.radius = Math.max(0.05, Math.min(0.5, radius));
    this.updateZones();
  }
  
  /**
   * Get particles within the circular sampling area
   * @param {Array} allParticles - All particles in the system
   * @returns {Map} Map of species index to particles array
   */
  getParticlesInArea(allParticles) {
    const now = performance.now();
    
    // Throttle sampling rate for performance
    if (now - this.lastSampleTime < 1000 / this.sampleRate) {
      return new Map();
    }
    
    this.lastSampleTime = now;
    
    // Calculate actual center and radius in pixels
    const centerPixelX = this.centerX * this.canvasWidth;
    const centerPixelY = this.centerY * this.canvasHeight;
    const diagonal = Math.sqrt(this.canvasWidth * this.canvasWidth + 
                              this.canvasHeight * this.canvasHeight);
    const radiusPixels = this.radius * diagonal;
    
    // Group particles by species
    const particlesBySpecies = new Map();
    let totalInArea = 0;
    
    for (const particle of allParticles) {
      // Check if particle is within circular area
      const dx = particle.x - centerPixelX;
      const dy = particle.y - centerPixelY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= radiusPixels) {
        const species = particle.species || 0;
        
        if (!particlesBySpecies.has(species)) {
          particlesBySpecies.set(species, []);
        }
        
        // Add distance info for advanced organization modes
        const enrichedParticle = {
          ...particle,
          distanceFromCenter: distance / radiusPixels, // Normalized 0-1
          angleFromCenter: Math.atan2(dy, dx),
          zone: this.getZone(distance / radiusPixels, Math.atan2(dy, dx))
        };
        
        particlesBySpecies.get(species).push(enrichedParticle);
        totalInArea++;
        
        // Stop if we hit the max particle limit
        if (totalInArea >= this.maxParticles) {
          break;
        }
      }
    }
    
    this.particlesInLastSample = totalInArea;
    
    // Apply adaptive sampling if needed
    if (this.adaptiveSampling && totalInArea > this.maxParticles) {
      return this.adaptiveSample(particlesBySpecies);
    }
    
    return particlesBySpecies;
  }
  
  /**
   * Adaptive sampling for high particle counts
   */
  adaptiveSample(particlesBySpecies) {
    const sampled = new Map();
    const totalParticles = Array.from(particlesBySpecies.values())
      .reduce((sum, particles) => sum + particles.length, 0);
    
    for (const [species, particles] of particlesBySpecies) {
      // Calculate how many particles this species gets
      const speciesRatio = particles.length / totalParticles;
      const speciesQuota = Math.ceil(this.maxParticles * speciesRatio);
      
      // Sample particles based on priority
      const sampledParticles = this.prioritySample(particles, speciesQuota);
      sampled.set(species, sampledParticles);
    }
    
    return sampled;
  }
  
  /**
   * Priority-based particle sampling
   */
  prioritySample(particles, maxCount) {
    if (particles.length <= maxCount) {
      return particles;
    }
    
    // Score particles based on various factors
    const scored = particles.map(p => ({
      particle: p,
      score: this.calculateParticleScore(p)
    }));
    
    // Sort by score and take top N
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxCount).map(s => s.particle);
  }
  
  calculateParticleScore(particle) {
    let score = 0;
    
    // Velocity is important for audibility
    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    score += Math.min(1, velocity / 10) * 0.3;
    
    // Distance from center (closer = more important)
    score += (1 - particle.distanceFromCenter) * 0.3;
    
    // Size affects frequency content
    score += (particle.size / 10) * 0.2;
    
    // Random factor for variation
    score += Math.random() * 0.2;
    
    return score;
  }
  
  /**
   * Update spatial zones for advanced organization modes
   */
  updateZones() {
    this.zones = [];
    const zoneCount = this.organizationParams.zoneCount;
    
    // Create concentric ring zones
    for (let i = 0; i < zoneCount; i++) {
      const innerRadius = i / zoneCount;
      const outerRadius = (i + 1) / zoneCount;
      
      this.zones.push({
        index: i,
        innerRadius,
        outerRadius,
        behavior: this.getZoneBehavior(i)
      });
    }
  }
  
  getZone(normalizedDistance, angle) {
    for (const zone of this.zones) {
      if (normalizedDistance >= zone.innerRadius && 
          normalizedDistance < zone.outerRadius) {
        return zone.index;
      }
    }
    return 0;
  }
  
  getZoneBehavior(zoneIndex) {
    // Different behaviors for different zones
    const behaviors = [
      { grainSizeMultiplier: 1.0, densityMultiplier: 1.0 },   // Center
      { grainSizeMultiplier: 1.5, densityMultiplier: 0.8 },   // Inner
      { grainSizeMultiplier: 2.0, densityMultiplier: 0.6 },   // Middle
      { grainSizeMultiplier: 3.0, densityMultiplier: 0.4 }    // Outer
    ];
    
    return behaviors[Math.min(zoneIndex, behaviors.length - 1)];
  }
  
  /**
   * Draw the sampling area overlay on a canvas
   */
  drawOverlay(ctx) {
    if (!this.overlayVisible) return;
    
    ctx.save();
    
    // Reset any lingering canvas state
    ctx.setLineDash([]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Use screen blend mode instead of difference to avoid trail artifacts
    // Screen mode brightens without leaving persistent marks in the trail buffer
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = this.overlayOpacity * 0.5; // Reduce opacity for screen mode
    
    const centerPixelX = this.centerX * this.canvasWidth;
    const centerPixelY = this.centerY * this.canvasHeight;
    const diagonal = Math.sqrt(this.canvasWidth * this.canvasWidth + 
                              this.canvasHeight * this.canvasHeight);
    const radiusPixels = this.radius * diagonal;
    
    // Draw crosshair
    if (this.showCrosshair) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(centerPixelX - 20, centerPixelY);
      ctx.lineTo(centerPixelX + 20, centerPixelY);
      ctx.stroke();
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(centerPixelX, centerPixelY - 20);
      ctx.lineTo(centerPixelX, centerPixelY + 20);
      ctx.stroke();
    }
    
    // Draw circular boundary
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.arc(centerPixelX, centerPixelY, radiusPixels, 0, Math.PI * 2);
    ctx.stroke();
    
    // Reset line dash to prevent affecting other drawing
    ctx.setLineDash([]);
    
    // Draw zones if enabled
    if (this.showZones && this.zones.length > 0) {
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 1;
      
      for (const zone of this.zones) {
        if (zone.innerRadius > 0) {
          ctx.beginPath();
          ctx.arc(centerPixelX, centerPixelY, 
                 radiusPixels * zone.innerRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    
    // Draw particle count indicator
    if (this.particlesInLastSample > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${this.particlesInLastSample} particles`,
        centerPixelX,
        centerPixelY + radiusPixels + 20
      );
    }
    
    ctx.restore();
  }
  
  /**
   * Get current configuration for saving
   */
  getConfig() {
    return {
      centerX: this.centerX,
      centerY: this.centerY,
      radius: this.radius,
      maxParticles: this.maxParticles,
      organizationMode: this.organizationMode,
      organizationParams: { ...this.organizationParams },
      overlayVisible: this.overlayVisible,
      overlayOpacity: this.overlayOpacity,
      showCrosshair: this.showCrosshair,
      showZones: this.showZones
    };
  }
  
  /**
   * Load configuration
   */
  loadConfig(config) {
    if (!config) return;
    
    if (config.centerX !== undefined) this.centerX = config.centerX;
    if (config.centerY !== undefined) this.centerY = config.centerY;
    if (config.radius !== undefined) this.radius = config.radius;
    if (config.maxParticles !== undefined) this.maxParticles = config.maxParticles;
    if (config.organizationMode !== undefined) {
      this.organizationMode = config.organizationMode;
    }
    if (config.organizationParams) {
      Object.assign(this.organizationParams, config.organizationParams);
    }
    if (config.overlayVisible !== undefined) {
      this.overlayVisible = config.overlayVisible;
    }
    if (config.overlayOpacity !== undefined) {
      this.overlayOpacity = config.overlayOpacity;
    }
    if (config.showCrosshair !== undefined) {
      this.showCrosshair = config.showCrosshair;
    }
    if (config.showZones !== undefined) {
      this.showZones = config.showZones;
    }
    
    this.updateZones();
  }
}