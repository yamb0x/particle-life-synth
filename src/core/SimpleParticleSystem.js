/**
 * Simplified Particle System inspired by Ventrella's Clusters
 * Focuses on asymmetric behaviors and visual interest
 */

export class SimpleParticleSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
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
        this.perSpeciesSize = false; // Enable per-species particle size control
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
        
        // Physics settings
        this.friction = 0.98;
        this.wallDamping = 0.8;
        this.forceFactor = 0.5;
        
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
        
        // Asymmetric force matrices - the key to interesting behaviors!
        this.collisionRadius = this.createMatrix(15, 25); // Close range
        this.socialRadius = this.createMatrix(50, 150);   // Long range
        this.collisionForce = this.createMatrix(-1, -0.5); // Repulsion
        this.socialForce = this.createAsymmetricMatrix();  // Attraction/repulsion
        
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
        
        // Cached gradient for dreamtime mode
        this.gradientCache = new Map();
        
        // Object pools for memory optimization
        this.tempArrayPool = [];
        this.poolIndex = 0;
        
        // Mute/freeze functionality for performance saving
        this.muted = false;
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
        console.log(`Initializing spatial grid: ${this.gridWidth}x${this.gridHeight} = ${totalCells} cells`);
        
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
                const checkX = gx + dx;
                const checkY = gy + dy;
                if (checkX >= 0 && checkX < this.gridWidth && checkY >= 0 && checkY < this.gridHeight) {
                    const gridIndex = checkY * this.gridWidth + checkX;
                    nearby.push(...this.spatialGrid[gridIndex]);
                }
            }
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
        // Keep object pools but clear their contents
        if (this.tempArrayPool) {
            this.tempArrayPool.forEach(arr => arr.length = 0);
        }
    }
    
    applyTrailDecay() {
        // Use fillRect with globalCompositeOperation for clean trails
        // This prevents the gray residue accumulation issue completely
        
        // Get current background color (dynamic for sinusoidal mode)
        const currentBgColor = this.getCurrentBackgroundColor();
        
        // Parse background color to get RGB values
        let bgR = 0, bgG = 0, bgB = 0;
        if (currentBgColor.startsWith('#')) {
            const hex = currentBgColor.slice(1);
            bgR = parseInt(hex.substr(0, 2), 16) || 0;
            bgG = parseInt(hex.substr(2, 2), 16) || 0;
            bgB = parseInt(hex.substr(4, 2), 16) || 0;
        }
        
        // Calculate alpha for trail effect
        // this.blur represents trail length (0.5-0.99, higher = shorter trails)
        // Convert to alpha overlay (higher blur = more overlay toward background)
        const trailAlpha = 1 - this.blur;
        
        // Apply trail decay using alpha blending
        this.ctx.save();
        this.ctx.globalAlpha = trailAlpha;
        this.ctx.fillStyle = currentBgColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
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
        
        console.log(`Changing species count from ${this.numSpecies} to ${newCount}, canvas: ${this.width}x${this.height}`);
        
        const oldCount = this.numSpecies;
        this.numSpecies = newCount;
        
        // Preserve existing force matrices where possible
        this.preserveAndResizeForceMatrices(oldCount, newCount);
        
        // Resize glow arrays
        this.ensureGlowArraysSize();
        
        // Resize species array
        this.resizeSpeciesArray(oldCount, newCount);
        
        // CRITICAL FIX: Reinitialize spatial grid BEFORE reinitializing particles
        // This ensures the grid is properly sized for the new particle configuration
        console.log('Initializing spatial grid...');
        this.initSpatialGrid();
        
        // Validate spatial grid was created successfully
        if (!this.spatialGrid || this.spatialGrid.length === 0) {
            console.error('Failed to initialize spatial grid, aborting species count change');
            this.numSpecies = oldCount; // Revert
            return false;
        }
        
        console.log(`Spatial grid initialized: ${this.spatialGrid.length} cells`);
        
        // Reinitialize particles with new species count
        console.log('Reinitializing particles...');
        this.initializeParticlesWithPositions();
        
        console.log(`Particles initialized: ${this.particles.length} particles`);
        
        // Update spatial grid with new particles to prevent undefined grid cell access
        console.log('Updating spatial grid with new particles...');
        this.updateSpatialGrid();
        
        console.log('Species count change completed successfully');
        
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
        
        console.log(`Updated main UI elements to species count: ${newCount}`);
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
                // Keep existing species configuration
                this.species[i] = { ...oldSpecies[i] };
            } else {
                // Create new species with default configuration
                this.species[i] = {
                    color: this.generateSpeciesColor(i),
                    size: this.particleSize,
                    opacity: 0.9,
                    particleCount: this.particlesPerSpecies,
                    startPosition: {
                        type: 'random',
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
            this.species[i] = {
                color: baseColors[i % baseColors.length],
                size: this.particleSize, // Use global particle size
                opacity: 0.8 + Math.random() * 0.2, // Vary particle opacity
                particleCount: this.particlesPerSpecies,
                startPosition: {
                    type: this.startPattern || 'cluster',
                    center: { x: 0.5, y: 0.5 },
                    radius: 0.2
                }
            };
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
        
        // Reinitialize force matrices for new species count
        this.collisionRadius = this.createMatrix(15, 25);
        this.socialRadius = this.createMatrix(50, 150);
        this.collisionForce = this.createMatrix(-1, -0.5);
        this.socialForce = this.createAsymmetricMatrix();
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
        
        // Dynamic pattern generation that works for any number of species
        const generatePatternRow = (rowIndex, numSpecies) => {
            const row = new Array(numSpecies);
            
            // Create interesting predator-prey patterns that scale with species count
            for (let j = 0; j < numSpecies; j++) {
                if (rowIndex === j) {
                    // Self-interaction: weak positive or neutral
                    row[j] = 0.2 + Math.random() * 0.3;
                } else {
                    // Different pattern types based on relationship
                    const relationship = (j - rowIndex + numSpecies) % numSpecies;
                    
                    if (relationship === 1) {
                        // Chase next species (clockwise predator-prey)
                        row[j] = 0.5 + Math.random() * 0.4;
                    } else if (relationship === numSpecies - 1) {
                        // Flee from previous species (avoid being prey)
                        row[j] = -0.3 - Math.random() * 0.4;
                    } else if (relationship <= numSpecies / 3) {
                        // Neutral to slight attraction for nearby species
                        row[j] = -0.1 + Math.random() * 0.4;
                    } else if (relationship <= 2 * numSpecies / 3) {
                        // Mixed interactions for middle-distance species
                        row[j] = -0.3 + Math.random() * 0.6;
                    } else {
                        // Weak interactions for distant species
                        row[j] = -0.2 + Math.random() * 0.4;
                    }
                }
            }
            return row;
        };
        
        for (let i = 0; i < this.numSpecies; i++) {
            matrix[i] = generatePatternRow(i, this.numSpecies);
            
            // Add some randomness and ensure values stay in valid range
            for (let j = 0; j < this.numSpecies; j++) {
                matrix[i][j] += (Math.random() - 0.5) * 0.3;
                matrix[i][j] = Math.max(-1, Math.min(1, matrix[i][j]));
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
                    // Self-interaction: weak positive or neutral
                    row[j] = edgeBiasedRandom(0.2, 0.5, bias);
                } else {
                    // Different pattern types based on relationship
                    const relationship = (j - rowIndex + numSpecies) % numSpecies;
                    
                    if (relationship === 1) {
                        // Chase next species (clockwise predator-prey)
                        row[j] = edgeBiasedRandom(0.5, 0.9, bias);
                    } else if (relationship === numSpecies - 1) {
                        // Flee from previous species (avoid being prey)
                        row[j] = edgeBiasedRandom(-0.7, -0.3, bias);
                    } else if (relationship <= numSpecies / 3) {
                        // Neutral to slight attraction for nearby species
                        row[j] = edgeBiasedRandom(-0.1, 0.3, bias);
                    } else if (relationship <= 2 * numSpecies / 3) {
                        // Mixed interactions for middle-distance species
                        row[j] = edgeBiasedRandom(-0.3, 0.3, bias);
                    } else {
                        // Weak interactions for distant species
                        row[j] = edgeBiasedRandom(-0.2, 0.2, bias);
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
            console.log(`Shockwave created at (${x.toFixed(1)}, ${y.toFixed(1)}) with strength ${this.shockwaveStrength}`);
        }
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
            const dx = particle.x - shockwave.x;
            const dy = particle.y - shockwave.y;
            const dist2 = dx * dx + dy * dy;
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
            const dx = particle.x - this.currentMousePos.x;
            const dy = particle.y - this.currentMousePos.y;
            const dist2 = dx * dx + dy * dy;
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
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist2 = dx * dx + dy * dy;
                
                // Critical fix: Prevent division by zero and very small distances
                const minDist2 = 0.01; // Minimum distance squared to prevent Infinity/NaN
                if (dist2 < minDist2) continue;
                
                const s1 = p1.species;
                const s2 = p2.species;
                
                // Pre-calculate radii squared to avoid sqrt
                const collisionR = Array.isArray(this.collisionRadius) && this.collisionRadius[s1] && this.collisionRadius[s1][s2] !== undefined 
                    ? this.collisionRadius[s1][s2] : 15;
                const collisionR2 = collisionR * collisionR;
                
                const socialR = Array.isArray(this.socialRadius) && this.socialRadius[s1] && this.socialRadius[s1][s2] !== undefined 
                    ? this.socialRadius[s1][s2] : 50;
                const socialR2 = socialR * socialR;
                
                // Early exit if particle is too far for any interaction
                if (dist2 > socialR2) continue;
                
                // Safe distance calculation with minimum threshold
                const dist = Math.sqrt(dist2);
                const invDist = 1.0 / Math.max(dist, 0.1); // Prevent division by very small numbers
                
                // Collision force (always repulsive at close range)
                if (dist2 < collisionR2) {
                    // Safety check for force matrix bounds
                    if (this.collisionForce[s1] && this.collisionForce[s1][s2] !== undefined) {
                        const force = this.collisionForce[s1][s2] * invDist;
                        fx += dx * invDist * force;
                        fy += dy * invDist * force;
                    }
                }
                
                // Social force (can be attractive or repulsive)
                if (dist2 < socialR2) {
                    // Safety check for force matrix bounds
                    if (this.socialForce[s1] && this.socialForce[s1][s2] !== undefined) {
                        const force = this.socialForce[s1][s2] * invDist;
                        fx += dx * invDist * force;
                        fy += dy * invDist * force;
                    }
                }
            }
            
            // Apply forces with NaN protection
            const forceX = fx * this.forceFactor;
            const forceY = fy * this.forceFactor;
            
            if (!isNaN(forceX) && !isNaN(forceY)) {
                p1.vx += forceX;
                p1.vy += forceY;
            }
            
            // Apply friction
            p1.vx *= this.friction;
            p1.vy *= this.friction;
            
            // Velocity sanity check
            if (isNaN(p1.vx) || isNaN(p1.vy)) {
                console.warn(`Particle ${i} velocity became NaN, resetting`);
                p1.vx = (Math.random() - 0.5) * 2;
                p1.vy = (Math.random() - 0.5) * 2;
            }
            
            // Update position with NaN validation
            p1.x += p1.vx;
            p1.y += p1.vy;
            
            // Critical safety check: Prevent NaN positions
            if (isNaN(p1.x) || isNaN(p1.y)) {
                console.warn(`Particle ${i} position became NaN, resetting to center`);
                p1.x = this.width * 0.5;
                p1.y = this.height * 0.5;
                p1.vx = (Math.random() - 0.5) * 2;
                p1.vy = (Math.random() - 0.5) * 2;
            }
            
            // Wall collisions with damping
            if (p1.x < this.particleSize || p1.x > this.width - this.particleSize) {
                p1.vx *= -this.wallDamping;
                p1.x = Math.max(this.particleSize, Math.min(this.width - this.particleSize, p1.x));
            }
            if (p1.y < this.particleSize || p1.y > this.height - this.particleSize) {
                p1.vy *= -this.wallDamping;
                p1.y = Math.max(this.particleSize, Math.min(this.height - this.particleSize, p1.y));
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
        
        if (this.frameCount % 60 === 0) {
            const fps = 1000 / this.avgFrameTime;
            if (fps < 30) {
                console.warn(`Performance warning: ${fps.toFixed(1)} FPS, ${this.avgFrameTime.toFixed(2)}ms per frame`);
            }
        }
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
        });
        
        // Load PHYSICS Section
        this.friction = 1.0 - preset.physics.friction;
        this.wallDamping = preset.physics.wallDamping;
        this.forceFactor = preset.physics.forceFactor;
        
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
        this.perSpeciesSize = preset.visual.perSpeciesSize !== undefined ? preset.visual.perSpeciesSize : false;
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
        } else {
            // Fallback to old structure
            this.renderMode = preset.renderMode || 'normal';
            this.glowIntensity = preset.glowIntensity !== undefined ? preset.glowIntensity : 0.5;
            this.glowRadius = preset.glowRadius !== undefined ? preset.glowRadius : 2.0;
        }
        
        // Load FORCES Section
        this.collisionForce = preset.forces.collision;
        this.socialForce = preset.forces.social;
        
        // Ensure arrays are properly sized
        this.ensureGlowArraysSize();
        
        // Reinitialize particles with new configuration
        this.initializeParticlesWithPositions();
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
                    glowIntensity: this.speciesGlowIntensity[i] || 0
                }))
            },
            
            // PHYSICS Section
            physics: {
                // Convert friction from physics value (0.8-1.0) to UI value (0-0.2)
                friction: 1.0 - this.friction,
                wallDamping: this.wallDamping,
                forceFactor: this.forceFactor,
                // Store full matrices, not just [0][0] values
                collisionRadius: this.collisionRadius,
                socialRadius: this.socialRadius,
                // Store single values for UI compatibility
                collisionRadiusValue: this.collisionRadius[0][0],
                socialRadiusValue: this.socialRadius[0][0],
                // Shockwave settings
                shockwaveEnabled: this.shockwaveEnabled,
                shockwaveStrength: this.shockwaveStrength,
                shockwaveSize: this.shockwaveSize,
                shockwaveFalloff: this.shockwaveFalloff
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
                }
            },
            
            // FORCES Section
            forces: {
                collision: this.collisionForce,
                social: this.socialForce
            },
            
            // RENDER MODE & GLOBAL SETTINGS
            renderMode: this.renderMode,
            glowIntensity: this.glowIntensity,
            glowRadius: this.glowRadius
        };
        
        return preset;
    }
    
    // Get current parameters for UI
    getParameters() {
        return {
            blur: this.blur,
            trailEnabled: this.trailEnabled,
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
        this.perSpeciesSize = false;
        this.blur = 0.97;
        this.trailEnabled = true;
        this.friction = 0.95; // Physics value (0.05 UI value)
        this.wallDamping = 0.9;
        this.forceFactor = 0.5;
        
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
    }
    
    // Update parameters from UI
    setParameter(name, value) {
        this[name] = value;
    }
    
    setSocialForce(i, j, value) {
        if (this.socialForce[i] && j < this.socialForce[i].length) {
            this.socialForce[i][j] = value;
        }
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