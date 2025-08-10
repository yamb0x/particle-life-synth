/**
 * Simplified Particle System inspired by Ventrella's Clusters
 * Focuses on asymmetric behaviors and visual interest
 */

// Pattern parameter defaults for configurable force patterns
const PATTERN_DEFAULTS = {
    clusters: {
        clusterType: 'orbital',
        cohesionStrength: 0.8,
        separationDistance: 0.5,
        formationBias: 0.6
    },
    'predator-prey': {
        ecosystemType: 'simple_chain',
        huntIntensity: 3.0,
        escapeIntensity: 2.5,
        populationBalance: 0.4
    },
    territorial: {
        territorySize: 0.3,
        boundaryStrength: 1.2,
        invasionResponse: 2.0
    },
    symbiotic: {
        cooperationStrength: 1.5,
        dependencyLevel: 0.7,
        mutualismType: 'obligate',
        competitionIntensity: 1.0
    },
    cyclic: {
        cycleSpeed: 1.0,
        dominanceStrength: 2.0,
        cycleComplexity: 'simple',
        stabilityFactor: 0.5
    }
};

import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';
import { NoiseGenerator } from '../utils/NoiseGenerator.js';

export class SimpleParticleSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
        this.particles = [];
        this.time = 0;
        
        // Performance optimizations
        this.spatialGrid = [];
        this.gridSize = 100; // Grid cell size for spatial partitioning
        this.gridWidth = Math.ceil(width / this.gridSize);
        this.gridHeight = Math.ceil(height / this.gridSize);
        this.initSpatialGrid();
        
        // Performance monitoring
        this.frameCount = 0;
        this.lastPerfCheck = 0;
        this.avgFrameTime = 16.67; // Target 60fps
        
        // Visual settings
        this.blur = 0.95; // Trail effect (0.5-0.99, higher = shorter trails)
        this.particleSize = 3;
        this.perSpeciesSize = true; // Always use per-species particle size
        this.trailEnabled = true;
        
        // Background color system
        this.backgroundMode = 'solid'; // 'solid' or 'sinusoidal'
        this.backgroundColor = '#000000'; // Default black background (used in solid mode)
        this.backgroundColor1 = '#000000'; // First color for sinusoidal mode
        this.backgroundColor2 = '#001133'; // Second color for sinusoidal mode
        this.backgroundCycleTime = 5.0; // Time in seconds to cycle between colors
        
        this.renderMode = 'normal'; // 'normal' or 'dreamtime'
        this.glowIntensity = 0.5; // 0-1, how strong the glow effect is
        this.glowRadius = 2.0; // Multiplier for glow size relative to particle size
        
        // Per-species glow values
        this.speciesGlowSize = new Array(10).fill(1.0); // Glow size multiplier (0.5-3.0)
        this.speciesGlowIntensity = new Array(10).fill(0); // Glow intensity (0-1)
        
        // Per-species halo values
        this.speciesHaloIntensity = new Array(20).fill(0); // Halo intensity (0-0.2)
        this.speciesHaloRadius = new Array(20).fill(1.0); // Halo radius multiplier (0.5-5.0)
        
        // Per-species trail values
        this.linkAllSpeciesTrails = true; // Link all species trails to global value (simplified UX)
        this.speciesTrailLength = new Array(20).fill(0.95); // Trail length per species (0.5-0.99)
        
        // Trail canvas cache for per-species trails
        this.trailCanvasCache = null;
        this.lastFrameImageData = null;
        
        // Physics settings
        this.friction = 0.98;
        this.wallDamping = 0.8;
        this.forceFactor = 0.5;
        
        // Wall behavior settings
        this.repulsiveForce = 0.3; // Strength of invisible repulsive barriers (0-1)
        this.wrapAroundWalls = false; // Enable wrap-around boundaries
        
        // Collision physics - always based on particle sizes
        this.collisionMultiplier = 1.0;   // Global multiplier for collision strength (0.5-5.0)
        this.collisionOffset = 0.0;       // Extra spacing between particles (0-10)
        
        // Breath feature - sinusoidal collision offset modulation
        this.breathEnabled = false;       // Enable breath behavior
        this.breathMin = 0.0;            // Minimum collision offset during breath cycle
        this.breathMax = 5.0;            // Maximum collision offset during breath cycle
        this.breathTime = 5.0;           // Time in seconds for complete breath cycle
        this.breathStartTime = 0;        // Start time for breath animation
        this.cachedBreathOffset = 0.0;   // Cached offset value to avoid repeated calculations
        
        // Advanced physics for organic behaviors
        this.enableDensityForces = false; // Density-dependent force modulation
        this.enableTimeModulation = false; // Time-varying forces
        this.chaosLevel = 0.0; // Legacy chaos - kept for backwards compatibility
        this.environmentalPressure = 0.0; // Global center attraction/repulsion (-1 to 1)
        
        // Advanced noise system
        this.noiseGenerator = new NoiseGenerator();
        this.noiseEnabled = false;
        this.noisePattern = 'perlin';
        this.noiseAmplitude = 0.0;
        this.noiseScale = 1.0;
        this.noiseTimeScale = 1.0
        
        // Species settings
        this.numSpecies = 5;
        this.particlesPerSpecies = 150;
        
        // Initialize species with distinct visual properties
        this.species = [];
        this.initializeSpecies();
        
        // Initialize per-species glow
        for (let i = 0; i < this.numSpecies; i++) {
            this.speciesGlowSize[i] = 1.0; // Default: normal size
            this.speciesGlowIntensity[i] = 0; // Default: no extra glow
        }
        
        // Initialize per-species halo
        for (let i = 0; i < this.numSpecies; i++) {
            this.speciesHaloIntensity[i] = 0; // Default: no halo
            this.speciesHaloRadius[i] = 1.0; // Default: normal radius
        }
        
        // Initialize per-species trails
        for (let i = 0; i < this.numSpecies; i++) {
            this.speciesTrailLength[i] = this.blur; // Default: same as global trail
        }
        
        // Asymmetric force matrices - the key to interesting behaviors!
        this.collisionRadius = this.createMatrix(15, 25); // Close range
        this.socialRadius = this.createMatrix(50, 150);   // Long range
        this.collisionForce = this.createMatrix(-1, -0.5); // Repulsion
        this.socialForce = this.createAsymmetricMatrix();  // Attraction/repulsion
        
        // Force pattern configuration
        this.forcePatternType = 'random';
        this.forceDistribution = 0.8; // Edge bias value
        this.forcePatternParameters = {}; // Pattern-specific parameters
        
        // Canvas reference
        this.canvas = null;
        this.ctx = null;
        
        // Shockwave system
        this.shockwaveEnabled = true;
        this.shockwaveStrength = 50; // Force strength (10-200)
        this.shockwaveSize = 150; // Radius of effect (40-600)
        this.shockwaveFalloff = 2.0; // Falloff power (0.5-5.0, higher = sharper falloff)
        this.activeShockwaves = []; // Active shockwave effects
        this.mousePressed = false; // Track mouse state for continuous shockwaves
        this.currentMousePos = { x: 0, y: 0 }; // Current mouse position
        
        // Cached gradients for performance
        this.gradientCache = new Map();
        this.haloGradientCache = new Map();
        
        // Object pools for memory optimization
        this.tempArrayPool = [];
        this.poolIndex = 0;
        
        // Mute/freeze functionality for performance saving
        this.muted = false;
        
        // Performance monitoring
        this.performanceMonitor = new PerformanceMonitor();
        this.performanceMode = 'auto'; // 'high', 'medium', 'low', 'auto'
        this.qualitySettings = {
            high: {
                trailEnabled: true,
                perSpeciesTrails: true,
                haloEnabled: true,
                particleGlow: true
            },
            medium: {
                trailEnabled: true,
                perSpeciesTrails: false,
                haloEnabled: true,
                particleGlow: false
            },
            low: {
                trailEnabled: false,
                perSpeciesTrails: false,
                haloEnabled: false,
                particleGlow: false
            }
        };
        
        // Initialize offscreen canvas for trail caching
        this.initializeTrailCache();
    }
    
    initializeTrailCache() {
        // Create offscreen canvas for trail caching
        if (typeof document !== 'undefined') {
            this.trailOffscreenCanvas = document.createElement('canvas');
            this.trailOffscreenCanvas.width = this.width;
            this.trailOffscreenCanvas.height = this.height;
            this.trailOffscreenCtx = this.trailOffscreenCanvas.getContext('2d');
        }
    }
    
    getCurrentCollisionOffset() {
        return this.breathEnabled ? this.cachedBreathOffset : this.collisionOffset;
    }
    
    updateBreathOffset() {
        if (!this.breathEnabled) {
            this.cachedBreathOffset = this.collisionOffset;
            return;
        }
        
        const currentTime = this.time / 60; // Convert to seconds
        const cyclePosition = (currentTime - this.breathStartTime) / this.breathTime;
        const breathPhase = cyclePosition * Math.PI * 2;
        
        // Sinusoidal interpolation between min and max
        const breathValue = (Math.sin(breathPhase) + 1) / 2; // 0 to 1
        this.cachedBreathOffset = this.breathMin + (this.breathMax - this.breathMin) * breathValue;
    }
    
    getPerformanceMetrics() {
        const metrics = this.performanceMonitor.getMetrics();
        const avgFrameTime = metrics.frameTime || 16.67;
        
        let level = 'high';
        let bottleneck = 'none';
        
        if (avgFrameTime > 33) {
            level = 'low';
            if (metrics.physicsTime > metrics.renderTime) {
                bottleneck = 'physics';
            } else {
                bottleneck = 'rendering';
            }
        } else if (avgFrameTime > 20) {
            level = 'medium';
            if (this.trailEnabled && metrics.trailTime > 5) {
                bottleneck = 'trails';
            }
        }
        
        return {
            fps: Math.round(1000 / avgFrameTime),
            frameTime: avgFrameTime,
            level: level,
            bottleneck: bottleneck,
            details: metrics
        };
    }
    
    initSpatialGrid() {
        // Validate grid dimensions before creating spatial grid
        if (!this.width || !this.height || this.width <= 0 || this.height <= 0) {
            console.error(`Invalid canvas dimensions: ${this.width}x${this.height}, cannot create spatial grid`);
            return;
        }
        
        // Recalculate grid dimensions to ensure they're current
        this.gridWidth = Math.ceil(this.width / this.gridSize);
        this.gridHeight = Math.ceil(this.height / this.gridSize);
        
        // Validate calculated grid dimensions
        if (this.gridWidth <= 0 || this.gridHeight <= 0) {
            console.error(`Invalid grid dimensions: ${this.gridWidth}x${this.gridHeight}`);
            return;
        }
        
        const totalCells = this.gridWidth * this.gridHeight;
        // Spatial grid initialized
        
        this.spatialGrid = [];
        for (let i = 0; i < totalCells; i++) {
            this.spatialGrid[i] = [];
        }
    }
    
    getGridIndex(x, y) {
        const gx = Math.floor(x / this.gridSize);
        const gy = Math.floor(y / this.gridSize);
        return Math.max(0, Math.min(this.gridWidth * this.gridHeight - 1, gy * this.gridWidth + gx));
    }
    
    updateSpatialGrid() {
        // Critical safety check: ensure spatial grid is properly initialized
        if (!this.spatialGrid || this.spatialGrid.length === 0) {
            console.warn('Spatial grid not initialized, reinitializing...');
            this.initSpatialGrid();
            // If initialization failed, skip update
            if (!this.spatialGrid || this.spatialGrid.length === 0) {
                console.error('Failed to initialize spatial grid, skipping update');
                return;
            }
        }
        
        // Validate grid size matches calculated dimensions
        const expectedSize = this.gridWidth * this.gridHeight;
        if (this.spatialGrid.length !== expectedSize) {
            console.warn(`Spatial grid size mismatch: expected ${expectedSize}, got ${this.spatialGrid.length}, reinitializing...`);
            this.initSpatialGrid();
            if (!this.spatialGrid || this.spatialGrid.length === 0) {
                console.error('Failed to reinitialize spatial grid');
                return;
            }
        }
        
        // Clear grid cells
        for (let i = 0; i < this.spatialGrid.length; i++) {
            if (Array.isArray(this.spatialGrid[i])) {
                this.spatialGrid[i].length = 0;
            } else {
                // Re-initialize this grid cell if it's corrupted
                this.spatialGrid[i] = [];
            }
        }
        
        // Add particles to grid cells with detailed error reporting
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Validate particle position
            if (isNaN(p.x) || isNaN(p.y)) {
                console.warn(`Particle ${i} has NaN position (${p.x}, ${p.y}), skipping spatial grid assignment`);
                continue;
            }
            
            const gridIndex = this.getGridIndex(p.x, p.y);
            
            // Comprehensive safety check for grid cell access
            if (gridIndex >= 0 && gridIndex < this.spatialGrid.length) {
                if (Array.isArray(this.spatialGrid[gridIndex])) {
                    this.spatialGrid[gridIndex].push(i);
                } else {
                    console.error(`Grid cell ${gridIndex} is not an array: ${typeof this.spatialGrid[gridIndex]}, reinitializing cell`);
                    this.spatialGrid[gridIndex] = [i];
                }
            } else {
                console.error(`Invalid grid index ${gridIndex} for particle ${i} at (${p.x}, ${p.y})`);
                console.error(`Grid dimensions: ${this.gridWidth}x${this.gridHeight}, canvas: ${this.width}x${this.height}`);
                console.error(`Grid size: ${this.gridSize}, calculated gx: ${Math.floor(p.x / this.gridSize)}, gy: ${Math.floor(p.y / this.gridSize)}`);
            }
        }
    }
    
    getNearbyParticles(particleIndex) {
        const p = this.particles[particleIndex];
        const gx = Math.floor(p.x / this.gridSize);
        const gy = Math.floor(p.y / this.gridSize);
        const nearby = [];
        
        // Check 3x3 grid around particle
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                let checkX = gx + dx;
                let checkY = gy + dy;
                
                if (this.wrapAroundWalls) {
                    // Handle toroidal wrapping for grid coordinates
                    if (checkX < 0) checkX = this.gridWidth - 1;
                    else if (checkX >= this.gridWidth) checkX = 0;
                    
                    if (checkY < 0) checkY = this.gridHeight - 1;
                    else if (checkY >= this.gridHeight) checkY = 0;
                } else {
                    // Standard boundary check for non-wrap mode
                    if (checkX < 0 || checkX >= this.gridWidth || checkY < 0 || checkY >= this.gridHeight) {
                        continue;
                    }
                }
                
                const gridIndex = checkY * this.gridWidth + checkX;
                if (gridIndex >= 0 && gridIndex < this.spatialGrid.length) {
                    nearby.push(...this.spatialGrid[gridIndex]);
                }
            }
        }
        
        // Debug logging for performance validation (can be removed in production)
        if (this.debugNearbyParticles && this.frameCount % 60 === 0) {
            const reduction = ((this.particles.length - nearby.length) / this.particles.length * 100).toFixed(1);
            console.log(`Wrap-around optimization: checking ${nearby.length}/${this.particles.length} particles (${reduction}% reduction)`);
        }
        
        return nearby;
    }
    
    getTempArray(size) {
        if (this.tempArrayPool.length <= this.poolIndex) {
            this.tempArrayPool.push(new Array(size));
        }
        const arr = this.tempArrayPool[this.poolIndex++];
        arr.length = 0; // Clear without deallocating
        return arr;
    }
    
    resetTempArrays() {
        this.poolIndex = 0;
    }
    
    getCurrentBackgroundColor() {
        if (this.backgroundMode === 'sinusoidal') {
            // Calculate sine wave position (0 to 1, oscillating)
            const sineValue = (Math.sin((this.time / this.backgroundCycleTime) * Math.PI * 2) + 1) / 2;
            
            // Parse colors to RGB values
            const color1 = this.hexToRgb(this.backgroundColor1);
            const color2 = this.hexToRgb(this.backgroundColor2);
            
            if (!color1 || !color2) {
                console.warn('Invalid background colors, falling back to solid black');
                return '#000000';
            }
            
            // Interpolate between the two colors using sine wave
            const r = Math.round(color1.r + (color2.r - color1.r) * sineValue);
            const g = Math.round(color1.g + (color2.g - color1.g) * sineValue);
            const b = Math.round(color1.b + (color2.b - color1.b) * sineValue);
            
            // Convert back to hex
            return this.rgbToHex(r, g, b);
        }
        
        // Default to solid color mode
        return this.backgroundColor;
    }
    
    clearCaches() {
        if (this.gradientCache) {
            this.gradientCache.clear();
        }
        if (this.haloGradientCache) {
            this.haloGradientCache.clear();
        }
        // Keep object pools but clear their contents
        if (this.tempArrayPool) {
            this.tempArrayPool.forEach(arr => arr.length = 0);
        }
    }
    
    applyTrailDecay() {
        // Get current background color (dynamic for sinusoidal mode)
        const currentBgColor = this.getCurrentBackgroundColor();
        
        if (this.linkAllSpeciesTrails) {
            // Linked mode: use global blur value (same as original behavior)
            const trailAlpha = 1 - this.blur;
            this.ctx.save();
            this.ctx.globalAlpha = trailAlpha;
            this.ctx.fillStyle = currentBgColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
        } else {
            // Per-species mode: apply different trail decay to different regions
            this.applyPerSpeciesTrailDecay(currentBgColor);
        }
    }
    
    applyPerSpeciesTrailDecay(bgColor) {
        // Simple approach: Apply different trail intensities to circular areas around each particle
        // This gives the visual effect of per-species trails without complex pixel manipulation
        
        this.ensureTrailArraysSize();
        
        // Parse background color
        let bgR = 0, bgG = 0, bgB = 0;
        if (bgColor.startsWith('#')) {
            const hex = bgColor.slice(1);
            bgR = parseInt(hex.substr(0, 2), 16) || 0;
            bgG = parseInt(hex.substr(2, 2), 16) || 0;
            bgB = parseInt(hex.substr(4, 2), 16) || 0;
        }
        
        this.ctx.save();
        
        // Apply trail decay for each species
        for (let speciesId = 0; speciesId < this.numSpecies; speciesId++) {
            const trailLength = this.speciesTrailLength[speciesId] || this.blur;
            const trailAlpha = 1 - trailLength;
            
            if (trailAlpha > 0) {
                // Create a radial gradient for smoother blending
                const speciesParticles = this.particles.filter(p => p.species === speciesId);
                
                for (const particle of speciesParticles) {
                    const radius = 25; // Influence radius around each particle
                    
                    // Create radial gradient from particle position
                    const gradient = this.ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, radius
                    );
                    
                    // Inner circle: full species trail effect
                    gradient.addColorStop(0, `rgba(${bgR}, ${bgG}, ${bgB}, ${trailAlpha})`);
                    // Outer edge: fade to transparent
                    gradient.addColorStop(1, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
                    
                    this.ctx.globalCompositeOperation = 'source-over';
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        this.ctx.restore();
    }
    
    // Species glow management API
    setSpeciesGlow(speciesId, settings) {
        if (speciesId < 0 || speciesId >= this.numSpecies) {
            console.warn(`Invalid species ID: ${speciesId}, must be 0-${this.numSpecies - 1}`);
            return false;
        }
        
        // Ensure arrays are properly sized
        this.ensureGlowArraysSize();
        
        if (settings.intensity !== undefined) {
            this.speciesGlowIntensity[speciesId] = Math.max(0, Math.min(1, settings.intensity));
        }
        
        if (settings.size !== undefined) {
            this.speciesGlowSize[speciesId] = Math.max(0.5, Math.min(3.0, settings.size));
        }
        
        return true;
    }
    
    getSpeciesGlow(speciesId) {
        if (speciesId < 0 || speciesId >= this.numSpecies) {
            console.warn(`Invalid species ID: ${speciesId}, must be 0-${this.numSpecies - 1}`);
            return { intensity: 0, size: 1.0 };
        }
        
        // Ensure arrays are properly sized
        this.ensureGlowArraysSize();
        
        return {
            intensity: this.speciesGlowIntensity[speciesId] || 0,
            size: this.speciesGlowSize[speciesId] || 1.0
        };
    }
    
    clearAllSpeciesGlow() {
        this.ensureGlowArraysSize();
        for (let i = 0; i < this.numSpecies; i++) {
            this.speciesGlowIntensity[i] = 0;
        }
    }
    
    // Per-species halo management API
    setSpeciesHalo(speciesId, settings) {
        if (speciesId < 0 || speciesId >= this.numSpecies) return false;
        
        this.ensureHaloArraysSize();
        
        if (settings.intensity !== undefined) {
            this.speciesHaloIntensity[speciesId] = Math.max(0, Math.min(0.2, settings.intensity));
        }
        
        if (settings.radius !== undefined) {
            this.speciesHaloRadius[speciesId] = Math.max(0.5, Math.min(5.0, settings.radius));
        }
        
        // Clear cache to force re-render
        this.gradientCache.clear();
        this.haloGradientCache.clear();
        
        return true;
    }
    
    getSpeciesHalo(speciesId) {
        if (speciesId < 0 || speciesId >= this.numSpecies) return null;
        
        this.ensureHaloArraysSize();
        
        return {
            intensity: this.speciesHaloIntensity[speciesId] || 0,
            radius: this.speciesHaloRadius[speciesId] || 1.0
        };
    }
    
    clearAllSpeciesHalo() {
        this.ensureHaloArraysSize();
        for (let i = 0; i < this.numSpecies; i++) {
            this.speciesHaloIntensity[i] = 0;
        }
        this.gradientCache.clear();
        this.haloGradientCache.clear();
    }
    
    // Per-species trail management API
    setSpeciesTrail(speciesId, trailLength) {
        if (speciesId < 0 || speciesId >= this.numSpecies) {
            console.warn(`Invalid species ID: ${speciesId}, must be 0-${this.numSpecies - 1}`);
            return false;
        }
        
        this.ensureTrailArraysSize();
        this.speciesTrailLength[speciesId] = Math.max(0.5, Math.min(0.99, trailLength));
        return true;
    }
    
    getSpeciesTrail(speciesId) {
        if (speciesId < 0 || speciesId >= this.numSpecies) {
            console.warn(`Invalid species ID: ${speciesId}, must be 0-${this.numSpecies - 1}`);
            return this.blur; // Fallback to global value
        }
        
        this.ensureTrailArraysSize();
        return this.speciesTrailLength[speciesId] || this.blur;
    }
    
    resetAllSpeciesTrails() {
        this.ensureTrailArraysSize();
        for (let i = 0; i < this.numSpecies; i++) {
            this.speciesTrailLength[i] = this.blur; // Reset to global value
        }
    }
    
    // Sync all species trails to global blur value (when linking is enabled)
    syncAllSpeciesTrails() {
        if (this.linkAllSpeciesTrails) {
            this.resetAllSpeciesTrails();
        }
    }
    
    // Set global blur and optionally sync all species
    setGlobalBlur(value) {
        this.blur = value;
        if (this.linkAllSpeciesTrails) {
            this.syncAllSpeciesTrails();
        }
    }
    
    ensureGlowArraysSize() {
        // Resize arrays if needed
        if (this.speciesGlowIntensity.length < this.numSpecies) {
            this.speciesGlowIntensity = Array.from({ length: this.numSpecies }, (_, i) => 
                this.speciesGlowIntensity[i] || 0
            );
        }
        
        if (this.speciesGlowSize.length < this.numSpecies) {
            this.speciesGlowSize = Array.from({ length: this.numSpecies }, (_, i) => 
                this.speciesGlowSize[i] || 1.0
            );
        }
    }
    
    ensureHaloArraysSize() {
        // Resize halo arrays if needed
        if (this.speciesHaloIntensity.length < this.numSpecies) {
            this.speciesHaloIntensity = Array.from({ length: this.numSpecies }, (_, i) => 
                this.speciesHaloIntensity[i] || 0
            );
        }
        
        if (this.speciesHaloRadius.length < this.numSpecies) {
            this.speciesHaloRadius = Array.from({ length: this.numSpecies }, (_, i) => 
                this.speciesHaloRadius[i] || 1.0
            );
        }
    }
    
    ensureTrailArraysSize() {
        // Resize trail arrays if needed
        if (this.speciesTrailLength.length < this.numSpecies) {
            this.speciesTrailLength = Array.from({ length: this.numSpecies }, (_, i) => 
                this.speciesTrailLength[i] || this.blur
            );
        }
    }
    
    // Species count management API
    // Alias for compatibility
    setNumSpecies(newCount) {
        return this.setSpeciesCount(newCount);
    }
    
    setSpeciesCount(newCount) {
        if (newCount < 1 || newCount > 20) {
            console.warn(`Invalid species count: ${newCount}, must be 1-20`);
            return false;
        }
        
        // Critical validation: Ensure canvas dimensions are set
        if (!this.width || !this.height || this.width <= 0 || this.height <= 0) {
            console.error(`Cannot change species count: invalid canvas dimensions ${this.width}x${this.height}`);
            return false;
        }
        
        // Changing species count
        
        const oldCount = this.numSpecies;
        this.numSpecies = newCount;
        
        // Preserve existing force matrices where possible
        this.preserveAndResizeForceMatrices(oldCount, newCount);
        
        // Resize glow arrays
        this.ensureGlowArraysSize();
        
        // Resize halo arrays
        this.ensureHaloArraysSize();
        
        // Resize trail arrays
        this.ensureTrailArraysSize();
        
        // Resize species array
        this.resizeSpeciesArray(oldCount, newCount);
        
        // CRITICAL FIX: Reinitialize spatial grid BEFORE reinitializing particles
        // This ensures the grid is properly sized for the new particle configuration
        // Reinitializing spatial grid
        this.initSpatialGrid();
        
        // Validate spatial grid was created successfully
        if (!this.spatialGrid || this.spatialGrid.length === 0) {
            console.error('Failed to initialize spatial grid, aborting species count change');
            this.numSpecies = oldCount; // Revert
            return false;
        }
        
        // Spatial grid ready
        
        // Reinitialize particles with new species count
        // Reinitializing particles
        this.initializeParticlesWithPositions();
        
        // Particles ready
        
        // Update spatial grid with new particles to prevent undefined grid cell access
        // Updating spatial grid
        this.updateSpatialGrid();
        
        // Species count change completed
        
        // Update main UI elements to stay in sync
        this.updateMainUISpeciesCount(newCount);
        
        return true;
    }
    
    updateMainUISpeciesCount(newCount) {
        // Update main UI elements (not modal elements)
        const allSliders = document.querySelectorAll('#species-count');
        const allDisplays = document.querySelectorAll('#species-count-value');
        
        // Update main UI slider (not in modal)
        for (const slider of allSliders) {
            if (!slider.closest('.preset-modal')) {
                slider.value = newCount;
                break;
            }
        }
        
        // Update main UI display (not in modal)
        for (const display of allDisplays) {
            if (!display.closest('.preset-modal')) {
                display.textContent = newCount;
                break;
            }
        }
        
        // UI updated for species count
    }
    
    preserveAndResizeForceMatrices(oldCount, newCount) {
        // Preserve collision radius
        const oldCollisionRadius = this.collisionRadius;
        const defaultCollisionRadius = oldCollisionRadius[0] ? oldCollisionRadius[0][0] : 15;
        this.collisionRadius = this.createMatrix(defaultCollisionRadius, defaultCollisionRadius);
        
        // Preserve social radius
        const oldSocialRadius = this.socialRadius;
        const defaultSocialRadius = oldSocialRadius[0] ? oldSocialRadius[0][0] : 50;
        this.socialRadius = this.createMatrix(defaultSocialRadius, defaultSocialRadius);
        
        // Preserve collision force
        const oldCollisionForce = this.collisionForce;
        const defaultCollisionForce = oldCollisionForce[0] ? oldCollisionForce[0][0] : -0.5;
        this.collisionForce = this.createMatrix(defaultCollisionForce, defaultCollisionForce);
        
        // Preserve existing social forces where possible
        const oldSocialForce = this.socialForce;
        const newSocialForce = this.createAsymmetricMatrix();
        
        if (oldSocialForce && Array.isArray(oldSocialForce)) {
            for (let i = 0; i < Math.min(oldCount, newCount); i++) {
                for (let j = 0; j < Math.min(oldCount, newCount); j++) {
                    if (oldSocialForce[i] && oldSocialForce[i][j] !== undefined) {
                        newSocialForce[i][j] = oldSocialForce[i][j];
                    }
                }
            }
        }
        
        this.socialForce = newSocialForce;
    }
    
    resizeSpeciesArray(oldCount, newCount) {
        // Preserve existing species configurations
        const oldSpecies = [...this.species];
        this.species = [];
        
        for (let i = 0; i < newCount; i++) {
            if (i < oldCount && oldSpecies[i]) {
                // Keep existing species configuration but ensure size is synchronized
                this.species[i] = { ...oldSpecies[i] };
                // Ensure size is updated if not per-species mode
                if (!this.perSpeciesSize) {
                    this.species[i].size = this.particleSize;
                }
                // Ensure color is properly set (fix undefined color issue)
                if (!this.species[i].color || typeof this.species[i].color !== 'object' || 
                    this.species[i].color.r === undefined || this.species[i].color.g === undefined || this.species[i].color.b === undefined) {
                    this.species[i].color = this.generateSpeciesColor(i);
                }
                // Ensure advanced properties are set (fix missing mobility/inertia)
                if (this.species[i].mobility === undefined) {
                    this.species[i].mobility = 1.5; // Default center value
                }
                if (this.species[i].inertia === undefined) {
                    this.species[i].inertia = 0.85; // Default center value
                }
                if (this.species[i].opacity === undefined) {
                    this.species[i].opacity = 0.8 + Math.random() * 0.2;
                }
            } else {
                // Create new species with default configuration
                this.species[i] = {
                    color: this.generateSpeciesColor(i),
                    size: this.particleSize + (this.perSpeciesSize ? (Math.random() - 0.5) * this.particleSize * 0.5 : 0),
                    opacity: 0.8 + Math.random() * 0.2,
                    particleCount: this.particlesPerSpecies,
                    mobility: 1.5, // Default center value
                    inertia: 0.85, // Default center value
                    startPosition: {
                        type: 'cluster',
                        center: { x: 0.5, y: 0.5 },
                        radius: 0.2
                    }
                };
            }
        }
    }
    
    generateSpeciesColor(index) {
        // Generate consistent colors for species
        const hue = (index * 137.5) % 360; // Golden angle spacing
        // Convert HSL to RGB object for consistency
        return this.hslToRgb(hue, 70, 60);
    }
    
    // Color conversion utilities
    hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r, g, b;
        
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    getSpeciesName(index) {
        if (!this.species[index]) return `Species ${index + 1}`;
        
        const color = this.species[index].color;
        if (!color) return `Species ${index + 1}`;
        
        // Calculate dominant color component
        const r = color.r || 0;
        const g = color.g || 0;
        const b = color.b || 0;
        
        // Calculate hue from RGB
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        if (delta === 0) {
            // Grayscale
            if (max > 200) return 'White';
            if (max > 100) return 'Gray';
            return 'Black';
        }
        
        let hue = 0;
        if (max === r) {
            hue = ((g - b) / delta) % 6;
        } else if (max === g) {
            hue = (b - r) / delta + 2;
        } else {
            hue = (r - g) / delta + 4;
        }
        hue = Math.round(hue * 60);
        if (hue < 0) hue += 360;
        
        // Map hue to color names
        if (hue >= 0 && hue < 15) return 'Red';
        if (hue >= 15 && hue < 45) return 'Orange';
        if (hue >= 45 && hue < 65) return 'Yellow';
        if (hue >= 65 && hue < 150) return 'Green';
        if (hue >= 150 && hue < 190) return 'Cyan';
        if (hue >= 190 && hue < 250) return 'Blue';
        if (hue >= 250 && hue < 290) return 'Purple';
        if (hue >= 290 && hue < 330) return 'Magenta';
        if (hue >= 330 && hue <= 360) return 'Red';
        
        return `Species ${index + 1}`;
    }
    
    normalizeColor(color) {
        // Ensure color is in RGB object format
        if (typeof color === 'string') {
            if (color.startsWith('#')) {
                return this.hexToRgb(color);
            } else if (color.startsWith('hsl')) {
                // Parse HSL string and convert
                const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                if (hslMatch) {
                    return this.hslToRgb(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]));
                }
            }
        }
        return color; // Already RGB object
    }
    
    initializeSpecies() {
        // Clear caches when species change
        this.clearCaches();
        
        // Create visually distinct species with unique properties
        const baseColors = [
            { r: 255, g: 100, b: 100, name: 'Red' },    // Warm red
            { r: 100, g: 255, b: 100, name: 'Green' },  // Bright green
            { r: 100, g: 150, b: 255, name: 'Blue' },   // Cool blue
            { r: 255, g: 200, b: 100, name: 'Yellow' }, // Warm yellow
            { r: 255, g: 100, b: 255, name: 'Purple' }  // Vibrant purple
        ];
        
        this.species = []; // Clear existing species
        for (let i = 0; i < this.numSpecies; i++) {
            const baseColor = baseColors[i % baseColors.length];
            this.species[i] = {
                color: { r: baseColor.r, g: baseColor.g, b: baseColor.b },
                name: baseColor.name,
                size: this.particleSize + (Math.random() - 0.5) * this.particleSize * 0.5, // Vary species size ±25%
                opacity: 0.8 + Math.random() * 0.2, // Vary particle opacity
                particleCount: this.particlesPerSpecies,
                mobility: 1.5, // Speed multiplier (default center)
                inertia: 0.85, // Individual friction (default center)
                startPosition: {
                    type: this.startPattern || 'cluster',
                    center: { x: 0.5, y: 0.5 },
                    radius: 0.2
                }
            };
            
            // Ensure size is always positive and reasonable
            this.species[i].size = Math.max(0.5, Math.min(10, this.species[i].size));
        }
        
        // Reinitialize per-species glow for new species count
        for (let i = 0; i < this.numSpecies; i++) {
            if (this.speciesGlowSize[i] === undefined) {
                this.speciesGlowSize[i] = 1.0;
            }
            if (this.speciesGlowIntensity[i] === undefined) {
                this.speciesGlowIntensity[i] = 0;
            }
        }
        
        // Reinitialize per-species trails for new species count
        for (let i = 0; i < this.numSpecies; i++) {
            if (this.speciesTrailLength[i] === undefined) {
                this.speciesTrailLength[i] = this.blur;
            }
        }
        
        // Reinitialize force matrices for new species count with improved ranges
        this.collisionRadius = this.createMatrix(10, 35); // Expanded range for better clustering
        this.socialRadius = this.createMatrix(40, 200);   // Wider social interactions
        this.collisionForce = this.createMatrix(-2, -0.3); // Stronger collision forces
        this.socialForce = this.createAsymmetricMatrix();  // Enhanced clustering patterns
    }
    
    createMatrix(min, max) {
        const matrix = [];
        for (let i = 0; i < this.numSpecies; i++) {
            matrix[i] = [];
            for (let j = 0; j < this.numSpecies; j++) {
                matrix[i][j] = min + Math.random() * (max - min);
            }
        }
        return matrix;
    }
    
    createAsymmetricMatrix() {
        const matrix = [];
        
        // Enhanced pattern generation inspired by "clusters" project
        const generatePatternRow = (rowIndex, numSpecies) => {
            const row = new Array(numSpecies);
            
            // Create sophisticated clustering patterns for complex emergent behaviors
            for (let j = 0; j < numSpecies; j++) {
                if (rowIndex === j) {
                    // Self-interaction: mild cohesion to promote clustering
                    row[j] = 0.3 + Math.random() * 0.8; // 0.3-1.1 range for gentle self-attraction
                } else {
                    const speciesDist = Math.abs(j - rowIndex);
                    const cyclicDist = Math.min(speciesDist, numSpecies - speciesDist);
                    const relationship = (j - rowIndex + numSpecies) % numSpecies;
                    
                    // Create multi-layered interaction patterns
                    if (cyclicDist === 1) {
                        // Adjacent species: strong predator-prey dynamics
                        if (relationship === 1) {
                            // Hunt the next species - strong attraction with some variation
                            row[j] = 1.8 + Math.random() * 1.4; // 1.8-3.2 range
                        } else {
                            // Flee from the previous species - strong repulsion
                            row[j] = -2.2 - Math.random() * 1.3; // -3.5 to -2.2 range
                        }
                    } else if (cyclicDist === 2) {
                        // Species two steps away: moderate interactions for clustering
                        const clusterBias = Math.random() > 0.6 ? 1 : -1;
                        row[j] = clusterBias * (0.8 + Math.random() * 1.2); // ±0.8-2.0 range
                    } else if (cyclicDist <= Math.ceil(numSpecies / 4)) {
                        // Close species: create cluster formation tendencies
                        const attractionBias = Math.random() > 0.3 ? 1 : -1;
                        row[j] = attractionBias * (0.4 + Math.random() * 1.1); // ±0.4-1.5 range
                    } else if (cyclicDist <= Math.ceil(numSpecies / 2)) {
                        // Medium distance: mixed interactions for dynamic patterns
                        row[j] = -0.5 + Math.random() * 2.0; // -0.5 to 1.5 range
                    } else {
                        // Distant species: weak interactions to maintain system coherence
                        row[j] = -0.3 + Math.random() * 0.8; // -0.3 to 0.5 range
                    }
                }
            }
            return row;
        };
        
        for (let i = 0; i < this.numSpecies; i++) {
            matrix[i] = generatePatternRow(i, this.numSpecies);
            
            // Add controlled randomness for emergent complexity
            for (let j = 0; j < this.numSpecies; j++) {
                matrix[i][j] += (Math.random() - 0.5) * 0.8; // Reduced randomness for more predictable clustering
                matrix[i][j] = Math.max(-5, Math.min(5, matrix[i][j])); // Clamp to [-5,5] range
            }
        }
        return matrix;
    }
    
    createAsymmetricMatrixWithDistribution(edgeBias = 0.5) {
        const matrix = [];
        
        // Helper function to generate edge-biased random values
        const edgeBiasedRandom = (min, max, bias) => {
            const range = max - min;
            let random = Math.random();
            
            if (bias > 0.5) {
                // Bias towards edges (extreme values)
                const edgeStrength = (bias - 0.5) * 2; // Map 0.5-1.0 to 0.0-1.0
                
                // Use power function to push values towards edges
                if (Math.random() < 0.5) {
                    // Push towards minimum edge
                    random = Math.pow(random, 1 + edgeStrength * 3);
                } else {
                    // Push towards maximum edge
                    random = 1 - Math.pow(1 - random, 1 + edgeStrength * 3);
                }
            } else if (bias < 0.5) {
                // Bias towards center (more uniform)
                const centerStrength = (0.5 - bias) * 2; // Map 0.0-0.5 to 1.0-0.0
                
                // Use inverse power function to push values towards center
                random = 0.5 + (random - 0.5) * Math.pow(Math.abs(random - 0.5) * 2, 1 - centerStrength * 0.8);
            }
            // If bias == 0.5, use uniform random (no modification needed)
            
            return min + random * range;
        };
        
        // Dynamic pattern generation that works for any number of species
        const generatePatternRow = (rowIndex, numSpecies, bias) => {
            const row = new Array(numSpecies);
            
            // Create interesting predator-prey patterns that scale with species count
            for (let j = 0; j < numSpecies; j++) {
                if (rowIndex === j) {
                    // Self-interaction: weak positive or neutral (scaled for [-5,5] range)
                    row[j] = edgeBiasedRandom(0.5, 2.5, bias);
                } else {
                    // Different pattern types based on relationship (scaled for [-5,5] range)
                    const relationship = (j - rowIndex + numSpecies) % numSpecies;
                    
                    if (relationship === 1) {
                        // Chase next species (clockwise predator-prey) - strong attraction
                        row[j] = edgeBiasedRandom(2.5, 4.5, bias);
                    } else if (relationship === numSpecies - 1) {
                        // Flee from previous species (avoid being prey) - strong repulsion
                        row[j] = edgeBiasedRandom(-4.5, -1.5, bias);
                    } else if (relationship <= numSpecies / 3) {
                        // Neutral to moderate interactions for nearby species
                        row[j] = edgeBiasedRandom(-0.5, 1.5, bias);
                    } else if (relationship <= 2 * numSpecies / 3) {
                        // Mixed interactions for middle-distance species
                        row[j] = edgeBiasedRandom(-1.5, 1.5, bias);
                    } else {
                        // Moderate interactions for distant species
                        row[j] = edgeBiasedRandom(-1.0, 1.0, bias);
                    }
                }
            }
            return row;
        };
        
        for (let i = 0; i < this.numSpecies; i++) {
            matrix[i] = generatePatternRow(i, this.numSpecies, edgeBias);
            
            // Add some randomness and ensure values stay in valid range
            for (let j = 0; j < this.numSpecies; j++) {
                matrix[i][j] += edgeBiasedRandom(-0.15, 0.15, edgeBias);
                matrix[i][j] = Math.max(-1, Math.min(1, matrix[i][j]));
            }
        }
        return matrix;
    }
    
    // Force Pattern Presets - Creates specific ecological relationships
    createForcePattern(patternType, edgeBias = 0.8, userParameters = {}) {
        // Merge user parameters with defaults for this pattern
        const defaultParams = PATTERN_DEFAULTS[patternType] || {};
        const parameters = { ...defaultParams, ...userParameters };
        
        switch (patternType) {
            case 'clusters':
                return this.createClustersPattern(edgeBias, parameters);
            case 'predator-prey':
                return this.createPredatorPreyPattern(edgeBias, parameters);
            case 'territorial':
                return this.createTerritorialPattern(edgeBias, parameters);
            case 'symbiotic':
                return this.createSymbioticPattern(edgeBias, parameters);
            case 'cyclic':
                return this.createCyclicPattern(edgeBias, parameters);
            case 'random':
            default:
                return this.createAsymmetricMatrixWithDistribution(edgeBias);
        }
    }
    
    // Enhanced Clusters Pattern - Creates sophisticated stable cluster formations inspired by "clusters" project
    createClustersPattern(edgeBias, parameters = {}) {
        const matrix = [];
        
        for (let i = 0; i < this.numSpecies; i++) {
            matrix[i] = new Array(this.numSpecies).fill(0);
        }
        
        // Extract all parameters at the beginning
        const cohesionStrength = parameters.cohesionStrength || 0.8;
        const separationDistance = parameters.separationDistance || 0.5;
        const formationBias = parameters.formationBias || 0.6;
        
        // Use configurable cluster type instead of random selection
        const clusterTypes = ['orbital', 'layered', 'competitive_clustering', 'symbiotic_chains', 'hierarchical_rings'];
        const chosenType = parameters.clusterType || clusterTypes[Math.floor(Math.random() * clusterTypes.length)];
        
        for (let i = 0; i < this.numSpecies; i++) {
            for (let j = 0; j < this.numSpecies; j++) {
                if (i === j) {
                    // Self-cohesion for cluster stability - scaled by cohesionStrength parameter
                    const randomFactor = (1 - formationBias) * Math.random() + formationBias * 0.5;
                    
                    let baseCohesion = 1.8; // Default base value
                    
                    switch (chosenType) {
                        case 'orbital':
                            baseCohesion = 1.8 + randomFactor * 0.8;
                            break;
                        case 'layered':
                            // Layer-dependent cohesion
                            const layer = i % 3;
                            baseCohesion = 1.5 + layer * 0.4 + randomFactor * 0.6;
                            break;
                        case 'competitive_clustering':
                            baseCohesion = 2.2 + randomFactor * 1.0;
                            break;
                        case 'symbiotic_chains':
                            baseCohesion = 1.4 + randomFactor * 0.8;
                            break;
                        case 'hierarchical_rings':
                            // Ring-based hierarchy
                            const ringPos = i % Math.ceil(this.numSpecies / 3);
                            baseCohesion = 1.6 + ringPos * 0.3 + randomFactor * 0.5;
                            break;
                    }
                    
                    matrix[i][j] = baseCohesion * cohesionStrength;
                } else {
                    const speciesDiff = Math.abs(i - j);
                    const cyclicDist = Math.min(speciesDiff, this.numSpecies - speciesDiff);
                    const relationship = (j - i + this.numSpecies) % this.numSpecies;
                    
                    switch (chosenType) {
                        case 'orbital':
                            // Create orbital patterns with attraction/repulsion zones
                            // Use formationBias to control orbital tightness (0=loose, 1=tight)
                            const orbitalTightness = 1 + formationBias * 2; // 1.0 to 3.0
                            
                            if (cyclicDist === 1) {
                                // Adjacent species create orbital pairs
                                // cohesionStrength affects attraction, separationDistance affects repulsion
                                const attraction = (2.5 * cohesionStrength * orbitalTightness) + Math.random() * 1.2;
                                const repulsion = (-1.8 * (1 + separationDistance)) - Math.random() * 0.8;
                                matrix[i][j] = relationship === 1 ? attraction : repulsion;
                            } else if (cyclicDist === 2) {
                                // Secondary orbital influences - affected by formationBias
                                matrix[i][j] = (0.4 * cohesionStrength * (1 - formationBias * 0.5)) + Math.random() * 0.8;
                            } else {
                                // Distant repulsion maintains orbital separation
                                matrix[i][j] = (-0.6 * (1 + separationDistance)) - Math.random() * 0.4;
                            }
                            break;
                            
                        case 'layered':
                            // Create layered cluster structures
                            const iLayer = Math.floor(i / Math.ceil(this.numSpecies / 3));
                            const jLayer = Math.floor(j / Math.ceil(this.numSpecies / 3));
                            
                            // formationBias controls layer density (0=spread out, 1=compact)
                            const layerCompactness = 1 + formationBias * 1.5;
                            
                            if (iLayer === jLayer) {
                                // Same layer: strong attraction scaled by cohesionStrength
                                matrix[i][j] = (1.2 * cohesionStrength * layerCompactness) + Math.random() * 1.0;
                            } else if (Math.abs(iLayer - jLayer) === 1) {
                                // Adjacent layers: interaction controlled by separationDistance
                                const layerInteraction = 0.2 * (1 - separationDistance) * cohesionStrength;
                                matrix[i][j] = layerInteraction + Math.random() * 0.6;
                            } else {
                                // Distant layers: repulsion scaled by separationDistance
                                matrix[i][j] = (-0.8 * (1 + separationDistance * 2)) - Math.random() * 0.5;
                            }
                            break;
                            
                        case 'competitive_clustering':
                            // Intra-cluster attraction, inter-cluster competition
                            const clusterSize = Math.max(2, Math.floor(this.numSpecies / 3));
                            const iCluster = Math.floor(i / clusterSize);
                            const jCluster = Math.floor(j / clusterSize);
                            
                            // formationBias controls cluster aggression (0=peaceful, 1=competitive)
                            const competitiveness = 1 + formationBias * 2;
                            
                            if (iCluster === jCluster) {
                                // Same cluster: very strong attraction scaled by cohesionStrength
                                matrix[i][j] = (2.0 * cohesionStrength * competitiveness) + Math.random() * 1.5;
                            } else {
                                // Different clusters: repulsion scaled by separationDistance and formationBias
                                const repulsionForce = -2.5 * (1 + separationDistance) * competitiveness;
                                matrix[i][j] = repulsionForce - Math.random() * 1.0;
                            }
                            break;
                            
                        case 'symbiotic_chains':
                            // Create chain-like symbiotic relationships
                            // cohesionStrength controls chain bond strength
                            // formationBias controls chain flexibility (0=flexible, 1=rigid)
                            const chainRigidity = 1 + formationBias * 1.5;
                            
                            if (cyclicDist === 1) {
                                // Chain links - strong bonds scaled by parameters
                                matrix[i][j] = (3.0 * cohesionStrength * chainRigidity) + Math.random() * 1.0;
                            } else if (cyclicDist === 2) {
                                // Secondary chain influences - controlled by separationDistance
                                const secondaryInfluence = -0.5 + (1 - separationDistance) * 1.5;
                                matrix[i][j] = secondaryInfluence + Math.random() * 1.2;
                            } else {
                                // Anti-clustering for chain separation
                                matrix[i][j] = (-1.2 * (1 + separationDistance)) - Math.random() * 0.8;
                            }
                            break;
                            
                        case 'hierarchical_rings':
                            // Concentric ring structures with hierarchy
                            const ringSize = Math.ceil(this.numSpecies / 3);
                            const iRing = Math.floor(i / ringSize);
                            const jRing = Math.floor(j / ringSize);
                            const iPos = i % ringSize;
                            const jPos = j % ringSize;
                            
                            // formationBias controls ring hierarchy strength (0=equal, 1=strict hierarchy)
                            const hierarchyStrength = 1 + formationBias * 2;
                            
                            if (iRing === jRing) {
                                // Same ring: orbital attraction
                                const ringDist = Math.min(Math.abs(iPos - jPos), ringSize - Math.abs(iPos - jPos));
                                if (ringDist === 1) {
                                    // Adjacent in ring - strong attraction
                                    matrix[i][j] = (2.8 * cohesionStrength * hierarchyStrength) + Math.random() * 0.7;
                                } else {
                                    // Non-adjacent in ring - mild repulsion scaled by separationDistance
                                    matrix[i][j] = (-0.3 * (1 + separationDistance)) + Math.random() * 0.8;
                                }
                            } else {
                                // Different rings: hierarchical interaction based on ring level
                                const ringDiff = jRing - iRing;
                                if (ringDiff === 1) {
                                    // Outer attracts inner - scaled by hierarchy and cohesion
                                    matrix[i][j] = (1.5 * cohesionStrength * hierarchyStrength) + Math.random() * 0.8;
                                } else if (ringDiff === -1) {
                                    // Inner repels outer - scaled by separation
                                    matrix[i][j] = (-0.8 * (1 + separationDistance)) - Math.random() * 0.6;
                                } else {
                                    // Distant ring repulsion
                                    matrix[i][j] = (-0.4 * (1 + separationDistance * 1.5)) - Math.random() * 0.4;
                                }
                            }
                            break;
                    }
                }
                
                // Enhanced edge bias with cluster-appropriate scaling
                if (edgeBias > 0.5) {
                    const edgeStrength = Math.pow((edgeBias - 0.5) * 2, 1.2);
                    if (Math.random() < 0.6) {
                        if (matrix[i][j] > 0) {
                            matrix[i][j] *= (1 + edgeStrength * 0.6); // Enhance attractions
                        } else {
                            matrix[i][j] *= (1 + edgeStrength * 0.4); // Moderate repulsion enhancement
                        }
                    }
                }
                
                // Clamp to valid range
                matrix[i][j] = Math.max(-5, Math.min(5, matrix[i][j]));
            }
        }
        
        // Note: separationDistance is now incorporated directly into each cluster type above
        // This provides more nuanced control for each pattern type
        
        // Generated cluster pattern
        return matrix;
    }
    
    createPredatorPreyPattern(edgeBias, parameters = {}) {
        const matrix = [];
        for (let i = 0; i < this.numSpecies; i++) {
            matrix[i] = new Array(this.numSpecies).fill(0);
        }
        
        // Extract all parameters
        const ecosystemType = parameters.ecosystemType || 'simple_chain';
        const huntIntensity = parameters.huntIntensity || 3.0;
        const escapeIntensity = parameters.escapeIntensity || 2.5;
        const populationBalance = parameters.populationBalance || 0.4;
        
        // Create complex predator-prey ecosystem with multiple trophic levels
        // Use populationBalance parameter: 0.2 = few predators, 0.8 = many predators
        const numPredators = Math.max(1, Math.floor(this.numSpecies * populationBalance));
        const numPrey = Math.max(1, Math.floor(this.numSpecies * (0.8 - populationBalance))); // Inverse relationship
        const numOmnivores = Math.max(0, this.numSpecies - numPredators - numPrey); // Rest are omnivores
        
        // Assign roles
        const roles = [];
        for (let i = 0; i < numPredators; i++) roles.push('predator');
        for (let i = 0; i < numPrey; i++) roles.push('prey');
        for (let i = 0; i < numOmnivores; i++) roles.push('omnivore');
        
        // Shuffle roles for random assignment
        for (let i = roles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roles[i], roles[j]] = [roles[j], roles[i]];
        }
        
        // Create relationships based on roles
        for (let i = 0; i < this.numSpecies; i++) {
            for (let j = 0; j < this.numSpecies; j++) {
                if (i === j) {
                    // Self-attraction varies by role
                    matrix[i][j] = roles[i] === 'prey' ? 1.5 + Math.random() * 1.0 : // Prey flock strongly
                                  roles[i] === 'predator' ? 0.5 + Math.random() * 0.5 : // Predators mild flocking
                                  0.8 + Math.random() * 0.7; // Omnivores moderate flocking
                } else {
                    const role1 = roles[i];
                    const role2 = roles[j];
                    
                    if (role1 === 'predator' && role2 === 'prey') {
                        // Hunt intensity parameter controls predator attraction to prey
                        const huntIntensity = parameters.huntIntensity || 3.0;
                        matrix[i][j] = huntIntensity * (0.6 + Math.random() * 0.4); // Scale base hunt drive
                    } else if (role1 === 'prey' && role2 === 'predator') {
                        // Escape intensity parameter controls prey repulsion from predators
                        const escapeIntensity = parameters.escapeIntensity || 2.5;
                        matrix[i][j] = -escapeIntensity * (1.0 + Math.random() * 0.5); // Scale base fear response
                    } else if (role1 === 'predator' && role2 === 'predator') {
                        matrix[i][j] = -1.0 - Math.random() * 1.5; // Territorial competition
                    } else if (role1 === 'prey' && role2 === 'prey') {
                        matrix[i][j] = 0.5 + Math.random() * 1.0; // Mutual benefit
                    } else if (role1 === 'omnivore' || role2 === 'omnivore') {
                        // Omnivores have complex, mixed relationships
                        matrix[i][j] = -1.0 + Math.random() * 2.0; // Highly variable
                    } else {
                        matrix[i][j] = -0.2 + Math.random() * 0.4; // Neutral
                    }
                }
            }
        }
        
        // Generated predator-prey pattern
        return matrix;
    }
    
    createTerritorialPattern(edgeBias, parameters = {}) {
        // Extract all parameters at the beginning
        const territorySize = parameters.territorySize || 0.3;
        const boundaryStrength = parameters.boundaryStrength || 1.2;
        const invasionResponse = parameters.invasionResponse || 2.0;
        
        const matrix = [];
        
        // Territory size affects self-attraction (larger territories = stronger cohesion)
        // Enhanced scaling: smaller territories = tighter groups, larger = more spread
        const baseCohesion = 0.8 + (territorySize * 3.0); // Scale: 0.1→1.1, 1.0→3.8
        
        for (let i = 0; i < this.numSpecies; i++) {
            matrix[i] = new Array(this.numSpecies);
            for (let j = 0; j < this.numSpecies; j++) {
                if (i === j) {
                    // Territorial cohesion influenced by territory size parameter
                    matrix[i][j] = baseCohesion + Math.random() * territorySize;
                } else {
                    // Boundary strength and invasion response control repulsion intensity
                    // Enhanced scaling for more dramatic territorial effects
                    const baseRepulsion = Math.pow(boundaryStrength, 1.2) * Math.pow(invasionResponse, 1.1);
                    matrix[i][j] = -baseRepulsion * (0.7 + Math.random() * 0.6);
                }
            }
        }
        
        // Generated territorial pattern
        
        return matrix;
    }
    
    createSymbioticPattern(edgeBias, parameters = {}) {
        // Extract all parameters at the beginning
        const cooperationStrength = parameters.cooperationStrength || 1.5;
        const dependencyLevel = parameters.dependencyLevel || 0.7;
        const mutualismType = parameters.mutualismType || 'obligate';
        const competitionIntensity = parameters.competitionIntensity || 1.0;
        
        const matrix = [];
        for (let i = 0; i < this.numSpecies; i++) {
            matrix[i] = new Array(this.numSpecies).fill(0);
        }
        
        // Create pairs that help each other, compete with others
        const numPairs = Math.floor(this.numSpecies / 2);
        
        // Cooperation strength affects partner attraction (enhanced scaling)
        // Higher dependency creates stronger mutual bonds
        const baseCooperation = cooperationStrength * Math.pow(1.0 + dependencyLevel, 1.5);
        
        for (let p = 0; p < numPairs; p++) {
            const species1 = p * 2;
            const species2 = (p * 2 + 1) % this.numSpecies;
            
            // Mutual attraction between partners scaled by cooperation parameters
            const mutualAttraction = baseCooperation * (0.8 + Math.random() * 0.4);
            matrix[species1][species2] = mutualAttraction;
            matrix[species2][species1] = mutualAttraction;
            
            // Self-attraction varies by mutualism type and dependency
            const selfAttraction = mutualismType === 'obligate' ? 
                dependencyLevel * (0.3 + Math.random() * 0.4) : // Obligate: lower self-attraction
                (1.0 - dependencyLevel) * (0.5 + Math.random() * 0.5); // Facultative: higher self-attraction
            matrix[species1][species1] = selfAttraction;
            matrix[species2][species2] = selfAttraction;
        }
        
        // Competition with non-partners scaled by competition intensity
        for (let i = 0; i < this.numSpecies; i++) {
            for (let j = 0; j < this.numSpecies; j++) {
                if (matrix[i][j] === 0 && i !== j) {
                    // Check if they're partners
                    const iPair = Math.floor(i / 2);
                    const jPair = Math.floor(j / 2);
                    
                    if (iPair !== jPair) {
                        // Competition between different pairs scaled by parameter
                        const competition = competitionIntensity * (0.5 + Math.random() * 1.5);
                        matrix[i][j] = -competition;
                    } else {
                        // Neutral within same pair (non-partners in group)
                        matrix[i][j] = -0.1 + Math.random() * 0.2;
                    }
                }
            }
        }
        
        // Generated symbiotic pattern
        
        return matrix;
    }
    
    createCyclicPattern(edgeBias, parameters = {}) {
        // Extract all parameters at the beginning
        const cycleSpeed = parameters.cycleSpeed || 1.0;
        const dominanceStrength = parameters.dominanceStrength || 2.0;
        const cycleComplexity = parameters.cycleComplexity || 'simple';
        const stabilityFactor = parameters.stabilityFactor || 0.5;
        
        const matrix = [];
        for (let i = 0; i < this.numSpecies; i++) {
            matrix[i] = new Array(this.numSpecies).fill(0);
        }
        
        // Cycle complexity affects step size (simple=1, complex=2+ steps)
        const stepSize = cycleComplexity === 'simple' ? 1 : 
                        cycleComplexity === 'complex' ? 2 : 
                        Math.max(1, Math.floor(this.numSpecies / 3)); // Multi-level
        
        // Rock-paper-scissors style relationships with parameter control
        for (let i = 0; i < this.numSpecies; i++) {
            const dominates = (i + stepSize) % this.numSpecies;
            const dominatedBy = (i - stepSize + this.numSpecies) % this.numSpecies;
            
            // Attraction to species it dominates (enhanced scaling for dramatic effect)
            const huntStrength = Math.pow(dominanceStrength, 1.1) * Math.pow(cycleSpeed, 0.8) * (0.8 + Math.random() * 0.7);
            matrix[i][dominates] = huntStrength;
            
            // Repulsion from species that dominates it (asymmetric scaling for dynamic behavior)
            const fleeStrength = Math.pow(dominanceStrength, 1.2) * (1.0 + cycleSpeed * 0.7) * (0.9 + Math.random() * 0.5);
            matrix[i][dominatedBy] = -fleeStrength;
            
            // Self-attraction scaled by stability factor
            matrix[i][i] = stabilityFactor * (0.3 + Math.random() * 0.5);
            
            // Neutral to other species (affected by cycle complexity)
            const neutralRange = cycleComplexity === 'simple' ? 0.6 : 
                               cycleComplexity === 'complex' ? 1.0 : 1.5;
            for (let j = 0; j < this.numSpecies; j++) {
                if (j !== i && j !== dominates && j !== dominatedBy && matrix[i][j] === 0) {
                    matrix[i][j] = (-neutralRange/2) + Math.random() * neutralRange;
                }
            }
        }
        
        // Generated cyclic pattern
        
        return matrix;
    }
    
    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Setup mouse click handling for shockwaves
        this.setupMouseHandling();
    }
    
    setupMouseHandling() {
        if (!this.canvas) return;
        
        // Handle mouse down - start continuous shockwave
        this.canvas.addEventListener('mousedown', (event) => {
            if (!this.shockwaveEnabled) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.mousePressed = true;
            this.currentMousePos = { x, y };
            
            // Create initial shockwave
            this.createShockwave(x, y);
        });
        
        // Handle mouse move - update shockwave position while pressed
        this.canvas.addEventListener('mousemove', (event) => {
            if (!this.shockwaveEnabled || !this.mousePressed) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.currentMousePos = { x, y };
        });
        
        // Handle mouse up - stop continuous shockwave
        this.canvas.addEventListener('mouseup', () => {
            this.mousePressed = false;
        });
        
        // Handle mouse leave - stop continuous shockwave
        this.canvas.addEventListener('mouseleave', () => {
            this.mousePressed = false;
        });
        
        // Touch events for mobile/trackpad support
        this.canvas.addEventListener('touchstart', (event) => {
            if (!this.shockwaveEnabled) return;
            event.preventDefault(); // Prevent scrolling
            
            const rect = this.canvas.getBoundingClientRect();
            const touch = event.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.mousePressed = true;
            this.currentMousePos = { x, y };
            this.createShockwave(x, y);
        });
        
        this.canvas.addEventListener('touchmove', (event) => {
            if (!this.shockwaveEnabled || !this.mousePressed) return;
            event.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const touch = event.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.currentMousePos = { x, y };
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.mousePressed = false;
        });
        
        this.canvas.addEventListener('touchcancel', () => {
            this.mousePressed = false;
        });
        
        // Fallback click handler for single clicks (when mousedown/up happen quickly)
        this.canvas.addEventListener('click', (event) => {
            if (!this.shockwaveEnabled || this.mousePressed) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Create single shockwave for quick clicks
            this.createShockwave(x, y);
        });
    }
    
    createShockwave(x, y) {
        // Add shockwave effect with duration
        this.activeShockwaves.push({
            x: x,
            y: y,
            strength: this.shockwaveStrength,
            size: this.shockwaveSize,
            falloff: this.shockwaveFalloff,
            age: 0,
            duration: 0.3 // Shockwave lasts 0.3 seconds
        });
        
        if (!this.mousePressed) {
            // Shockwave created
        }
    }
    
    // Calculate toroidal distance (considering wrap-around boundaries)
    getToroidalDistance(p1, p2) {
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        
        // Find shortest distance considering wrap-around
        if (Math.abs(dx) > this.width / 2) {
            dx = dx > 0 ? dx - this.width : dx + this.width;
        }
        if (Math.abs(dy) > this.height / 2) {
            dy = dy > 0 ? dy - this.height : dy + this.height;
        }
        
        return { dx, dy, dist2: dx * dx + dy * dy };
    }
    
    updateShockwaves(dt) {
        // Update shockwave ages and remove expired ones
        for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
            this.activeShockwaves[i].age += dt;
            
            // Remove expired shockwaves
            if (this.activeShockwaves[i].age > this.activeShockwaves[i].duration) {
                this.activeShockwaves.splice(i, 1);
            }
        }
    }
    
    calculateShockwaveForce(particle) {
        let fx = 0, fy = 0;
        
        // Apply force from all active temporal shockwaves
        for (const shockwave of this.activeShockwaves) {
            let dx, dy, dist2;
            
            if (this.wrapAroundWalls) {
                // Use toroidal distance for shockwaves too
                const shockwavePos = { x: shockwave.x, y: shockwave.y };
                const toroidal = this.getToroidalDistance(particle, shockwavePos);
                dx = -toroidal.dx; // Reverse direction (particle relative to shockwave)
                dy = -toroidal.dy;
                dist2 = toroidal.dist2;
            } else {
                dx = particle.x - shockwave.x;
                dy = particle.y - shockwave.y;
                dist2 = dx * dx + dy * dy;
            }
            
            const dist = Math.sqrt(dist2);
            
            // Skip if particle is outside shockwave radius
            if (dist > shockwave.size || dist < 0.1) continue;
            
            // Calculate falloff: starts strong, fades with distance and time
            const distanceFalloff = Math.pow(1 - (dist / shockwave.size), shockwave.falloff);
            const timeFalloff = 1 - (shockwave.age / shockwave.duration);
            const totalFalloff = distanceFalloff * timeFalloff;
            
            // Calculate force magnitude
            const forceMagnitude = (shockwave.strength * totalFalloff) / Math.max(dist, 1);
            
            // Apply force in direction away from shockwave center
            const invDist = 1.0 / dist;
            fx += dx * invDist * forceMagnitude;
            fy += dy * invDist * forceMagnitude;
        }
        
        // Apply continuous force from mouse position if pressed
        if (this.mousePressed) {
            let dx, dy, dist2;
            
            if (this.wrapAroundWalls) {
                // Use toroidal distance for mouse interaction too
                const toroidal = this.getToroidalDistance(particle, this.currentMousePos);
                dx = -toroidal.dx; // Reverse direction (particle relative to mouse)
                dy = -toroidal.dy;
                dist2 = toroidal.dist2;
            } else {
                dx = particle.x - this.currentMousePos.x;
                dy = particle.y - this.currentMousePos.y;
                dist2 = dx * dx + dy * dy;
            }
            
            const dist = Math.sqrt(dist2);
            
            // Apply continuous force if within range
            if (dist <= this.shockwaveSize && dist >= 0.1) {
                const distanceFalloff = Math.pow(1 - (dist / this.shockwaveSize), this.shockwaveFalloff);
                const forceMagnitude = (this.shockwaveStrength * distanceFalloff * 0.5) / Math.max(dist, 1); // Reduced strength for continuous
                
                const invDist = 1.0 / dist;
                fx += dx * invDist * forceMagnitude;
                fy += dy * invDist * forceMagnitude;
            }
        }
        
        return { fx, fy };
    }
    
    initializeParticles() {
        this.particles = [];
        
        for (let species = 0; species < this.numSpecies; species++) {
            for (let i = 0; i < this.particlesPerSpecies; i++) {
                // Cluster initial positions by species for interesting starting conditions
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 100 + 50;
                const centerX = this.width * (0.3 + species * 0.15);
                const centerY = this.height * 0.5;
                
                this.particles.push({
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    species: species,
                    age: 0,
                    energy: 1
                });
            }
        }
    }
    
    update(dt) {
        const startTime = performance.now();
        
        // If muted, skip all physics updates but still render current state
        if (this.muted) {
            this.renderCurrentState();
            return;
        }
        
        this.time += dt;
        
        // Update breath offset if enabled
        this.updateBreathOffset();
        
        // Update shockwaves
        this.updateShockwaves(dt);
        
        // Safety check for empty particle array
        if (this.particles.length === 0) {
            console.warn('No particles to update');
            // Clear canvas when no particles
            this.ctx.fillStyle = this.getCurrentBackgroundColor();
            this.ctx.fillRect(0, 0, this.width, this.height);
            return;
        }
        
        // Update spatial grid for optimized neighbor search
        // Now supports both regular and toroidal (wrap-around) topology
        this.updateSpatialGrid();
        
        // Trail effect - Smart buffering approach to prevent gray residue
        if (this.trailEnabled) {
            this.applyTrailDecay();
        } else {
            // Clear canvas completely
            this.ctx.fillStyle = this.getCurrentBackgroundColor();
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        
        // Ensure alpha is reset
        this.ctx.globalAlpha = 1.0;
        
        // Update each particle with optimized force calculations
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            if (!p1) {
                continue;
            }
            
            const s1 = p1.species;
            if (s1 === undefined || s1 < 0 || s1 >= this.numSpecies) {
                continue;
            }
            
            const species1Radius = this.species[s1]?.size || this.particleSize;
            
            // Reset forces
            let fx = 0, fy = 0;
            
            // Apply shockwave forces first
            fx += this.calculateShockwaveForce(p1).fx;
            fy += this.calculateShockwaveForce(p1).fy;
            
            // Get nearby particles using spatial partitioning
            const nearbyIndices = this.getNearbyParticles(i);
            
            // Calculate forces from nearby particles only
            for (let k = 0; k < nearbyIndices.length; k++) {
                const j = nearbyIndices[k];
                if (i === j) continue;
                
                const p2 = this.particles[j];
                let dx, dy, dist2;
                
                if (this.wrapAroundWalls) {
                    // Use toroidal distance calculation for wrap-around
                    const toroidal = this.getToroidalDistance(p1, p2);
                    dx = toroidal.dx;
                    dy = toroidal.dy;
                    dist2 = toroidal.dist2;
                } else {
                    // Standard Euclidean distance
                    dx = p2.x - p1.x;
                    dy = p2.y - p1.y;
                    dist2 = dx * dx + dy * dy;
                }
                
                // Critical fix: Prevent division by zero and very small distances
                const minDist2 = 0.01; // Minimum distance squared to prevent Infinity/NaN
                if (dist2 < minDist2) continue;
                
                const s2 = p2.species;
                
                // Safety check for valid species index
                if (s1 === undefined || s2 === undefined || s1 < 0 || s2 < 0 || 
                    s1 >= this.numSpecies || s2 >= this.numSpecies) {
                    continue;
                }
                
                // Calculate collision distance based on particle sizes
                const species2Radius = this.species[s2]?.size || this.particleSize;
                
                // Collision distance = sum of radii + offset + multiplier
                const baseCollisionDistance = species1Radius + species2Radius;
                const collisionR = (baseCollisionDistance + this.collisionOffset) * this.collisionMultiplier;
                const collisionR2 = collisionR * collisionR;
                
                // Safe access to social radius matrix
                let socialR = 50; // default
                if (Array.isArray(this.socialRadius) && this.socialRadius[s1] && this.socialRadius[s1][s2] !== undefined) {
                    socialR = this.socialRadius[s1][s2];
                    if (isNaN(socialR) || socialR <= 0) {
                        socialR = 50;
                    }
                }
                const socialR2 = socialR * socialR;
                
                // Early exit if particle is too far for any interaction
                if (dist2 > socialR2) continue;
                
                // Safe distance calculation with minimum threshold
                const dist = Math.sqrt(dist2);
                
                // Prevent division by zero or very small numbers
                if (dist < 0.1) {
                    // If particles are too close, apply a strong repulsive force in a random direction
                    const angle = Math.random() * Math.PI * 2;
                    const unitX = Math.cos(angle);
                    const unitY = Math.sin(angle);
                    const F = -10.0; // Strong repulsion
                    fx += F * unitX;
                    fy += F * unitY;
                    continue;
                }
                
                const invDist = 1.0 / dist;
                
                // Normalized direction
                const unitX = dx * invDist;
                const unitY = dy * invDist;
                
                // Collision force (always repulsive at close range)
                if (dist2 < collisionR2) {
                    // Safety check for force matrix bounds
                    if (this.collisionForce[s1] && this.collisionForce[s1][s2] !== undefined) {
                        // Enhanced collision force that scales with particle size and overlap
                        const overlap = collisionR - dist;
                        const baseForce = this.collisionForce[s1][s2];
                        
                        // Make force stronger for larger particles and deeper overlaps
                        const sizeScale = Math.max(1.0, (species1Radius + species2Radius) / 6.0);
                        const overlapScale = Math.max(1.0, overlap / 2.0);
                        
                        const F = baseForce * sizeScale * overlapScale / Math.max(dist, 0.1);
                        // Safety check for force values
                        if (isNaN(F) || !isFinite(F)) {
                            continue;
                        }
                        fx += F * unitX;
                        fy += F * unitY;
                    }
                }
                
                // Enhanced social force with cluster-promoting behavior
                if (dist2 < socialR2) {
                    // Safety check for force matrix bounds
                    if (this.socialForce[s1] && this.socialForce[s1][s2] !== undefined) {
                        const baseForce = this.socialForce[s1][s2];
                        
                        // Skip if no force between these species
                        if (baseForce === 0) continue;
                        
                        // Enhanced force calculation with temporal dynamics and multi-scale interactions
                        let F = 0; // Initialize to 0 to prevent undefined
                        if (baseForce > 0) {
                            // Attractive force with multi-zone behavior
                            const innerZone = socialR * 0.25;  // 25% - strong cohesion zone
                            const middleZone = socialR * 0.6;  // 60% - balanced interaction zone  
                            const outerZone = socialR * 0.9;   // 90% - weak attraction zone
                            
                            if (dist < innerZone) {
                                // Inner zone: Strong cohesion with collapse prevention
                                const cohesionStrength = 1.2;
                                F = baseForce * cohesionStrength / Math.max(dist, collisionR * 0.8);
                            } else if (dist < middleZone) {
                                // Middle zone: Optimal clustering with distance modulation
                                const idealDist = (innerZone + middleZone) / 2;
                                const distFromIdeal = Math.abs(dist - idealDist);
                                const modulation = 1.0 - (distFromIdeal / (middleZone - innerZone)) * 0.3;
                                F = baseForce * modulation / dist;
                            } else if (dist < outerZone) {
                                // Outer zone: Weak long-range attraction
                                const weakening = (outerZone - dist) / (outerZone - middleZone);
                                F = baseForce * weakening * 0.4 / dist;
                            } else {
                                // Beyond outer zone: Very weak attraction with temporal modulation
                                const timePhase = this.time * 0.0008 + (s1 + s2) * 0.3; // Slow oscillation
                                const temporalMod = 0.7 + 0.3 * Math.sin(timePhase);
                                F = baseForce * 0.1 * temporalMod / dist;
                            }
                            
                            // Add temporal breathing effect for more organic behavior
                            const breathingPhase = this.time * 0.001 + s1 * 0.5;
                            const breathingMod = 0.9 + 0.1 * Math.sin(breathingPhase);
                            F *= breathingMod;
                            
                        } else if (baseForce < 0) {
                            // Repulsive force with distance zones and temporal modulation
                            const strongRepulsionZone = socialR * 0.3;
                            const weakRepulsionZone = socialR * 0.7;
                            const maxRepulsionRange = socialR * 0.9; // Don't apply repulsion beyond this
                            
                            if (dist > maxRepulsionRange) {
                                // Too far - no repulsion
                                F = 0;
                            } else if (dist < strongRepulsionZone) {
                                // Strong repulsion with safety distance
                                const repulsionStrength = 1.5;
                                F = baseForce * repulsionStrength / Math.max(dist, collisionR * 0.3);
                            } else if (dist < weakRepulsionZone) {
                                // Moderate repulsion with distance falloff
                                const falloff = (weakRepulsionZone - dist) / (weakRepulsionZone - strongRepulsionZone);
                                F = baseForce * falloff / dist;
                            } else {
                                // Weak repulsion at long range (but within maxRepulsionRange)
                                const falloff = (maxRepulsionRange - dist) / (maxRepulsionRange - weakRepulsionZone);
                                F = baseForce * 0.1 * falloff / dist;
                            }
                        } else {
                            // baseForce is exactly 0 - no force
                            F = 0;
                        }
                        
                        // Safety check for social force values
                        if (isNaN(F) || !isFinite(F)) {
                            continue;
                        }
                        fx += F * unitX;
                        fy += F * unitY;
                    }
                }
            }
            
            // Add environmental pressure (global center force)
            if (this.environmentalPressure !== 0) {
                const centerX = this.width / 2;
                const centerY = this.height / 2;
                const dcx = centerX - p1.x;
                const dcy = centerY - p1.y;
                const centerDist = Math.sqrt(dcx * dcx + dcy * dcy);
                if (centerDist > 0.1) {
                    const centerForce = this.environmentalPressure * 0.1; // Scale down
                    fx += (dcx / centerDist) * centerForce;
                    fy += (dcy / centerDist) * centerForce;
                }
            }
            
            // Add chaos/randomness
            if (this.chaosLevel > 0) {
                fx += (Math.random() - 0.5) * this.chaosLevel * 2;
                fy += (Math.random() - 0.5) * this.chaosLevel * 2;
            }
            
            // Safety check for NaN forces
            if (isNaN(fx) || isNaN(fy)) {
                fx = 0;
                fy = 0;
            }
            
            // Apply forces with per-species mobility and NaN protection
            const species = this.species[p1.species];
            const mobility = species?.mobility || 1.0;
            const forceX = fx * this.forceFactor * mobility;
            const forceY = fy * this.forceFactor * mobility;
            
            if (!isNaN(forceX) && !isNaN(forceY)) {
                p1.vx += forceX;
                p1.vy += forceY;
            }
            
            // Apply sophisticated friction with multi-factor dampening
            const speciesFriction = species?.inertia || this.friction;
            const velocity = Math.sqrt(p1.vx * p1.vx + p1.vy * p1.vy);
            
            // Multi-factor dampening for more organic cluster behavior
            let dampening = speciesFriction;
            
            // Velocity-dependent dampening with smooth transitions
            if (velocity > 2.0) {
                // Progressive dampening for high-velocity particles
                const excessVelocity = velocity - 2.0;
                const velocityFactor = Math.min(excessVelocity / 4.0, 1.0); // Cap at 1.0
                const extraDampening = 0.85 + velocityFactor * 0.1; // 0.85-0.95 range
                dampening *= extraDampening;
            } else if (velocity < 0.5) {
                // Slight boost for very slow particles to prevent stagnation
                dampening *= 1.02;
            }
            
            // Species-specific dampening characteristics
            const speciesCharacteristic = Math.sin(p1.species * 0.7 + this.time * 0.0005) * 0.02;
            dampening *= (1.0 + speciesCharacteristic);
            
            // Environmental context dampening (particles near edges behave differently)
            // Skip edge dampening in wrap-around mode since there are no "edges"
            if (!this.wrapAroundWalls) {
                const centerX = this.width / 2;
                const centerY = this.height / 2;
                const distFromCenter = Math.sqrt((p1.x - centerX) ** 2 + (p1.y - centerY) ** 2);
                const maxDistFromCenter = Math.sqrt(centerX ** 2 + centerY ** 2);
                const edgeProximity = distFromCenter / maxDistFromCenter;
                
                // Particles near edges have slightly different dynamics
                if (edgeProximity > 0.8) {
                    dampening *= 0.98; // Slightly more dampening near edges
                }
            }
            
            p1.vx *= dampening;
            p1.vy *= dampening;
            
            // Velocity sanity check
            if (isNaN(p1.vx) || isNaN(p1.vy)) {
                p1.vx = (Math.random() - 0.5) * 2;
                p1.vy = (Math.random() - 0.5) * 2;
            }
            
            // Update position with NaN validation
            p1.x += p1.vx;
            p1.y += p1.vy;
            
            // Critical safety check: Prevent NaN positions
            if (isNaN(p1.x) || isNaN(p1.y)) {
                p1.x = this.width * 0.5;
                p1.y = this.height * 0.5;
                p1.vx = (Math.random() - 0.5) * 2;
                p1.vy = (Math.random() - 0.5) * 2;
            }
            
            // Handle wall behavior based on settings
            if (this.wrapAroundWalls) {
                // Wrap-around boundaries (toroidal space) - improved smooth wrapping
                if (p1.x < 0) {
                    p1.x += this.width;
                } else if (p1.x >= this.width) {
                    p1.x -= this.width;
                }
                if (p1.y < 0) {
                    p1.y += this.height;
                } else if (p1.y >= this.height) {
                    p1.y -= this.height;
                }
            } else {
                // Apply repulsive force near edges - improved smooth falloff
                if (this.repulsiveForce > 0) {
                    const repulsiveZone = Math.max(30, this.particleSize * 5); // Adaptive zone based on particle size
                    let repulsiveFx = 0, repulsiveFy = 0;
                    
                    // Left edge repulsion - smooth exponential falloff
                    if (p1.x < repulsiveZone) {
                        const intensity = Math.pow((repulsiveZone - p1.x) / repulsiveZone, 2);
                        repulsiveFx += this.repulsiveForce * intensity * 15;
                    }
                    // Right edge repulsion
                    if (p1.x > this.width - repulsiveZone) {
                        const intensity = Math.pow((p1.x - (this.width - repulsiveZone)) / repulsiveZone, 2);
                        repulsiveFx -= this.repulsiveForce * intensity * 15;
                    }
                    // Top edge repulsion
                    if (p1.y < repulsiveZone) {
                        const intensity = Math.pow((repulsiveZone - p1.y) / repulsiveZone, 2);
                        repulsiveFy += this.repulsiveForce * intensity * 15;
                    }
                    // Bottom edge repulsion
                    if (p1.y > this.height - repulsiveZone) {
                        const intensity = Math.pow((p1.y - (this.height - repulsiveZone)) / repulsiveZone, 2);
                        repulsiveFy -= this.repulsiveForce * intensity * 15;
                    }
                    
                    // Apply repulsive forces with species-specific mobility consideration
                    const mobilityFactor = this.species[p1.species]?.mobility || 1.0;
                    p1.vx += repulsiveFx * dt * mobilityFactor;
                    p1.vy += repulsiveFy * dt * mobilityFactor;
                }
                
                // Traditional wall collisions with damping - improved boundary detection
                const effectiveSize = this.particleSize * (this.species[p1.species]?.sizeMultiplier || 1.0);
                
                if (p1.x < effectiveSize || p1.x > this.width - effectiveSize) {
                    p1.vx *= -this.wallDamping;
                    p1.x = Math.max(effectiveSize, Math.min(this.width - effectiveSize, p1.x));
                    // Add slight random angle to prevent particles getting stuck in corners
                    p1.vy += (Math.random() - 0.5) * 0.1;
                }
                if (p1.y < effectiveSize || p1.y > this.height - effectiveSize) {
                    p1.vy *= -this.wallDamping;
                    p1.y = Math.max(effectiveSize, Math.min(this.height - effectiveSize, p1.y));
                    // Add slight random angle to prevent particles getting stuck in corners
                    p1.vx += (Math.random() - 0.5) * 0.1;
                }
            }
            
            // Update age for visual effects
            p1.age += dt;
            p1.energy = 0.5 + 0.5 * Math.sin(p1.age * 2 + i);
        }
        
        // Render particles
        this.render();
        
        // Performance monitoring
        this.frameCount++;
        const frameTime = performance.now() - startTime;
        this.avgFrameTime = this.avgFrameTime * 0.9 + frameTime * 0.1;
        
        // Disabled performance warning logs - too noisy
        /*
        if (this.frameCount % 60 === 0) {
            const fps = 1000 / this.avgFrameTime;
            if (fps < 30) {
                console.warn(`Performance warning: ${fps.toFixed(1)} FPS, ${this.avgFrameTime.toFixed(2)}ms per frame`);
            }
        }
        */
    }
    
    getOrCreateGradient(speciesId, size) {
        const species = this.species[speciesId];
        const color = species.color;
        const glowSize = size * this.glowRadius;
        const cacheKey = `${speciesId}-${glowSize}-${this.glowIntensity}`;
        
        if (!this.gradientCache.has(cacheKey)) {
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
            const intensity = this.glowIntensity;
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${species.opacity * intensity})`);
            gradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, ${species.opacity * intensity * 0.5})`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            this.gradientCache.set(cacheKey, gradient);
        }
        
        return this.gradientCache.get(cacheKey);
    }
    
    getOrCreateHaloGradient(speciesId, size, haloRadius, baseIntensity) {
        const species = this.species[speciesId];
        const color = species.color;
        const baseHaloSize = size * 3.0 * haloRadius;
        // Remove trail state from cache key for better performance
        const cacheKey = `halo-${speciesId}-${baseHaloSize}-${baseIntensity.toFixed(4)}`;
        
        if (!this.haloGradientCache.has(cacheKey)) {
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, baseHaloSize);
            // Use smoother gradient stops for better quality
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${baseIntensity})`);
            gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${baseIntensity * 0.6})`);
            gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${baseIntensity * 0.2})`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            this.haloGradientCache.set(cacheKey, gradient);
        }
        
        return this.haloGradientCache.get(cacheKey);
    }
    
    renderSpeciesHalo(speciesParticles, speciesId, size, color, haloIntensity, haloRadius) {
        if (haloIntensity <= 0 || speciesParticles.length === 0) return;
        
        // Calculate trail-adjusted intensity more efficiently
        let adjustedIntensity = haloIntensity;
        if (this.trailEnabled && this.blur < 0.98) {
            // Simplified trail compensation - reduces grainy artifacts
            adjustedIntensity = haloIntensity * (1 - this.blur * 0.8);
            adjustedIntensity = Math.max(0.001, Math.min(adjustedIntensity, 1.0));
        }
        
        const baseHaloSize = size * 3.0 * haloRadius;
        const haloGradient = this.getOrCreateHaloGradient(speciesId, size, haloRadius, haloIntensity);
        
        // Set blend mode for better visual quality
        this.ctx.save();
        this.ctx.globalCompositeOperation = this.trailEnabled ? 'screen' : 'source-over';
        this.ctx.globalAlpha = adjustedIntensity;
        this.ctx.fillStyle = haloGradient;
        
        // Optimized batch rendering - reduce transform calls
        for (const particle of speciesParticles) {
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.fillRect(-baseHaloSize, -baseHaloSize, baseHaloSize * 2, baseHaloSize * 2);
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    renderCurrentState() {
        // Render the current static state without any updates
        // Simply apply the background and render particles as they are
        if (!this.ctx) {
            console.error('Canvas context not set');
            return;
        }
        
        // Apply background
        if (this.trailEnabled) {
            this.applyTrailDecay();
        } else {
            // Clear canvas completely
            this.ctx.fillStyle = this.getCurrentBackgroundColor();
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        
        // Ensure alpha is reset
        this.ctx.globalAlpha = 1.0;
        
        // Render particles in their current positions
        this.render();
    }
    
    render() {
        // Safety check for context
        if (!this.ctx) {
            console.error('Canvas context not set');
            return;
        }
        
        // Reset temp array pool for this frame
        this.resetTempArrays();
        
        // Ensure we use source-over for normal blending
        this.ctx.globalCompositeOperation = 'source-over';
        
        if (this.renderMode === 'dreamtime') {
            // Save current composite operation
            const prevComposite = this.ctx.globalCompositeOperation;
            this.ctx.globalCompositeOperation = 'screen';
            
            // Use pooled arrays for batching by species
            const particlesBySpecies = new Array(this.numSpecies);
            for (let i = 0; i < this.numSpecies; i++) {
                particlesBySpecies[i] = this.getTempArray(this.particlesPerSpecies);
            }
            
            for (const particle of this.particles) {
                particlesBySpecies[particle.species].push(particle);
            }
            
            // Render each species batch
            for (let speciesId = 0; speciesId < this.numSpecies; speciesId++) {
                const speciesParticles = particlesBySpecies[speciesId];
                if (speciesParticles.length === 0) continue;
                
                const species = this.species[speciesId];
                const color = species.color;
                const size = species.size;
                const baseGlowSize = size * this.glowRadius;
                const speciesGlowSize = this.speciesGlowSize[speciesId] || 1.0;
                const speciesGlowIntensity = this.speciesGlowIntensity[speciesId] || 0;
                
                this.ctx.save();
                
                // Draw enhanced glow if enabled
                if (speciesGlowIntensity > 0) {
                    // Multiple glow layers for enhanced effect
                    const glowLayers = [
                        { sizeMultiplier: 3.0, alpha: 0.05 * speciesGlowIntensity },
                        { sizeMultiplier: 2.0, alpha: 0.1 * speciesGlowIntensity },
                        { sizeMultiplier: 1.5, alpha: 0.15 * speciesGlowIntensity }
                    ];
                    
                    for (const layer of glowLayers) {
                        const layerGlowSize = baseGlowSize * speciesGlowSize * layer.sizeMultiplier;
                        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, layerGlowSize);
                        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${layer.alpha})`);
                        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${layer.alpha * 0.5})`);
                        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
                        
                        this.ctx.fillStyle = gradient;
                        
                        for (const particle of speciesParticles) {
                            this.ctx.setTransform(1, 0, 0, 1, particle.x, particle.y);
                            this.ctx.fillRect(-layerGlowSize, -layerGlowSize, layerGlowSize * 2, layerGlowSize * 2);
                        }
                    }
                }
                
                // Draw per-species halo if enabled (optimized for current particles only)
                const speciesHaloIntensity = this.speciesHaloIntensity[speciesId] || 0;
                const speciesHaloRadius = this.speciesHaloRadius[speciesId] || 1.0;
                
                if (speciesHaloIntensity > 0) {
                    this.renderSpeciesHalo(speciesParticles, speciesId, size, color, speciesHaloIntensity, speciesHaloRadius);
                }
                
                // Draw standard glow
                const glowSize = baseGlowSize * speciesGlowSize;
                const gradient = this.getOrCreateGradient(speciesId, size);
                this.ctx.fillStyle = gradient;
                
                for (const particle of speciesParticles) {
                    this.ctx.setTransform(1, 0, 0, 1, particle.x, particle.y);
                    this.ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
                }
                
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                
                // Draw bright cores
                this.ctx.fillStyle = `rgba(${Math.min(255, color.r + 50)}, ${Math.min(255, color.g + 50)}, ${Math.min(255, color.b + 50)}, ${species.opacity})`;
                this.ctx.beginPath();
                for (const particle of speciesParticles) {
                    this.ctx.moveTo(particle.x + size * 0.5, particle.y);
                    this.ctx.arc(particle.x, particle.y, size * 0.5, 0, Math.PI * 2);
                }
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            // Restore composite operation
            this.ctx.globalCompositeOperation = prevComposite;
        } else {
            // Normal rendering mode - batch by species for better performance
            const particlesBySpecies = new Array(this.numSpecies);
            for (let i = 0; i < this.numSpecies; i++) {
                particlesBySpecies[i] = this.getTempArray(this.particlesPerSpecies);
            }
            
            for (const particle of this.particles) {
                particlesBySpecies[particle.species].push(particle);
            }
            
            // Render each species batch
            for (let speciesId = 0; speciesId < this.numSpecies; speciesId++) {
                const speciesParticles = particlesBySpecies[speciesId];
                if (speciesParticles.length === 0) continue;
                
                const species = this.species[speciesId];
                const color = species.color;
                const speciesGlowSize = this.speciesGlowSize[speciesId] || 1.0;
                const speciesGlowIntensity = this.speciesGlowIntensity[speciesId] || 0;
                
                this.ctx.save();
                
                // Draw enhanced glow if enabled
                if (speciesGlowIntensity > 0) {
                    this.ctx.globalCompositeOperation = 'lighter';
                    
                    // Multiple glow layers for enhanced effect
                    const glowLayers = [
                        { sizeMultiplier: 2.5, alpha: 0.03 * speciesGlowIntensity },
                        { sizeMultiplier: 1.8, alpha: 0.06 * speciesGlowIntensity },
                        { sizeMultiplier: 1.3, alpha: 0.1 * speciesGlowIntensity }
                    ];
                    
                    for (const layer of glowLayers) {
                        const layerGlowSize = species.size * speciesGlowSize * layer.sizeMultiplier;
                        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${layer.alpha})`;
                        this.ctx.beginPath();
                        
                        for (const particle of speciesParticles) {
                            this.ctx.moveTo(particle.x + layerGlowSize, particle.y);
                            this.ctx.arc(particle.x, particle.y, layerGlowSize, 0, Math.PI * 2);
                        }
                        
                        this.ctx.fill();
                    }
                    
                    this.ctx.globalCompositeOperation = 'source-over';
                }
                
                // Draw per-species halo if enabled (optimized normal mode)
                const speciesHaloIntensity = this.speciesHaloIntensity[speciesId] || 0;
                const speciesHaloRadius = this.speciesHaloRadius[speciesId] || 1.0;
                
                if (speciesHaloIntensity > 0) {
                    this.ctx.globalCompositeOperation = 'lighter';
                    this.renderSpeciesHalo(speciesParticles, speciesId, species.size, color, speciesHaloIntensity, speciesHaloRadius);
                    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                    this.ctx.globalCompositeOperation = 'source-over';
                }
                
                // Draw particles
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${species.opacity})`;
                this.ctx.beginPath();
                
                for (const particle of speciesParticles) {
                    this.ctx.moveTo(particle.x + species.size, particle.y);
                    this.ctx.arc(particle.x, particle.y, species.size, 0, Math.PI * 2);
                }
                
                this.ctx.fill();
                this.ctx.restore();
            }
        }
    }
    
    // Preset ecosystems with interesting asymmetric behaviors
    loadPreset(name) {
        switch (name) {
            case 'predatorPrey':
                // Red hunts Green, Green hunts Blue, Blue hunts Red
                this.socialForce = [
                    [0.3, 0.8, -0.7, 0.2, -0.3],   // Red: chase green, flee blue
                    [-0.8, 0.3, 0.8, -0.4, 0.2],   // Green: flee red, chase blue
                    [0.8, -0.8, 0.3, 0.1, -0.2],   // Blue: chase red, flee green
                    [-0.2, 0.4, -0.1, 0.5, -0.6],  // Yellow: mixed
                    [0.3, -0.2, 0.2, 0.6, 0.4]     // Purple: mixed
                ];
                break;
                
            case 'crystallization':
                // Strong self-attraction, ordered repulsion from others
                for (let i = 0; i < this.numSpecies; i++) {
                    for (let j = 0; j < this.numSpecies; j++) {
                        this.socialForce[i][j] = i === j ? 0.8 : -0.3;
                    }
                }
                break;
                
            case 'vortex':
                // Circular chase pattern
                for (let i = 0; i < this.numSpecies; i++) {
                    for (let j = 0; j < this.numSpecies; j++) {
                        if (j === (i + 1) % this.numSpecies) {
                            this.socialForce[i][j] = 0.9; // Chase next species
                        } else if (j === (i - 1 + this.numSpecies) % this.numSpecies) {
                            this.socialForce[i][j] = -0.9; // Flee previous species
                        } else {
                            this.socialForce[i][j] = 0;
                        }
                    }
                }
                break;
                
            case 'symbiosis':
                // Complex interdependencies
                this.socialForce = [
                    [0.5, 0.6, -0.3, 0.7, -0.4],   // Red: likes green & yellow
                    [0.6, 0.4, 0.8, -0.5, 0.3],    // Green: likes blue
                    [-0.3, 0.8, 0.5, -0.2, 0.6],   // Blue: likes green & purple
                    [0.7, -0.5, -0.2, 0.6, 0.4],   // Yellow: likes red & self
                    [-0.4, 0.3, 0.6, 0.4, 0.5]     // Purple: likes most
                ];
                break;
        }
    }
    
    // Load a full preset configuration
    loadFullPreset(preset) {
        // Validate preset structure
        if (!preset || !preset.species) {
            console.error('Invalid preset: missing species configuration');
            return;
        }
        
        // Clear caches when loading new preset
        this.clearCaches();
        
        // Load PARTICLES Section
        if (preset.particles) {
            this.particlesPerSpecies = preset.particles.particlesPerSpecies || this.particlesPerSpecies;
            this.numSpecies = preset.particles.numSpecies || preset.species.count;
        } else {
            this.numSpecies = preset.species.count;
        }
        
        // Load SPECIES Section
        this.species = [];
        preset.species.definitions.forEach((def, i) => {
            this.species[i] = {
                color: this.normalizeColor(def.color),
                size: def.size,
                opacity: def.opacity,
                name: def.name,
                particleCount: def.particleCount,
                startPosition: def.startPosition
            };
            // Load per-species glow if available
            this.speciesGlowSize[i] = def.glowSize !== undefined ? def.glowSize : 1.0;
            this.speciesGlowIntensity[i] = def.glowIntensity !== undefined ? def.glowIntensity : 0;
            // Load per-species dynamics if available
            this.species[i].mobility = def.mobility !== undefined ? def.mobility : 1.5;
            this.species[i].inertia = def.inertia !== undefined ? def.inertia : 0.85;
        });
        
        // Load PHYSICS Section
        this.friction = 1.0 - preset.physics.friction;
        this.wallDamping = preset.physics.wallDamping !== undefined ? preset.physics.wallDamping : 0.8;
        this.forceFactor = preset.physics.forceFactor;
        
        // Load WALLS Section (new parameters)
        if (preset.walls) {
            this.repulsiveForce = preset.walls.repulsiveForce || 0.3;
            this.wrapAroundWalls = preset.walls.wrapAroundWalls || false;
        } else {
            // Default values for backward compatibility
            this.repulsiveForce = 0.3;
            this.wrapAroundWalls = false;
        }
        
        // Load full matrices if available, otherwise create from single values
        if (preset.physics.collisionRadius && Array.isArray(preset.physics.collisionRadius)) {
            this.collisionRadius = preset.physics.collisionRadius;
        } else {
            const collisionR = preset.physics.collisionRadiusValue || preset.physics.collisionRadius || 15;
            this.collisionRadius = this.createMatrix(collisionR, collisionR);
        }
        
        if (preset.physics.socialRadius && Array.isArray(preset.physics.socialRadius)) {
            this.socialRadius = preset.physics.socialRadius;
        } else {
            const socialR = preset.physics.socialRadiusValue || preset.physics.socialRadius || 50;
            this.socialRadius = this.createMatrix(socialR, socialR);
        }
        
        // Load enhanced physics parameters
        if (preset.physics.collisionMultiplier !== undefined) {
            this.collisionMultiplier = preset.physics.collisionMultiplier;
        }
        if (preset.physics.collisionOffset !== undefined) {
            this.collisionOffset = preset.physics.collisionOffset;
        }
        if (preset.physics.environmentPressure !== undefined) {
            this.environmentalPressure = preset.physics.environmentPressure; // Note: property has different name
        }
        if (preset.physics.chaosLevel !== undefined) {
            this.chaosLevel = preset.physics.chaosLevel;
        }
        
        // Load shockwave settings from physics section
        if (preset.physics.shockwaveEnabled !== undefined) {
            this.shockwaveEnabled = preset.physics.shockwaveEnabled;
        }
        if (preset.physics.shockwaveStrength !== undefined) {
            this.shockwaveStrength = preset.physics.shockwaveStrength;
        }
        if (preset.physics.shockwaveSize !== undefined) {
            this.shockwaveSize = preset.physics.shockwaveSize;
        }
        if (preset.physics.shockwaveFalloff !== undefined) {
            this.shockwaveFalloff = preset.physics.shockwaveFalloff;
        }
        
        // Load VISUAL Section
        this.blur = preset.visual.blur;
        this.particleSize = preset.visual.particleSize;
        this.perSpeciesSize = true; // Always use per-species size
        this.trailEnabled = preset.visual.trailEnabled;
        
        // Background color system
        this.backgroundMode = preset.visual.backgroundMode || 'solid';
        this.backgroundColor = preset.visual.backgroundColor || '#000000';
        this.backgroundColor1 = preset.visual.backgroundColor1 || '#000000';
        this.backgroundColor2 = preset.visual.backgroundColor2 || '#001133';
        this.backgroundCycleTime = preset.visual.backgroundCycleTime || 5.0;
        
        // Load EFFECTS Section
        if (preset.effects) {
            // Trail Effect
            this.trailEnabled = preset.effects.trailEnabled !== undefined ? preset.effects.trailEnabled : this.trailEnabled;
            this.blur = preset.effects.trailLength !== undefined ? preset.effects.trailLength : this.blur;
            
            // Halo Effect
            this.renderMode = preset.effects.haloEnabled ? 'dreamtime' : 'normal';
            this.glowIntensity = preset.effects.haloIntensity !== undefined ? preset.effects.haloIntensity : 0.8;
            this.glowRadius = preset.effects.haloRadius !== undefined ? preset.effects.haloRadius : 3.0;
            
            // Species Glow Effect
            if (preset.effects.speciesGlowArrays) {
                this.speciesGlowSize = [...preset.effects.speciesGlowArrays.sizes] || [...this.speciesGlowSize];
                this.speciesGlowIntensity = [...preset.effects.speciesGlowArrays.intensities] || [...this.speciesGlowIntensity];
            }
            
            // Species Halo Effect
            if (preset.effects.speciesHaloArrays) {
                this.speciesHaloIntensity = [...preset.effects.speciesHaloArrays.intensities] || [...this.speciesHaloIntensity];
                this.speciesHaloRadius = [...preset.effects.speciesHaloArrays.radii] || [...this.speciesHaloRadius];
            }
            
            // Per-Species Trail Effect
            if (preset.effects.linkAllSpeciesTrails !== undefined) {
                this.linkAllSpeciesTrails = preset.effects.linkAllSpeciesTrails;
            } else if (preset.effects.perSpeciesTrailEnabled !== undefined) {
                // Backward compatibility: convert old property to new property
                this.linkAllSpeciesTrails = !preset.effects.perSpeciesTrailEnabled;
            }
            if (preset.effects.speciesTrailArrays) {
                this.speciesTrailLength = [...preset.effects.speciesTrailArrays.lengths] || [...this.speciesTrailLength];
            }
        } else {
            // Fallback to old structure
            this.renderMode = preset.renderMode || 'normal';
            this.glowIntensity = preset.glowIntensity !== undefined ? preset.glowIntensity : 0.5;
            this.glowRadius = preset.glowRadius !== undefined ? preset.glowRadius : 2.0;
        }
        
        // Load FORCES Section
        this.collisionForce = preset.forces.collision;
        this.socialForce = preset.forces.social;
        
        // Load force pattern configuration if available
        if (preset.forces.pattern) {
            this.forcePatternType = preset.forces.pattern.type || 'random';
            this.forceDistribution = preset.forces.pattern.edgeBias || 0.8;
            this.forcePatternParameters = preset.forces.pattern.parameters || {};
        }
        
        // Ensure arrays are properly sized
        this.ensureGlowArraysSize();
        
        // Load audio configuration if available
        if (preset.audio && window.audioSystem && typeof window.audioSystem.loadConfig === 'function') {
            try {
                // Load audio configuration asynchronously
                window.audioSystem.loadConfig(preset.audio).catch(error => {
                    console.warn('Could not fully load audio settings:', error);
                });
            } catch (error) {
                console.warn('Could not load audio settings:', error);
            }
        }
        
        // Reinitialize particles with new configuration
        this.initializeParticlesWithPositions();
        
        // Notify UI components that preset has changed
        if (window.leftPanel && typeof window.leftPanel.onPresetChanged === 'function') {
            window.leftPanel.onPresetChanged();
        }
    }
    
    // Initialize particles using starting positions from preset
    initializeParticlesWithPositions() {
        this.particles = [];
        
        // Ensure canvas dimensions are valid
        if (!this.width || !this.height) {
            console.error('Canvas dimensions not set, cannot initialize particles');
            return;
        }
        
        for (let speciesId = 0; speciesId < this.numSpecies; speciesId++) {
            const species = this.species[speciesId];
            if (!species) {
                console.error(`Species ${speciesId} not found`);
                continue;
            }
            
            const count = species.particleCount || this.particlesPerSpecies;
            const startPos = species.startPosition || { type: 'cluster', center: { x: 0.5, y: 0.5 }, radius: 0.1 };
            
            // Ensure startPos has required properties
            if (!startPos.center) {
                startPos.center = { x: 0.5, y: 0.5 };
            }
            if (startPos.radius === undefined) {
                startPos.radius = 0.1;
            }
            
            for (let i = 0; i < count; i++) {
                let x, y;
                
                // Validate center coordinates and provide safe defaults
                let centerX = startPos.center && typeof startPos.center.x === 'number' && !isNaN(startPos.center.x) 
                    ? startPos.center.x * this.width 
                    : this.width * 0.5;
                let centerY = startPos.center && typeof startPos.center.y === 'number' && !isNaN(startPos.center.y) 
                    ? startPos.center.y * this.height 
                    : this.height * 0.5;
                let radius = typeof startPos.radius === 'number' && !isNaN(startPos.radius) 
                    ? startPos.radius * Math.min(this.width, this.height) 
                    : 50; // Safe default radius
                
                switch (startPos.type) {
                    case 'cluster':
                        const angle = Math.random() * Math.PI * 2;
                        const r = Math.random() * radius;
                        x = centerX + Math.cos(angle) * r;
                        y = centerY + Math.sin(angle) * r;
                        break;
                        
                    case 'ring':
                        const ringAngle = (i / count) * Math.PI * 2;
                        x = centerX + Math.cos(ringAngle) * radius * 0.8;
                        y = centerY + Math.sin(ringAngle) * radius * 0.8;
                        break;
                        
                    case 'grid':
                        const gridSize = Math.ceil(Math.sqrt(count));
                        const gridX = (i % gridSize) - gridSize / 2;
                        const gridY = Math.floor(i / gridSize) - gridSize / 2;
                        x = centerX + gridX * (radius * 2 / gridSize);
                        y = centerY + gridY * (radius * 2 / gridSize);
                        break;
                    
                    case 'custom':
                        if (startPos.customPoints && startPos.customPoints.length > 0) {
                            // Use weighted random selection based on opacity
                            const totalWeight = startPos.customPoints.reduce((sum, point) => sum + point.opacity, 0);
                            let randomWeight = Math.random() * totalWeight;
                            
                            let selectedPoint = startPos.customPoints[0];
                            for (const point of startPos.customPoints) {
                                randomWeight -= point.opacity;
                                if (randomWeight <= 0) {
                                    selectedPoint = point;
                                    break;
                                }
                            }
                            
                            // Add some random variation around the selected point
                            const variation = selectedPoint.size * 0.5;
                            const vAngle = Math.random() * Math.PI * 2;
                            const vRadius = Math.random() * variation * Math.min(this.width, this.height);
                            
                            x = selectedPoint.x * this.width + Math.cos(vAngle) * vRadius;
                            y = selectedPoint.y * this.height + Math.sin(vAngle) * vRadius;
                        } else {
                            // Fallback to center if no custom points
                            x = centerX;
                            y = centerY;
                        }
                        break;
                        
                    case 'random':
                    default:
                        x = centerX + (Math.random() - 0.5) * radius * 2;
                        y = centerY + (Math.random() - 0.5) * radius * 2;
                        break;
                }
                
                // Final validation to prevent NaN particles
                const finalX = isNaN(x) ? this.width * 0.5 : Math.max(this.particleSize, Math.min(this.width - this.particleSize, x));
                const finalY = isNaN(y) ? this.height * 0.5 : Math.max(this.particleSize, Math.min(this.height - this.particleSize, y));
                
                this.particles.push({
                    x: finalX,
                    y: finalY,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    species: speciesId,
                    age: 0,
                    energy: 1
                });
            }
        }
    }
    
    // Export current configuration as preset
    exportPreset() {
        const preset = {
            name: 'Custom',
            version: '1.0',
            
            // PARTICLES Section
            particles: {
                particlesPerSpecies: this.particlesPerSpecies,
                numSpecies: this.numSpecies,
                startPattern: this.species[0]?.startPosition?.type || 'cluster'
            },
            
            // SPECIES Section
            species: {
                count: this.numSpecies,
                definitions: this.species.map((s, i) => ({
                    id: i,
                    name: s.name || `Species ${i + 1}`,
                    color: this.normalizeColor(s.color),
                    size: s.size,
                    opacity: s.opacity,
                    particleCount: s.particleCount || this.particlesPerSpecies,
                    startPosition: s.startPosition || { type: 'cluster', center: { x: 0.5, y: 0.5 }, radius: 0.1 },
                    glowSize: this.speciesGlowSize[i] || 1.0,
                    glowIntensity: this.speciesGlowIntensity[i] || 0,
                    mobility: s.mobility || 1.5,
                    inertia: s.inertia || 0.85
                }))
            },
            
            // PHYSICS Section
            physics: {
                // Convert friction from physics value (0.8-1.0) to UI value (0-0.2)
                friction: 1.0 - this.friction,
                forceFactor: this.forceFactor,
                // Store full matrices, not just [0][0] values
                collisionRadius: this.collisionRadius,
                socialRadius: this.socialRadius,
                // Store single values for UI compatibility
                collisionRadiusValue: this.collisionRadius[0][0],
                socialRadiusValue: this.socialRadius[0][0],
                // Enhanced physics parameters
                collisionMultiplier: this.collisionMultiplier || 1.0,
                collisionOffset: this.collisionOffset || 0.0,  // Add missing collision offset
                environmentPressure: this.environmentalPressure || 0.0,  // Note: property has different name
                chaosLevel: this.chaosLevel || 0.0,
                // Shockwave settings
                shockwaveEnabled: this.shockwaveEnabled,
                shockwaveStrength: this.shockwaveStrength,
                shockwaveSize: this.shockwaveSize,
                shockwaveFalloff: this.shockwaveFalloff
            },
            
            // WALLS Section
            walls: {
                wallDamping: this.wallDamping,
                repulsiveForce: this.repulsiveForce,
                wrapAroundWalls: this.wrapAroundWalls
            },
            
            // VISUAL Section
            visual: {
                blur: this.blur,
                particleSize: this.particleSize,
                perSpeciesSize: this.perSpeciesSize,
                trailEnabled: this.trailEnabled,
                backgroundMode: this.backgroundMode,
                backgroundColor: this.backgroundColor,
                backgroundColor1: this.backgroundColor1,
                backgroundColor2: this.backgroundColor2,
                backgroundCycleTime: this.backgroundCycleTime
            },
            
            // EFFECTS Section
            effects: {
                // Trail Effect
                trailEnabled: this.trailEnabled,
                trailLength: this.blur,
                
                // Halo Effect
                haloEnabled: this.renderMode === 'dreamtime',
                haloIntensity: this.glowIntensity || 0.8,
                haloRadius: this.glowRadius || 3.0,
                
                // Species Glow Effect
                speciesGlowEnabled: this.speciesGlowIntensity.some(intensity => intensity > 0),
                speciesGlowArrays: {
                    sizes: [...this.speciesGlowSize],
                    intensities: [...this.speciesGlowIntensity]
                },
                
                // Species Halo Effect
                speciesHaloEnabled: this.speciesHaloIntensity.some(intensity => intensity > 0),
                speciesHaloArrays: {
                    intensities: [...this.speciesHaloIntensity],
                    radii: [...this.speciesHaloRadius]
                },
                
                // Per-Species Trail Effect
                linkAllSpeciesTrails: this.linkAllSpeciesTrails,
                speciesTrailArrays: {
                    lengths: [...this.speciesTrailLength]
                }
            },
            
            // FORCES Section
            forces: {
                collision: this.collisionForce,
                social: this.socialForce,
                pattern: {
                    type: this.forcePatternType || 'random',
                    edgeBias: this.forceDistribution || 0.8,
                    parameters: this.forcePatternParameters || {}
                }
            },
            
            // RENDER MODE & GLOBAL SETTINGS
            renderMode: this.renderMode,
            glowIntensity: this.glowIntensity,
            glowRadius: this.glowRadius
        };
        
        // Include audio settings if audio system is available
        if (window.audioSystem && typeof window.audioSystem.getConfig === 'function') {
            try {
                preset.audio = window.audioSystem.getConfig();
            } catch (error) {
                // If audio system fails, just skip it
                console.warn('Could not export audio settings:', error);
            }
        }
        
        return preset;
    }
    
    // Get current parameters for UI
    getParameters() {
        return {
            blur: this.blur,
            trailEnabled: this.trailEnabled,
            linkAllSpeciesTrails: this.linkAllSpeciesTrails,
            speciesTrailLength: this.speciesTrailLength,
            particleSize: this.particleSize,
            friction: this.friction,
            wallDamping: this.wallDamping,
            forceFactor: this.forceFactor,
            numSpecies: this.numSpecies,
            particlesPerSpecies: this.particlesPerSpecies,
            socialForce: this.socialForce,
            speciesGlowSize: this.speciesGlowSize.slice(0, this.numSpecies),
            speciesGlowIntensity: this.speciesGlowIntensity.slice(0, this.numSpecies)
        };
    }
    
    // Reset to default values
    loadDefaults() {
        this.numSpecies = 5;
        this.particlesPerSpecies = 150;
        this.particleSize = 3.0;
        this.perSpeciesSize = true;
        this.blur = 0.97;
        this.trailEnabled = true;
        this.friction = 0.95; // Physics value (0.05 UI value)
        this.forceFactor = 0.5;
        
        // Collision defaults
        this.collisionMultiplier = 1.0;
        this.collisionOffset = 0.0;
        
        // Wall behavior defaults
        this.wallDamping = 0.9;
        this.repulsiveForce = 0.3;
        this.wrapAroundWalls = false;
        
        // Shockwave defaults
        this.shockwaveEnabled = true;
        this.shockwaveStrength = 50;
        this.shockwaveSize = 150;
        this.shockwaveFalloff = 2.0;
        
        // Background color defaults
        this.backgroundMode = 'solid';
        this.backgroundColor = '#000000';
        this.backgroundColor1 = '#000000';
        this.backgroundColor2 = '#001133';
        this.backgroundCycleTime = 5.0;
        
        this.renderMode = 'normal';
        this.glowIntensity = 0.8;
        this.glowRadius = 3.0;
        this.startPattern = 'cluster';
        
        // Reset matrices
        this.collisionRadius = this.createMatrix(15, 15);
        this.socialRadius = this.createMatrix(50, 50);
        this.socialForce = this.createAsymmetricMatrix();
        this.collisionForce = this.createMatrix(-0.5, -0.5);
        
        // Reset species glow arrays
        this.speciesGlowSize = new Array(20).fill(1.0);
        this.speciesGlowIntensity = new Array(20).fill(0);
        
        // Reset species halo arrays
        this.speciesHaloIntensity = new Array(20).fill(0);
        this.speciesHaloRadius = new Array(20).fill(1.0);
        
        // Reset per-species trail arrays
        this.linkAllSpeciesTrails = true;
        this.speciesTrailLength = new Array(20).fill(0.95);
        
        // Reinitialize species and particles
        this.initializeSpecies();
        this.initializeParticles();
        
        // Clear caches
        this.clearCaches();
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.gridWidth = Math.ceil(width / this.gridSize);
        this.gridHeight = Math.ceil(height / this.gridSize);
        this.initSpatialGrid();
        this.gradientCache.clear(); // Clear cached gradients on resize
        this.haloGradientCache.clear();
    }
    
    // Update parameters from UI
    setParameter(name, value) {
        if (name === 'particleSize') {
            this.particleSize = value;
            // Update all species sizes if not in per-species mode
            this.updateSpeciesSizes();
        } else {
            this[name] = value;
        }
    }

    // Update species sizes based on current particleSize
    updateSpeciesSizes() {
        if (!this.species || this.species.length === 0) return;
        
        for (let i = 0; i < this.species.length; i++) {
            if (this.species[i]) {
                if (this.perSpeciesSize) {
                    // Keep varied sizes in per-species mode
                    if (!this.species[i].size || this.species[i].size <= 0) {
                        this.species[i].size = this.particleSize + (Math.random() - 0.5) * this.particleSize * 0.5;
                    }
                } else {
                    // Synchronize to global particle size
                    this.species[i].size = this.particleSize;
                }
            }
        }
    }
    
    setSocialForce(i, j, value) {
        if (this.socialForce[i] && j < this.socialForce[i].length) {
            this.socialForce[i][j] = value;
        }
    }
    
    // Apply force pattern with configurable parameters
    applyForcePattern(patternType, edgeBias = 0.8, userParameters = {}) {
        // Store configuration for preset saving
        this.forcePatternType = patternType;
        this.forceDistribution = edgeBias;
        this.forcePatternParameters = userParameters;
        
        // Generate and apply the force pattern
        this.socialForce = this.createForcePattern(patternType, edgeBias, userParameters);
        
        // Applied force pattern
    }
    
    // Mute/freeze functionality
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
    
    setMuted(muted) {
        this.muted = muted;
    }
    
    isMuted() {
        return this.muted;
    }
    
}