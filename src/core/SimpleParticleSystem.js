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
        
        // Visual settings
        this.blur = 0.95; // Trail effect (0.5-0.99, higher = shorter trails)
        this.particleSize = 3;
        this.trailEnabled = true;
        
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
    }
    
    initializeSpecies() {
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
        this.time += dt;
        
        // Trail effect - using globalAlpha to ensure complete fade to black
        if (this.trailEnabled) {
            // Set composite operation and alpha
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.globalAlpha = this.blur;  // Use blur directly - 0.95 = 95% black = short trails
            
            // Fill with pure black
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Reset alpha for particle rendering
            this.ctx.globalAlpha = 1.0;
        } else {
            // Clear canvas completely
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        
        // Update each particle
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            // Reset forces
            let fx = 0, fy = 0;
            
            // Calculate forces from other particles
            for (let j = 0; j < this.particles.length; j++) {
                if (i === j) continue;
                
                const p2 = this.particles[j];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist2 = dx * dx + dy * dy;
                
                if (dist2 === 0) continue;
                
                const dist = Math.sqrt(dist2);
                const s1 = p1.species;
                const s2 = p2.species;
                
                // Collision force (always repulsive at close range)
                const collisionR = Array.isArray(this.collisionRadius) ? this.collisionRadius[s1][s2] : this.collisionRadius;
                if (dist < collisionR) {
                    const force = this.collisionForce[s1][s2] / dist;
                    fx += (dx / dist) * force;
                    fy += (dy / dist) * force;
                }
                
                // Social force (can be attractive or repulsive)
                const socialR = Array.isArray(this.socialRadius) ? this.socialRadius[s1][s2] : this.socialRadius;
                if (dist < socialR) {
                    const force = this.socialForce[s1][s2] / dist;
                    fx += (dx / dist) * force;
                    fy += (dy / dist) * force;
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
    }
    
    render() {
        // Simple, clean rendering like Clusters
        for (const particle of this.particles) {
            const species = this.species[particle.species];
            const color = species.color;
            
            // Draw particle - simple circle
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${species.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, species.size, 0, Math.PI * 2);
            this.ctx.fill();
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
                backgroundColor: '#000000'
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
    }
    
    // Update parameters from UI
    setParameter(name, value) {
        this[name] = value;
    }
    
    setSocialForce(i, j, value) {
        this.socialForce[i][j] = value;
    }
}