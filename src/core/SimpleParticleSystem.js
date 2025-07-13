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
        this.trailEnabled = true;
        this.backgroundColor = '#000000'; // Default black background
        this.renderMode = 'normal'; // 'normal' or 'dreamtime'
        this.glowIntensity = 0.5; // 0-1, how strong the glow effect is
        this.glowRadius = 2.0; // Multiplier for glow size relative to particle size
        
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
        
        // Asymmetric force matrices - the key to interesting behaviors!
        this.collisionRadius = this.createMatrix(15, 25); // Close range
        this.socialRadius = this.createMatrix(50, 150);   // Long range
        this.collisionForce = this.createMatrix(-1, -0.5); // Repulsion
        this.socialForce = this.createAsymmetricMatrix();  // Attraction/repulsion
        
        // Canvas reference
        this.canvas = null;
        this.ctx = null;
        
        // Cached gradient for dreamtime mode
        this.gradientCache = new Map();
        
        // Object pools for memory optimization
        this.particlePool = [];
        this.tempArrayPool = [];
        this.poolIndex = 0;
    }
    
    initSpatialGrid() {
        this.spatialGrid = [];
        for (let i = 0; i < this.gridWidth * this.gridHeight; i++) {
            this.spatialGrid[i] = [];
        }
    }
    
    getGridIndex(x, y) {
        const gx = Math.floor(x / this.gridSize);
        const gy = Math.floor(y / this.gridSize);
        return Math.max(0, Math.min(this.gridWidth * this.gridHeight - 1, gy * this.gridWidth + gx));
    }
    
    updateSpatialGrid() {
        // Clear grid
        for (let i = 0; i < this.spatialGrid.length; i++) {
            this.spatialGrid[i].length = 0;
        }
        
        // Add particles to grid cells
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const gridIndex = this.getGridIndex(p.x, p.y);
            this.spatialGrid[gridIndex].push(i);
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
    
    clearCaches() {
        if (this.gradientCache) {
            this.gradientCache.clear();
        }
        // Keep object pools but clear their contents
        if (this.tempArrayPool) {
            this.tempArrayPool.forEach(arr => arr.length = 0);
        }
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
                size: 2 + Math.random() * 2, // Vary particle sizes
                opacity: 0.8 + Math.random() * 0.2 // Vary particle opacity
            };
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
        const patterns = [
            // Predator-prey cycles
            () => [0.8, -0.6, 0.3, -0.4, 0.5],
            () => [-0.5, 0.7, -0.6, 0.4, -0.3],
            () => [0.3, -0.4, 0.8, -0.7, 0.4],
            () => [-0.4, 0.5, -0.3, 0.6, -0.8],
            () => [0.6, -0.3, 0.4, -0.5, 0.7]
        ];
        
        for (let i = 0; i < this.numSpecies; i++) {
            matrix[i] = patterns[i % patterns.length]();
            // Add some randomness
            for (let j = 0; j < this.numSpecies; j++) {
                matrix[i][j] += (Math.random() - 0.5) * 0.3;
                matrix[i][j] = Math.max(-1, Math.min(1, matrix[i][j]));
            }
        }
        return matrix;
    }
    
    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
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
        this.time += dt;
        
        // Update spatial grid for optimized neighbor search
        this.updateSpatialGrid();
        
        // Trail effect - using globalAlpha to ensure complete fade to black
        if (this.trailEnabled) {
            // Set composite operation and alpha
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.globalAlpha = this.blur;  // Use blur directly - 0.95 = 95% black = short trails
            
            // Fill with background color
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Reset alpha for particle rendering
            this.ctx.globalAlpha = 1.0;
        } else {
            // Clear canvas completely - ensure alpha is 1.0 for full clear
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        
        // Update each particle with optimized force calculations
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            // Reset forces
            let fx = 0, fy = 0;
            
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
                
                if (dist2 === 0) continue;
                
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
                
                // Only calculate sqrt when needed
                const dist = Math.sqrt(dist2);
                const invDist = 1.0 / dist;
                
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
            
            // Apply forces
            p1.vx += fx * this.forceFactor;
            p1.vy += fy * this.forceFactor;
            
            // Apply friction
            p1.vx *= this.friction;
            p1.vy *= this.friction;
            
            // Update position
            p1.x += p1.vx;
            p1.y += p1.vy;
            
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
    
    render() {
        // Reset temp array pool for this frame
        this.resetTempArrays();
        
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
                const glowSize = size * this.glowRadius;
                
                // Get cached gradient
                const gradient = this.getOrCreateGradient(speciesId, size);
                
                // Set transform and draw all particles of this species
                this.ctx.save();
                this.ctx.fillStyle = gradient;
                
                for (const particle of speciesParticles) {
                    this.ctx.setTransform(1, 0, 0, 1, particle.x, particle.y);
                    this.ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
                }
                
                this.ctx.restore();
                
                // Draw bright cores for this species
                this.ctx.fillStyle = `rgba(${Math.min(255, color.r + 50)}, ${Math.min(255, color.g + 50)}, ${Math.min(255, color.b + 50)}, ${species.opacity})`;
                this.ctx.beginPath();
                for (const particle of speciesParticles) {
                    this.ctx.moveTo(particle.x + size * 0.5, particle.y);
                    this.ctx.arc(particle.x, particle.y, size * 0.5, 0, Math.PI * 2);
                }
                this.ctx.fill();
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
                
                // Set style once per species
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${species.opacity})`;
                this.ctx.beginPath();
                
                // Draw all particles of this species in one path
                for (const particle of speciesParticles) {
                    this.ctx.moveTo(particle.x + species.size, particle.y);
                    this.ctx.arc(particle.x, particle.y, species.size, 0, Math.PI * 2);
                }
                
                this.ctx.fill();
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
        
        // Update species configuration
        this.numSpecies = preset.species.count;
        this.species = [];
        
        preset.species.definitions.forEach((def, i) => {
            this.species[i] = {
                color: def.color,
                size: def.size,
                opacity: def.opacity,
                name: def.name,
                particleCount: def.particleCount,
                startPosition: def.startPosition
            };
        });
        
        // Update physics settings
        // Convert friction from UI value (0-0.2) to physics value (0.8-1.0)
        // UI: 0 = no friction, 0.2 = max friction
        // Physics: 1.0 = no friction, 0.8 = max friction
        this.friction = 1.0 - preset.physics.friction;
        this.wallDamping = preset.physics.wallDamping;
        this.forceFactor = preset.physics.forceFactor;
        // Convert single values to matrices for all species interactions
        const collisionR = preset.physics.collisionRadius;
        const socialR = preset.physics.socialRadius;
        this.collisionRadius = this.createMatrix(collisionR, collisionR);
        this.socialRadius = this.createMatrix(socialR, socialR);
        
        // Update visual settings
        this.blur = preset.visual.blur;
        this.particleSize = preset.visual.particleSize;
        this.trailEnabled = preset.visual.trailEnabled;
        this.backgroundColor = preset.visual.backgroundColor || '#000000';
        
        // Update render mode settings if present
        if (preset.renderMode) {
            this.renderMode = preset.renderMode;
        }
        if (preset.glowIntensity !== undefined) {
            this.glowIntensity = preset.glowIntensity;
        }
        if (preset.glowRadius !== undefined) {
            this.glowRadius = preset.glowRadius;
        }
        
        // Update force matrices
        this.collisionForce = preset.forces.collision;
        this.socialForce = preset.forces.social;
        
        // Reinitialize particles with new configuration
        this.initializeParticlesWithPositions();
    }
    
    // Initialize particles using starting positions from preset
    initializeParticlesWithPositions() {
        this.particles = [];
        
        for (let speciesId = 0; speciesId < this.numSpecies; speciesId++) {
            const species = this.species[speciesId];
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
                
                const centerX = startPos.center.x * this.width;
                const centerY = startPos.center.y * this.height;
                const radius = startPos.radius * Math.min(this.width, this.height);
                
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
                        
                    case 'random':
                    default:
                        x = centerX + (Math.random() - 0.5) * radius * 2;
                        y = centerY + (Math.random() - 0.5) * radius * 2;
                        break;
                }
                
                this.particles.push({
                    x: Math.max(this.particleSize, Math.min(this.width - this.particleSize, x)),
                    y: Math.max(this.particleSize, Math.min(this.height - this.particleSize, y)),
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
            species: {
                count: this.numSpecies,
                definitions: this.species.map((s, i) => ({
                    id: i,
                    name: s.name || `Species ${i + 1}`,
                    color: s.color,
                    size: s.size,
                    opacity: s.opacity,
                    particleCount: s.particleCount || this.particlesPerSpecies,
                    startPosition: s.startPosition || { type: 'cluster', center: { x: 0.5, y: 0.5 }, radius: 0.1 }
                }))
            },
            physics: {
                // Convert friction from physics value (0.8-1.0) to UI value (0-0.2)
                friction: 1.0 - this.friction,
                wallDamping: this.wallDamping,
                forceFactor: this.forceFactor,
                collisionRadius: this.collisionRadius[0][0],
                socialRadius: this.socialRadius[0][0]
            },
            visual: {
                blur: this.blur,
                particleSize: this.particleSize,
                trailEnabled: this.trailEnabled,
                backgroundColor: this.backgroundColor
            },
            forces: {
                collision: this.collisionForce,
                social: this.socialForce
            }
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
            socialForce: this.socialForce
        };
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
}