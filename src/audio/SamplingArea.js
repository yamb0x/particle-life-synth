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
    this.showCrosshair = false; // Disabled by default for cleaner look
    this.showZones = false;
    
    // New spotlight rendering settings
    this.spotlightMode = true;
    this.spotlightOpacity = 0.6; // 0-1 for dark overlay opacity
    this.circleFeather = 20; // 0-100 for edge softness
    this.backgroundBlur = false;
    this.backgroundBlurAmount = 0.5; // 0-1
    
    // Vignette settings
    this.vignetteEnabled = false;
    this.vignetteSize = 0.8; // 0-2, multiplier for vignette radius relative to spotlight
    this.vignetteIntensity = 0.4; // 0-1 for vignette darkness
    
    // Interactive drag settings
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    
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
    
    // Gradient caching system
    this.gradientCache = new Map();
    this.canvasCache = new Map();
    this.lastCacheKey = null;
    this.cacheValidFrames = 0;
    this.MAX_CACHE_FRAMES = 30; // Cache for 30 frames (~0.5s at 60fps)
    
    // Pre-allocated canvases to avoid GC
    this.tempCanvas1 = null;
    this.tempCanvas2 = null;
    this.tempCanvas3 = null;
    this.initializeTempCanvases();
    
    // Auto-save debouncing
    this.saveTimeout = null;
    this.SAVE_DEBOUNCE_MS = 1000; // 1 second debounce
  }
  
  /**
   * Initialize pre-allocated temporary canvases
   */
  initializeTempCanvases() {
    // Create temporary canvases for blur operations to avoid GC
    this.tempCanvas1 = document.createElement('canvas');
    this.tempCanvas2 = document.createElement('canvas');  
    this.tempCanvas3 = document.createElement('canvas');
    
    // Set initial dimensions
    this.updateTempCanvasDimensions();
  }
  
  updateTempCanvasDimensions() {
    [this.tempCanvas1, this.tempCanvas2, this.tempCanvas3].forEach(canvas => {
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
    });
    
    // Clear caches when dimensions change
    this.invalidateCache();
  }
  
  /**
   * Generate cache key for gradient/canvas caching
   */
  getCacheKey(centerPixelX, centerPixelY, radiusPixels, featherPixels) {
    const precision = 10; // Round to nearest 10 pixels for caching
    return `${Math.round(centerPixelX / precision) * precision}_${Math.round(centerPixelY / precision) * precision}_${Math.round(radiusPixels / precision) * precision}_${Math.round(featherPixels / precision) * precision}_${this.spotlightOpacity}_${this.circleFeather}_${this.backgroundBlur}_${this.backgroundBlurAmount}`;
  }
  
  /**
   * Get cached gradient or create new one
   */
  getCachedGradient(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels) {
    const cacheKey = this.getCacheKey(centerPixelX, centerPixelY, radiusPixels, featherPixels);
    
    let gradient = this.gradientCache.get(cacheKey);
    if (!gradient) {
      gradient = this.createOptimizedGradient(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels);
      this.gradientCache.set(cacheKey, gradient);
      
      // Limit cache size
      if (this.gradientCache.size > 50) {
        const firstKey = this.gradientCache.keys().next().value;
        this.gradientCache.delete(firstKey);
      }
    }
    
    return gradient;
  }
  
  /**
   * Create optimized gradient with fewer stops
   */
  createOptimizedGradient(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels) {
    const gradient = ctx.createRadialGradient(
      centerPixelX, centerPixelY, 0,
      centerPixelX, centerPixelY, radiusPixels + featherPixels
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    
    const corePoint = radiusPixels / (radiusPixels + featherPixels);
    
    if (this.circleFeather > 0) {
      // Optimized gradient with fewer stops (8 instead of 16)
      const stops = 8;
      const startPoint = Math.max(0, corePoint - 0.15);
      const endPoint = Math.min(1.0, corePoint + 0.08);
      
      for (let i = 0; i <= stops; i++) {
        const t = i / stops;
        const stop = startPoint + (endPoint - startPoint) * t;
        const curve = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const alpha = curve * this.spotlightOpacity;
        
        if (stop >= 0 && stop <= 1) {
          gradient.addColorStop(stop, `rgba(0, 0, 0, ${alpha})`);
        }
      }
    } else {
      const innerPoint = Math.max(0, Math.min(0.999, corePoint - 0.001));
      const outerPoint = Math.min(1.0, corePoint);
      
      gradient.addColorStop(innerPoint, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(outerPoint, `rgba(0, 0, 0, ${this.spotlightOpacity})`);
    }
    
    gradient.addColorStop(1, `rgba(0, 0, 0, ${this.spotlightOpacity})`);
    return gradient;
  }
  
  /**
   * Get cached mask gradient for blur operations
   */
  getCachedMaskGradient(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels) {
    const cacheKey = 'mask_' + this.getCacheKey(centerPixelX, centerPixelY, radiusPixels, featherPixels);
    
    let gradient = this.gradientCache.get(cacheKey);
    if (!gradient) {
      gradient = this.createOptimizedMaskGradient(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels);
      this.gradientCache.set(cacheKey, gradient);
    }
    
    return gradient;
  }
  
  /**
   * Create optimized mask gradient
   */
  createOptimizedMaskGradient(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels) {
    const maskGradient = ctx.createRadialGradient(
      centerPixelX, centerPixelY, 0,
      centerPixelX, centerPixelY, radiusPixels + featherPixels
    );
    
    const corePoint = radiusPixels / (radiusPixels + featherPixels);
    
    // Inner area is white (show original)
    maskGradient.addColorStop(0, 'white');
    
    if (this.circleFeather > 0) {
      // Optimized mask gradient with fewer stops
      const stops = 8;
      const startPoint = Math.max(0, corePoint - 0.15);
      const endPoint = Math.min(1.0, corePoint + 0.08);
      
      for (let i = 0; i <= stops; i++) {
        const t = i / stops;
        const stop = startPoint + (endPoint - startPoint) * t;
        const curve = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const grayValue = Math.round((1 - curve) * 255);
        
        if (stop >= 0 && stop <= 1) {
          maskGradient.addColorStop(stop, `rgb(${grayValue}, ${grayValue}, ${grayValue})`);
        }
      }
    } else {
      const innerPoint = Math.max(0, Math.min(0.999, corePoint - 0.001));
      const outerPoint = Math.min(1.0, corePoint);
      
      maskGradient.addColorStop(innerPoint, 'white');
      maskGradient.addColorStop(outerPoint, 'black');
    }
    
    maskGradient.addColorStop(1, 'black');
    return maskGradient;
  }
  
  /**
   * Invalidate all caches
   */
  invalidateCache() {
    this.gradientCache.clear();
    this.canvasCache.clear();
    this.lastCacheKey = null;
    this.cacheValidFrames = 0;
  }

  /**
   * Update canvas dimensions
   */
  updateDimensions(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.updateZones();
    this.updateTempCanvasDimensions();
  }
  
  /**
   * Set sampling center position (normalized 0-1)
   */
  setCenter(x, y) {
    const oldX = this.centerX;
    const oldY = this.centerY;
    
    this.centerX = Math.max(0, Math.min(1, x));
    this.centerY = Math.max(0, Math.min(1, y));
    
    // Invalidate cache if position changed significantly
    if (Math.abs(oldX - this.centerX) > 0.01 || Math.abs(oldY - this.centerY) > 0.01) {
      this.invalidateCache();
    }
    
    this.updateZones();
    
    // Auto-save configuration changes
    this.debouncedSave();
  }
  
  /**
   * Set sampling radius (normalized 0-1)
   */
  setRadius(radius) {
    const oldRadius = this.radius;
    this.radius = Math.max(0.05, Math.min(0.5, radius));
    
    // Invalidate cache if radius changed significantly
    if (Math.abs(oldRadius - this.radius) > 0.01) {
      this.invalidateCache();
    }
    
    this.updateZones();
    
    // Auto-save configuration changes
    this.debouncedSave();
  }
  
  /**
   * Adjust sampling radius by a delta amount (for keyboard shortcuts)
   */
  adjustRadius(delta) {
    const newRadius = this.radius + delta;
    this.setRadius(newRadius);
    
    // Fire event to notify UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samplingRadiusChanged', {
        detail: { radius: this.radius }
      }));
    }
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
   * Draw the sampling area overlay on a canvas (optimized with caching)
   */
  drawOverlay(ctx) {
    if (!this.overlayVisible) return;
    
    // Update cache validity tracking
    this.cacheValidFrames++;
    
    if (this.spotlightMode) {
      this.drawSpotlightOverlay(ctx);
    } else {
      this.drawLegacyOverlay(ctx);
    }
    
    // Periodically clean old cache entries
    if (this.cacheValidFrames > this.MAX_CACHE_FRAMES) {
      this.cleanupOldCacheEntries();
      this.cacheValidFrames = 0;
    }
  }
  
  /**
   * Clean up old cache entries to prevent memory leaks
   */
  cleanupOldCacheEntries() {
    if (this.gradientCache.size > 20) {
      // Remove oldest cache entries
      const keysToRemove = Array.from(this.gradientCache.keys()).slice(0, 10);
      keysToRemove.forEach(key => this.gradientCache.delete(key));
    }
    
    if (this.canvasCache.size > 10) {
      // Remove oldest canvas cache entries
      const keysToRemove = Array.from(this.canvasCache.keys()).slice(0, 5);
      keysToRemove.forEach(key => this.canvasCache.delete(key));
    }
  }
  
  /**
   * Draw new spotlight-style overlay with dark background and bright circle
   */
  drawSpotlightOverlay(ctx) {
    ctx.save();
    
    const centerPixelX = this.centerX * this.canvasWidth;
    const centerPixelY = this.centerY * this.canvasHeight;
    const diagonal = Math.sqrt(this.canvasWidth * this.canvasWidth + 
                              this.canvasHeight * this.canvasHeight);
    const radiusPixels = this.radius * diagonal;
    
    // First, draw the spotlight overlay
    this.drawSpotlightLayer(ctx, centerPixelX, centerPixelY, radiusPixels);
    
    // Then, draw vignette if enabled
    if (this.vignetteEnabled) {
      this.drawVignetteLayer(ctx, centerPixelX, centerPixelY, radiusPixels);
    }
    
    // Draw crosshair if enabled (always visible in spotlight area)
    if (this.showCrosshair) {
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(centerPixelX - 15, centerPixelY);
      ctx.lineTo(centerPixelX + 15, centerPixelY);
      ctx.stroke();
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(centerPixelX, centerPixelY - 15);
      ctx.lineTo(centerPixelX, centerPixelY + 15);
      ctx.stroke();
    }
    
    // Draw zones if enabled
    if (this.showZones && this.zones.length > 0) {
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      
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
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.9;
      ctx.fillText(
        `${this.particlesInLastSample} particles`,
        centerPixelX,
        centerPixelY + radiusPixels + 25
      );
    }
    
    ctx.restore();
  }
  
  /**
   * Draw the main spotlight layer
   */
  drawSpotlightLayer(ctx, centerPixelX, centerPixelY, radiusPixels) {
    ctx.save();
    
    // Calculate feather distance in pixels for better control
    const featherPixels = Math.max(1, (this.circleFeather / 100) * radiusPixels * 2);
    
    if (this.backgroundBlur && this.backgroundBlurAmount > 0) {
      // Create blurred background that only affects dark overlay areas
      this.drawBlurredOverlay(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels);
    } else {
      // Draw regular spotlight overlay without blur
      this.drawRegularOverlay(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels);
    }
    
    ctx.restore();
  }
  
  /**
   * Draw spotlight overlay with selective background blur (optimized)
   */
  drawBlurredOverlay(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels) {
    // Use pre-allocated canvases to avoid GC pressure
    const originalCanvas = this.tempCanvas1;
    const blurredCanvas = this.tempCanvas2;
    
    const originalCtx = originalCanvas.getContext('2d');
    const blurredCtx = blurredCanvas.getContext('2d');
    
    // Clear and prepare canvases
    originalCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    blurredCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Step 1: Save the original particles
    originalCtx.drawImage(ctx.canvas, 0, 0);
    
    // Step 2: Create blurred version
    blurredCtx.filter = `blur(${this.backgroundBlurAmount * 10}px)`;
    blurredCtx.drawImage(originalCanvas, 0, 0);
    blurredCtx.filter = 'none';
    
    // Step 3: Create a spotlight mask using pre-allocated canvas
    const spotlightMask = this.tempCanvas3;
    const maskCtx = spotlightMask.getContext('2d');
    maskCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Fill with black (outside areas)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Use cached gradient system for mask creation
    const maskGradient = this.getCachedMaskGradient(maskCtx, centerPixelX, centerPixelY, radiusPixels, featherPixels);
    
    maskCtx.fillStyle = maskGradient;
    maskCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Step 4: Composite ONLY where there will be dark overlay
    ctx.save();
    
    // Start with the original particles (no blur in spotlight area)
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.drawImage(originalCanvas, 0, 0);
    
    // Create an inverted mask - black inside circle, white outside
    const invertedMask = document.createElement('canvas');
    invertedMask.width = this.canvasWidth;
    invertedMask.height = this.canvasHeight;
    const invertedCtx = invertedMask.getContext('2d');
    
    // Fill with white (outside areas - where blur should appear)
    invertedCtx.fillStyle = 'white';
    invertedCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Cut out the spotlight circle (make it black - no blur)
    invertedCtx.globalCompositeOperation = 'destination-out';
    
    const invertedGradient = invertedCtx.createRadialGradient(
      centerPixelX, centerPixelY, 0,
      centerPixelX, centerPixelY, radiusPixels + featherPixels
    );
    
    const invertedCorePoint = radiusPixels / (radiusPixels + featherPixels);
    
    // Inner area - cut out completely (no blur)
    invertedGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    
    if (this.circleFeather > 0) {
      // Moderate increase in gradient stops for smoother transition
      const stops = 16; // Increased from 8 to 16 for better smoothness
      const startPoint = Math.max(0, invertedCorePoint - 0.2);
      const endPoint = Math.min(1.0, invertedCorePoint + 0.1);
      
      for (let i = 0; i <= stops; i++) {
        const t = i / stops;
        const stop = startPoint + (endPoint - startPoint) * t;
        
        // Fade from cut-out to keep
        const curve = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const alpha = 1 - curve; // Start with full cut-out, fade to no cut-out
        
        if (stop >= 0 && stop <= 1) {
          invertedGradient.addColorStop(stop, `rgba(255, 255, 255, ${alpha})`);
        }
      }
    } else {
      // Sharp transition
      const innerPoint = Math.max(0, Math.min(0.999, invertedCorePoint - 0.001));
      const outerPoint = Math.min(1.0, invertedCorePoint);
      
      invertedGradient.addColorStop(innerPoint, 'rgba(255, 255, 255, 1)');
      invertedGradient.addColorStop(outerPoint, 'rgba(255, 255, 255, 0)');
    }
    
    // Outer area - don't cut out (keep blur)
    invertedGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    invertedCtx.fillStyle = invertedGradient;
    invertedCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Now apply blur ONLY to the areas outside the spotlight
    ctx.globalCompositeOperation = 'source-atop';
    ctx.drawImage(blurredCanvas, 0, 0);
    
    ctx.globalCompositeOperation = 'destination-in';  
    ctx.drawImage(invertedMask, 0, 0);
    
    // Restore the original particles in the spotlight area
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(originalCanvas, 0, 0);
    
    // Step 5: Apply the spotlight gradient overlay on top
    ctx.globalCompositeOperation = 'multiply';
    this.drawSpotlightGradient(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels);
    
    ctx.restore();
  }
  
  /**
   * Draw regular spotlight overlay without blur
   */
  drawRegularOverlay(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels) {
    // Fill the entire canvas with the spotlight gradient
    ctx.globalCompositeOperation = 'multiply';
    this.drawSpotlightGradient(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels);
  }
  
  /**
   * Draw the spotlight gradient with cached optimization
   */
  drawSpotlightGradient(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels) {
    // Use cached gradient for better performance
    const gradient = this.getCachedGradient(ctx, centerPixelX, centerPixelY, radiusPixels, featherPixels);
    
    // Fill with the cached gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }
  
  /**
   * Draw the vignette layer
   */
  drawVignetteLayer(ctx, centerPixelX, centerPixelY, radiusPixels) {
    ctx.save();
    
    // Calculate vignette radius (larger than spotlight radius)
    const vignetteRadius = radiusPixels * (1 + this.vignetteSize);
    const vignetteFeather = vignetteRadius * 0.5; // Always soft for vignette
    
    // Create radial gradient for vignette effect
    const vignetteGradient = ctx.createRadialGradient(
      centerPixelX, centerPixelY, vignetteRadius - vignetteFeather,
      centerPixelX, centerPixelY, vignetteRadius + vignetteFeather
    );
    
    // Inner area is transparent
    vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGradient.addColorStop(0.7, `rgba(0, 0, 0, 0)`);
    vignetteGradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteIntensity})`);
    
    // Apply vignette
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    ctx.restore();
  }
  
  /**
   * Draw legacy overlay (dotted circle)
   */
  drawLegacyOverlay(ctx) {
    ctx.save();
    
    // Reset any lingering canvas state
    ctx.setLineDash([]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Use screen blend mode instead of difference to avoid trail artifacts
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = this.overlayOpacity * 0.5;
    
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
   * Handle mouse click for drag start
   */
  handleMouseDown(event, canvas) {
    if (!this.overlayVisible || !this.spotlightMode) return false;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = this.canvasWidth / rect.width;
    const scaleY = this.canvasHeight / rect.height;
    
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;
    
    const centerPixelX = this.centerX * this.canvasWidth;
    const centerPixelY = this.centerY * this.canvasHeight;
    const diagonal = Math.sqrt(this.canvasWidth * this.canvasWidth + 
                              this.canvasHeight * this.canvasHeight);
    const radiusPixels = this.radius * diagonal;
    
    // Check if click is within the spotlight area
    const distance = Math.sqrt(
      (mouseX - centerPixelX) * (mouseX - centerPixelX) + 
      (mouseY - centerPixelY) * (mouseY - centerPixelY)
    );
    
    if (distance <= radiusPixels + 30) { // 30px tolerance
      this.isDragging = true;
      this.dragStartX = mouseX;
      this.dragStartY = mouseY;
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle mouse move for dragging
   */
  handleMouseMove(event, canvas) {
    if (!this.isDragging) return false;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = this.canvasWidth / rect.width;
    const scaleY = this.canvasHeight / rect.height;
    
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;
    
    // Update center position
    this.centerX = Math.max(0, Math.min(1, mouseX / this.canvasWidth));
    this.centerY = Math.max(0, Math.min(1, mouseY / this.canvasHeight));
    
    // Fire a custom event to notify UI components of the change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samplingAreaMoved', {
        detail: { centerX: this.centerX, centerY: this.centerY }
      }));
    }
    
    return true;
  }
  
  /**
   * Handle mouse release for drag end
   */
  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      return true;
    }
    return false;
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
      showZones: this.showZones,
      spotlightMode: this.spotlightMode,
      spotlightOpacity: this.spotlightOpacity,
      circleFeather: this.circleFeather,
      backgroundBlur: this.backgroundBlur,
      backgroundBlurAmount: this.backgroundBlurAmount,
      vignetteEnabled: this.vignetteEnabled,
      vignetteSize: this.vignetteSize,
      vignetteIntensity: this.vignetteIntensity
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
    if (config.spotlightMode !== undefined) {
      this.spotlightMode = config.spotlightMode;
    }
    if (config.spotlightOpacity !== undefined) {
      this.spotlightOpacity = config.spotlightOpacity;
    }
    if (config.circleFeather !== undefined) {
      this.circleFeather = config.circleFeather;
    }
    if (config.backgroundBlur !== undefined) {
      this.backgroundBlur = config.backgroundBlur;
    }
    if (config.backgroundBlurAmount !== undefined) {
      this.backgroundBlurAmount = config.backgroundBlurAmount;
    }
    if (config.vignetteEnabled !== undefined) {
      this.vignetteEnabled = config.vignetteEnabled;
    }
    if (config.vignetteSize !== undefined) {
      this.vignetteSize = config.vignetteSize;
    }
    if (config.vignetteIntensity !== undefined) {
      this.vignetteIntensity = config.vignetteIntensity;
    }
    
    this.updateZones();
  }
  
  /**
   * Debounced auto-save to avoid excessive localStorage writes
   */
  debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveStyleToLocalStorage();
    }, this.SAVE_DEBOUNCE_MS);
  }
  
  /**
   * Save current sampling area configuration to localStorage (complete settings)
   */
  saveStyleToLocalStorage() {
    const config = {
      // Position and size settings
      centerX: this.centerX,
      centerY: this.centerY,
      radius: this.radius,
      maxParticles: this.maxParticles,
      // Visual style settings
      spotlightMode: this.spotlightMode,
      spotlightOpacity: this.spotlightOpacity,
      circleFeather: this.circleFeather,
      backgroundBlur: this.backgroundBlur,
      backgroundBlurAmount: this.backgroundBlurAmount,
      vignetteEnabled: this.vignetteEnabled,
      vignetteSize: this.vignetteSize,
      vignetteIntensity: this.vignetteIntensity,
      showCrosshair: this.showCrosshair,
      showZones: this.showZones,
      // Organization settings
      organizationMode: this.organizationMode,
      organizationParams: { ...this.organizationParams }
    };
    
    try {
      localStorage.setItem('samplingAreaConfig', JSON.stringify(config));
      console.log('Sampling area configuration saved to localStorage');
    } catch (error) {
      console.warn('Failed to save sampling area configuration:', error);
    }
  }
  
  /**
   * Load sampling area configuration from localStorage
   */
  loadStyleFromLocalStorage() {
    try {
      // Try new format first
      let savedConfig = localStorage.getItem('samplingAreaConfig');
      let config = null;
      
      if (savedConfig) {
        config = JSON.parse(savedConfig);
      } else {
        // Fallback to old format for backward compatibility
        const savedStyle = localStorage.getItem('samplingAreaStyle');
        if (savedStyle) {
          config = JSON.parse(savedStyle);
        }
      }
      
      if (config) {
        // Apply all settings including position and radius
        if (config.centerX !== undefined) this.centerX = config.centerX;
        if (config.centerY !== undefined) this.centerY = config.centerY;
        if (config.radius !== undefined) this.radius = config.radius;
        if (config.maxParticles !== undefined) this.maxParticles = config.maxParticles;
        if (config.organizationMode !== undefined) this.organizationMode = config.organizationMode;
        if (config.organizationParams) {
          Object.assign(this.organizationParams, config.organizationParams);
        }
        
        // Apply visual style settings
        if (config.spotlightMode !== undefined) this.spotlightMode = config.spotlightMode;
        if (config.spotlightOpacity !== undefined) this.spotlightOpacity = config.spotlightOpacity;
        if (config.circleFeather !== undefined) this.circleFeather = config.circleFeather;
        if (config.backgroundBlur !== undefined) this.backgroundBlur = config.backgroundBlur;
        if (config.backgroundBlurAmount !== undefined) this.backgroundBlurAmount = config.backgroundBlurAmount;
        if (config.vignetteEnabled !== undefined) this.vignetteEnabled = config.vignetteEnabled;
        if (config.vignetteSize !== undefined) this.vignetteSize = config.vignetteSize;
        if (config.vignetteIntensity !== undefined) this.vignetteIntensity = config.vignetteIntensity;
        if (config.showCrosshair !== undefined) this.showCrosshair = config.showCrosshair;
        if (config.showZones !== undefined) this.showZones = config.showZones;
        
        this.updateZones();
        
        console.log('Sampling area configuration loaded from localStorage');
        
        // Fire event to notify UI components to sync their controls
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('samplingStyleLoaded', {
            detail: config
          }));
        }
        
        return true;
      }
    } catch (error) {
      console.warn('Failed to load sampling area configuration:', error);
    }
    
    return false;
  }
}