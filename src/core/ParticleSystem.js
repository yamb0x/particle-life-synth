import { Particle } from './Particle.js';
import { ForceField } from './ForceField.js';
export class ParticleSystem {
    constructor(canvas) {
        this.particles = [];
        this.attractionMatrix = [];
        this.species = [0, 1, 2, 3, 4]; // Active species
        this.physics = {
            maxForce: 1.5,
            maxSpeed: 6.0,
            friction: 0.05,
            minDistance: 10,
            maxDistance: 300
        };
        this.visual = {
            trailLength: 30,
            particleSize: 3,
            glowIntensity: 0.3
        };
        this.behaviorHistory = [];
        this.maxHistoryLength = 60; // 1 second at 60 FPS
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.forceField = new ForceField();
        this.initializeAttractionMatrix();
        this.initializeParticles();
    }
    initializeAttractionMatrix() {
        // Initialize 5x5 attraction matrix with default values
        this.attractionMatrix = [];
        for (let i = 0; i < 5; i++) {
            this.attractionMatrix[i] = [];
            for (let j = 0; j < 5; j++) {
                // Default to slightly attractive within species, neutral between species
                this.attractionMatrix[i][j] = i === j ? 0.3 : 0.1;
            }
        }
    }
    initializeParticles() {
        this.particles = [];
        const particlesPerSpecies = 200;
        for (let species = 0; species < 5; species++) {
            if (!this.species.includes(species))
                continue;
            for (let i = 0; i < particlesPerSpecies; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const particle = new Particle(x, y, species, this.visual.particleSize);
                particle.size = particle.isRunner ? this.visual.particleSize * 1.5 : this.visual.particleSize;
                particle.setTrailLength(this.visual.trailLength);
                this.particles.push(particle);
            }
        }
    }
    update(dt) {
        // Update physics
        this.updateForces();
        // Update particles and handle lifecycle
        const particlesToRemove = [];
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            particle.update(dt, this.physics.friction);
            particle.limitVelocity(this.physics.maxSpeed);
            this.handleBoundaries(particle);
            // Check if particle should die
            if (particle.energy <= 0.1 || particle.age > 10000) {
                particlesToRemove.push(i);
            }
        }
        // Remove dead particles and spawn new ones
        for (let i = particlesToRemove.length - 1; i >= 0; i--) {
            const deadParticle = this.particles[particlesToRemove[i]];
            this.particles.splice(particlesToRemove[i], 1);
            // Spawn new particle of same species
            const newParticle = new Particle(Math.random() * this.width, Math.random() * this.height, deadParticle.species, this.visual.particleSize);
            newParticle.maxTrailLength = this.visual.trailLength;
            this.particles.push(newParticle);
        }
        // Update behavior metrics
        this.updateBehaviorMetrics();
    }
    updateForces() {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            let fx = 0;
            let fy = 0;
            // Calculate forces from all other particles
            for (let j = 0; j < this.particles.length; j++) {
                if (i === j)
                    continue;
                const other = this.particles[j];
                const distance = particle.distanceTo(other);
                if (distance > this.physics.maxDistance)
                    continue;
                const dx = other.x - particle.x;
                const dy = other.y - particle.y;
                // Use force field to calculate force
                const force = this.forceField.calculateForce(distance, particle.species, other.species, particle.isRunner);
                // Apply force
                fx += (dx / distance) * force;
                fy += (dy / distance) * force;
                // Energy transfer on close interactions
                if (distance < this.physics.minDistance * 2 && force > 0) {
                    const energyDiff = other.energy - particle.energy;
                    const transferRate = 0.01 * Math.abs(force);
                    particle.energy += energyDiff * transferRate;
                    other.energy -= energyDiff * transferRate;
                }
            }
            // Apply force
            particle.applyForce(fx, fy, this.physics.maxForce);
        }
    }
    handleBoundaries(particle) {
        const margin = 20;
        // Wrap around screen edges
        if (particle.x < -margin)
            particle.x = this.width + margin;
        if (particle.x > this.width + margin)
            particle.x = -margin;
        if (particle.y < -margin)
            particle.y = this.height + margin;
        if (particle.y > this.height + margin)
            particle.y = -margin;
    }
    updateBehaviorMetrics() {
        const metrics = {
            clusterCoherence: this.calculateClusterCoherence(),
            patternStability: this.calculatePatternStability(),
            movementComplexity: this.calculateMovementComplexity(),
            interSpeciesMixing: this.calculateInterSpeciesMixing(),
            energyConservation: this.calculateEnergyConservation()
        };
        this.behaviorHistory.push(metrics);
        // Keep history size under control
        while (this.behaviorHistory.length > this.maxHistoryLength) {
            this.behaviorHistory.shift();
        }
    }
    calculateClusterCoherence() {
        // Calculate how well particles of the same species cluster together
        let totalCoherence = 0;
        let speciesCount = 0;
        for (const species of this.species) {
            const speciesParticles = this.particles.filter(p => p.species === species);
            if (speciesParticles.length < 2)
                continue;
            let avgDistance = 0;
            let count = 0;
            for (let i = 0; i < speciesParticles.length; i++) {
                for (let j = i + 1; j < speciesParticles.length; j++) {
                    avgDistance += speciesParticles[i].distanceTo(speciesParticles[j]);
                    count++;
                }
            }
            if (count > 0) {
                avgDistance /= count;
                // Normalize to 0-1 range (smaller distance = higher coherence)
                totalCoherence += Math.max(0, 1 - avgDistance / this.physics.maxDistance);
                speciesCount++;
            }
        }
        return speciesCount > 0 ? totalCoherence / speciesCount : 0;
    }
    calculatePatternStability() {
        // Compare current metrics to recent history
        if (this.behaviorHistory.length < 30)
            return 0;
        const recent = this.behaviorHistory.slice(-30);
        const coherenceVariance = this.calculateVariance(recent.map(m => m.clusterCoherence));
        // Lower variance = higher stability
        return Math.max(0, 1 - coherenceVariance * 10);
    }
    calculateMovementComplexity() {
        // Calculate entropy of particle movements
        let totalSpeed = 0;
        let speedVariance = 0;
        const speeds = this.particles.map(p => Math.sqrt(p.vx * p.vx + p.vy * p.vy));
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        for (const speed of speeds) {
            speedVariance += Math.pow(speed - avgSpeed, 2);
        }
        speedVariance /= speeds.length;
        // Normalize variance to 0-1 range
        return Math.min(1, speedVariance / (this.physics.maxSpeed * this.physics.maxSpeed));
    }
    calculateInterSpeciesMixing() {
        // Calculate how much different species are mixed together
        let mixingScore = 0;
        let totalPairs = 0;
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const distance = p1.distanceTo(p2);
                if (distance < this.physics.maxDistance / 2) {
                    if (p1.species !== p2.species) {
                        mixingScore += 1;
                    }
                    totalPairs++;
                }
            }
        }
        return totalPairs > 0 ? mixingScore / totalPairs : 0;
    }
    calculateEnergyConservation() {
        // Calculate system energy stability
        let totalEnergy = 0;
        for (const particle of this.particles) {
            const kineticEnergy = 0.5 * (particle.vx * particle.vx + particle.vy * particle.vy);
            totalEnergy += kineticEnergy;
        }
        // Normalize to 0-1 range
        const maxPossibleEnergy = this.particles.length * 0.5 * this.physics.maxSpeed * this.physics.maxSpeed;
        return Math.min(1, totalEnergy / maxPossibleEnergy);
    }
    calculateVariance(values) {
        if (values.length === 0)
            return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }
    getParticles() {
        return this.particles;
    }
    getAttractionMatrix() {
        return this.attractionMatrix;
    }
    loadEcosystemPreset(name) {
        this.forceField.loadPreset(name);
        // Reset particles to see the new behavior
        this.resetParticles();
    }
    getForceField() {
        return this.forceField;
    }
    setAttractionMatrix(matrix) {
        this.attractionMatrix = matrix;
    }
    setAttractionValue(species1, species2, value) {
        if (species1 >= 0 && species1 < 5 && species2 >= 0 && species2 < 5) {
            this.attractionMatrix[species1][species2] = value;
        }
    }
    getCurrentBehaviorMetrics() {
        return this.behaviorHistory.length > 0 ?
            this.behaviorHistory[this.behaviorHistory.length - 1] : null;
    }
    resetParticles() {
        this.initializeParticles();
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    setSpeciesCount(count) {
        this.species = Array.from({ length: count }, (_, i) => i);
        this.initializeParticles();
    }
    setParticlesPerSpecies(count) {
        // Reinitialize with new particle count
        this.particles = [];
        for (let species = 0; species < 5; species++) {
            if (!this.species.includes(species))
                continue;
            for (let i = 0; i < count; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const particle = new Particle(x, y, species, this.visual.particleSize);
                particle.size = particle.isRunner ? this.visual.particleSize * 1.5 : this.visual.particleSize;
                particle.setTrailLength(this.visual.trailLength);
                this.particles.push(particle);
            }
        }
    }
    updateVisualParams() {
        for (const particle of this.particles) {
            particle.size = particle.isRunner ? this.visual.particleSize * 1.5 : this.visual.particleSize;
            particle.setTrailLength(this.visual.trailLength);
        }
    }
}
