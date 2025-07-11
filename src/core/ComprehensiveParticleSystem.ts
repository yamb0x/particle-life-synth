import { Particle } from './Particle.js';
import { NonLinearForceField } from './NonLinearForceField.js';
import { ParticleStateMachine, ParticleState, StateContext } from './ParticleStateMachine.js';

// Comprehensive parameter interface matching advanced particle life systems
export interface ComprehensivePhysicsParams {
    // Force parameters (per species pair - 5x5 matrix)
    attractionMatrix: number[][];     // -1 to 1 (repulsion to attraction)
    minRadius: number[][];            // Minimum interaction distance
    maxRadius: number[][];            // Maximum interaction distance
    
    // Global physics
    friction: number;                 // 0.0 to 1.0
    forceFactor: number;             // 0.1 to 10.0
    maxVelocity: number;             // 0.1 to 20.0
    timeStep: number;                // 0.001 to 0.1
    
    // Boundary behavior
    boundaryMode: 'wrap' | 'bounce' | 'infinite' | 'teleport';
    boundaryDamping: number;         // 0.0 to 1.0
    
    // Advanced dynamics
    viscosity: number;               // 0.0 to 1.0 (fluid-like resistance)
    turbulence: number;              // 0.0 to 1.0 (random force noise)
    gravity: { x: number; y: number }; // -1.0 to 1.0
    rotationalForces: boolean;       // Enable vortex-like behaviors
}

export interface SpeciesParams {
    // Per-species properties
    mass: number[];                  // 0.1 to 10.0
    charge: number[];                // -1.0 to 1.0 (for electric-like forces)
    temperature: number[];           // 0.0 to 2.0 (affects movement speed)
    metabolism: number[];            // 0.0 to 1.0 (energy consumption rate)
    
    // Behavioral tendencies
    aggression: number[];            // 0.0 to 1.0
    sociability: number[];           // 0.0 to 1.0
    curiosity: number[];             // 0.0 to 1.0
    fear: number[];                  // 0.0 to 1.0
    
    // Lifecycle parameters
    reproductionRate: number[];      // 0.0 to 0.1
    lifespan: number[];              // 100 to 10000 timesteps
    maturityAge: number[];           // 10 to 1000 timesteps
    energyCapacity: number[];        // 1.0 to 10.0
}

export interface EnvironmentalParams {
    // Field effects
    fieldStrength: number;           // 0.0 to 1.0
    fieldType: 'none' | 'radial' | 'linear' | 'spiral' | 'turbulent';
    fieldCenter: { x: number; y: number };
    
    // Resource distribution
    resourceDensity: number;         // 0.0 to 1.0
    resourceRegenerationRate: number; // 0.0 to 0.1
    resourceClustering: number;      // 0.0 to 1.0
    
    // Environmental pressure
    temperature: number;             // 0.0 to 2.0 (affects all particles)
    pressure: number;                // 0.0 to 2.0 (affects density)
    radiation: number;               // 0.0 to 1.0 (causes mutations)
}

export interface EmergentBehaviorParams {
    // Flocking parameters
    alignmentRadius: number;         // 0 to 200
    alignmentStrength: number;       // 0.0 to 1.0
    cohesionRadius: number;          // 0 to 200
    cohesionStrength: number;        // 0.0 to 1.0
    separationRadius: number;        // 0 to 100
    separationStrength: number;      // 0.0 to 1.0
    
    // Collective intelligence
    informationTransferRate: number; // 0.0 to 1.0
    memoryDecayRate: number;         // 0.0 to 0.1
    learningRate: number;            // 0.0 to 0.1
    
    // Pattern formation
    crystallizationTendency: number; // 0.0 to 1.0
    patternPersistence: number;      // 0.0 to 1.0
    symmetryPreference: number;      // 0.0 to 1.0
}

export interface QuantumParams {
    // Quantum-inspired behaviors
    tunneling: boolean;              // Particles can "jump" through barriers
    entanglement: boolean;           // Paired particles affect each other
    superposition: boolean;          // Particles can be in multiple states
    uncertaintyPrinciple: number;    // 0.0 to 1.0 (position/velocity trade-off)
    waveFunction: boolean;           // Probability-based positioning
}

export interface ChemicalParams {
    // Pheromone/chemical signaling
    pheromoneTypes: number;          // 1 to 10 different signal types
    pheromoneStrength: number[];     // Per-species emission strength
    pheromoneDecayRate: number;      // 0.0 to 0.1
    pheromoneResponseMatrix: number[][];  // Species x Pheromone type
    
    // Chemical reactions
    reactionProbability: number[][];  // Probability when species meet
    reactionProducts: number[][];     // What species are produced
    catalystEffect: number[][];       // How species affect reaction rates
}

export interface NeuralParams {
    // Neural network-inspired connections
    synapseFormationRate: number;    // 0.0 to 0.1
    synapseStrength: number;         // 0.0 to 1.0
    synapseDecay: number;            // 0.0 to 0.1
    signalPropagationSpeed: number;  // 0.1 to 10.0
    refractoryPeriod: number;        // 0 to 100 timesteps
}

export interface AdvancedRenderingParams {
    // Visual parameters
    particleSize: number[];          // Per-species size
    particleShape: ('circle' | 'square' | 'triangle' | 'star')[];
    glowIntensity: number[];         // 0.0 to 1.0
    trailLength: number;             // 0 to 100
    trailOpacity: number;            // 0.0 to 1.0
    colorBlending: boolean;          // Mix colors when particles overlap
    motionBlur: boolean;             // Add motion blur effect
}

export class ComprehensiveParticleSystem {
    private particles: Particle[] = [];
    private stateMachines: Map<Particle, ParticleStateMachine> = new Map();
    private nonLinearForceField: NonLinearForceField;
    private selectedColors: number = 5;
    private particlesPerSpecies: number = 200;
    
    // All parameter groups
    public physics: ComprehensivePhysicsParams;
    public species: SpeciesParams;
    public environment: EnvironmentalParams;
    public emergent: EmergentBehaviorParams;
    public quantum: QuantumParams;
    public chemical: ChemicalParams;
    public neural: NeuralParams;
    public rendering: AdvancedRenderingParams;
    
    // Spatial optimization
    private spatialGrid: Map<string, Particle[]> = new Map();
    private gridCellSize: number = 50;
    
    // Chemical field
    private pheromoneField: Float32Array[][];
    private fieldResolution: number = 10; // Grid resolution for pheromone field
    
    // Resource field
    private resourceField: Float32Array;
    
    // Canvas reference
    private canvas: HTMLCanvasElement;
    private width: number;
    private height: number;
    
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.nonLinearForceField = new NonLinearForceField();
        this.initializeDefaultParams();
        this.initializeFields(width, height);
        // Don't initialize particles here - wait for setCanvas
    }
    
    private initializeDefaultParams(): void {
        // Initialize with sensible defaults that create interesting behaviors
        this.physics = {
            attractionMatrix: this.createRandomMatrix(-1, 1),
            minRadius: this.createUniformMatrix(10, 30),
            maxRadius: this.createUniformMatrix(50, 200),
            friction: 0.05,
            forceFactor: 1.0,
            maxVelocity: 5.0,
            timeStep: 0.016,
            boundaryMode: 'wrap',
            boundaryDamping: 0.9,
            viscosity: 0.1,
            turbulence: 0.05,
            gravity: { x: 0, y: 0 },
            rotationalForces: true
        };
        
        this.species = {
            mass: [1.0, 1.2, 0.8, 1.5, 0.9],
            charge: [0.0, 0.2, -0.2, 0.5, -0.3],
            temperature: [1.0, 1.1, 0.9, 1.2, 0.8],
            metabolism: [0.3, 0.4, 0.2, 0.5, 0.25],
            aggression: [0.3, 0.7, 0.2, 0.8, 0.1],
            sociability: [0.7, 0.3, 0.8, 0.2, 0.9],
            curiosity: [0.5, 0.6, 0.4, 0.7, 0.3],
            fear: [0.3, 0.2, 0.6, 0.1, 0.8],
            reproductionRate: [0.01, 0.015, 0.008, 0.02, 0.005],
            lifespan: [5000, 4000, 6000, 3000, 7000],
            maturityAge: [100, 120, 80, 150, 90],
            energyCapacity: [2.0, 2.5, 1.8, 3.0, 1.5]
        };
        
        this.environment = {
            fieldStrength: 0.0,
            fieldType: 'none',
            fieldCenter: { x: 0.5, y: 0.5 },
            resourceDensity: 0.3,
            resourceRegenerationRate: 0.01,
            resourceClustering: 0.5,
            temperature: 1.0,
            pressure: 1.0,
            radiation: 0.0
        };
        
        this.emergent = {
            alignmentRadius: 50,
            alignmentStrength: 0.3,
            cohesionRadius: 80,
            cohesionStrength: 0.2,
            separationRadius: 30,
            separationStrength: 0.5,
            informationTransferRate: 0.1,
            memoryDecayRate: 0.01,
            learningRate: 0.05,
            crystallizationTendency: 0.3,
            patternPersistence: 0.7,
            symmetryPreference: 0.5
        };
        
        this.quantum = {
            tunneling: false,
            entanglement: false,
            superposition: false,
            uncertaintyPrinciple: 0.0,
            waveFunction: false
        };
        
        this.chemical = {
            pheromoneTypes: 3,
            pheromoneStrength: [0.5, 0.3, 0.7, 0.2, 0.6],
            pheromoneDecayRate: 0.02,
            pheromoneResponseMatrix: this.createRandomMatrix(-1, 1),
            reactionProbability: this.createUniformMatrix(0, 0.1),
            reactionProducts: this.createUniformMatrix(0, 4),
            catalystEffect: this.createUniformMatrix(0, 2)
        };
        
        this.neural = {
            synapseFormationRate: 0.01,
            synapseStrength: 0.5,
            synapseDecay: 0.005,
            signalPropagationSpeed: 2.0,
            refractoryPeriod: 10
        };
        
        this.rendering = {
            particleSize: [3, 3, 3, 3, 3],
            particleShape: ['circle', 'circle', 'circle', 'circle', 'circle'],
            glowIntensity: [0.3, 0.3, 0.3, 0.3, 0.3],
            trailLength: 30,
            trailOpacity: 0.5,
            colorBlending: true,
            motionBlur: false
        };
    }
    
    private createRandomMatrix(min: number, max: number): number[][] {
        const matrix: number[][] = [];
        for (let i = 0; i < 5; i++) {
            matrix[i] = [];
            for (let j = 0; j < 5; j++) {
                matrix[i][j] = min + Math.random() * (max - min);
            }
        }
        return matrix;
    }
    
    private createUniformMatrix(min: number, max: number): number[][] {
        const matrix: number[][] = [];
        for (let i = 0; i < 5; i++) {
            matrix[i] = [];
            for (let j = 0; j < 5; j++) {
                matrix[i][j] = min + (i + j) * (max - min) / 8;
            }
        }
        return matrix;
    }
    
    private initializeFields(width: number, height: number): void {
        // Initialize pheromone fields
        const fieldWidth = Math.ceil(width / this.fieldResolution);
        const fieldHeight = Math.ceil(height / this.fieldResolution);
        
        this.pheromoneField = [];
        for (let type = 0; type < this.chemical.pheromoneTypes; type++) {
            this.pheromoneField[type] = [];
            for (let x = 0; x < fieldWidth; x++) {
                this.pheromoneField[type][x] = new Float32Array(fieldHeight);
            }
        }
        
        // Initialize resource field
        this.resourceField = new Float32Array(fieldWidth * fieldHeight);
        this.generateResourceField(fieldWidth, fieldHeight);
    }
    
    private generateResourceField(width: number, height: number): void {
        // Generate clustered resources using Perlin noise or similar
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const index = y * width + x;
                const noise = this.simplexNoise(x * 0.1, y * 0.1);
                this.resourceField[index] = Math.max(0, noise * this.environment.resourceDensity);
            }
        }
    }
    
    private simplexNoise(x: number, y: number): number {
        // Simple noise function for resource generation
        return Math.sin(x * 12.9898 + y * 78.233) * 0.5 + 0.5;
    }
    
    public update(dt: number): void {
        // Update time step
        const actualDt = dt * this.physics.timeStep;
        
        // Update environmental fields
        this.updatePheromoneField(actualDt);
        this.updateResourceField(actualDt);
        
        // Update spatial grid
        this.updateSpatialGrid();
        
        // Update force field time
        this.nonLinearForceField.updateTime(actualDt);
        
        // Update each particle
        for (const particle of this.particles) {
            const stateMachine = this.stateMachines.get(particle);
            if (!stateMachine) continue;
            
            // Calculate context for state machine
            const context = this.calculateStateContext(particle);
            
            // Update state machine
            stateMachine.update(particle, context, actualDt);
            
            // Apply physics
            this.applyForces(particle, actualDt);
            this.applyEnvironmentalEffects(particle, actualDt);
            
            // Update particle
            particle.update(actualDt, this.physics.friction);
            
            // Apply boundary conditions
            this.applyBoundaryConditions(particle);
            
            // Handle lifecycle
            this.handleLifecycle(particle, actualDt);
        }
        
        // Handle emergent behaviors
        this.processEmergentBehaviors(actualDt);
        
        // Handle chemical reactions
        this.processChemicalReactions(actualDt);
        
        // Handle quantum effects
        if (this.quantum.tunneling || this.quantum.entanglement || this.quantum.superposition) {
            this.processQuantumEffects(actualDt);
        }
    }
    
    private updateSpatialGrid(): void {
        this.spatialGrid.clear();
        
        for (const particle of this.particles) {
            const gridX = Math.floor(particle.x / this.gridCellSize);
            const gridY = Math.floor(particle.y / this.gridCellSize);
            const key = `${gridX},${gridY}`;
            
            if (!this.spatialGrid.has(key)) {
                this.spatialGrid.set(key, []);
            }
            this.spatialGrid.get(key)!.push(particle);
        }
    }
    
    private calculateStateContext(particle: Particle): StateContext {
        const nearbyParticles = new Map<number, Particle[]>();
        const perceptionRadius = 150;
        
        // Get nearby particles from spatial grid
        const gridX = Math.floor(particle.x / this.gridCellSize);
        const gridY = Math.floor(particle.y / this.gridCellSize);
        
        let localDensity = 0;
        let nearestPredator: Particle | undefined;
        let nearestPrey: Particle | undefined;
        let nearestMate: Particle | undefined;
        
        // Check surrounding grid cells
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                const key = `${gridX + dx},${gridY + dy}`;
                const cellParticles = this.spatialGrid.get(key) || [];
                
                for (const other of cellParticles) {
                    if (other === particle) continue;
                    
                    const distance = particle.distanceTo(other);
                    if (distance > perceptionRadius) continue;
                    
                    localDensity++;
                    
                    // Group by species
                    if (!nearbyParticles.has(other.species)) {
                        nearbyParticles.set(other.species, []);
                    }
                    nearbyParticles.get(other.species)!.push(other);
                    
                    // Determine relationships based on attraction matrix
                    const attraction = this.physics.attractionMatrix[particle.species] && 
                                     this.physics.attractionMatrix[particle.species][other.species] 
                                     ? this.physics.attractionMatrix[particle.species][other.species] 
                                     : 0;
                    
                    if (attraction < -0.5 && (!nearestPredator || distance < particle.distanceTo(nearestPredator))) {
                        nearestPredator = other;
                    }
                    
                    if (attraction > 0.5 && (!nearestPrey || distance < particle.distanceTo(nearestPrey))) {
                        nearestPrey = other;
                    }
                    
                    if (other.species === particle.species && other.energy > 1.5 &&
                        (!nearestMate || distance < particle.distanceTo(nearestMate))) {
                        nearestMate = other;
                    }
                }
            }
        }
        
        // Calculate energy gradient from resource field
        const fieldX = Math.floor(particle.x / this.fieldResolution);
        const fieldY = Math.floor(particle.y / this.fieldResolution);
        const energyGradient = this.calculateResourceGradient(fieldX, fieldY);
        
        return {
            nearbyParticles,
            localDensity,
            nearestPredator,
            nearestPrey,
            nearestMate,
            energyGradient,
            environmentalPressure: this.environment.pressure * this.environment.temperature
        };
    }
    
    private calculateResourceGradient(x: number, y: number): { x: number; y: number } {
        const width = Math.ceil(this.width / this.fieldResolution);
        const height = Math.ceil(this.height / this.fieldResolution);
        
        let gradX = 0;
        let gradY = 0;
        
        // Sample surrounding cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = Math.max(0, Math.min(width - 1, x + dx));
                const ny = Math.max(0, Math.min(height - 1, y + dy));
                
                const value = this.resourceField[ny * width + nx];
                gradX += dx * value;
                gradY += dy * value;
            }
        }
        
        return { x: gradX * 0.1, y: gradY * 0.1 };
    }
    
    private applyForces(particle: Particle, dt: number): void {
        let totalFx = 0;
        let totalFy = 0;
        
        // Get nearby particles
        const gridX = Math.floor(particle.x / this.gridCellSize);
        const gridY = Math.floor(particle.y / this.gridCellSize);
        
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                const key = `${gridX + dx},${gridY + dy}`;
                const cellParticles = this.spatialGrid.get(key) || [];
                
                for (const other of cellParticles) {
                    if (other === particle) continue;
                    
                    const distance = particle.distanceTo(other);
                    const maxRadius = this.physics.maxRadius[particle.species] && 
                                    this.physics.maxRadius[particle.species][other.species]
                                    ? this.physics.maxRadius[particle.species][other.species]
                                    : 200;
                    
                    if (distance > maxRadius) continue;
                    
                    // Calculate base force
                    const attraction = this.physics.attractionMatrix[particle.species] && 
                                     this.physics.attractionMatrix[particle.species][other.species]
                                     ? this.physics.attractionMatrix[particle.species][other.species]
                                     : 0;
                    const minRadius = this.physics.minRadius[particle.species] && 
                                    this.physics.minRadius[particle.species][other.species]
                                    ? this.physics.minRadius[particle.species][other.species]
                                    : 20;
                    
                    let force = 0;
                    if (distance < minRadius) {
                        // Strong repulsion
                        force = -this.physics.forceFactor * 2.0 / (distance * distance);
                    } else {
                        // Use non-linear force field
                        const localDensity = cellParticles.length;
                        force = this.nonLinearForceField.calculateAdvancedForce(
                            distance,
                            particle.species,
                            other.species,
                            localDensity,
                            particle.isRunner
                        ) * attraction * this.physics.forceFactor;
                    }
                    
                    // Apply mass ratio
                    const massRatio = this.species.mass[other.species] / this.species.mass[particle.species];
                    force *= massRatio;
                    
                    // Add charge-based forces
                    const chargeForce = this.species.charge[particle.species] * 
                                       this.species.charge[other.species] * 
                                       -0.5 / (distance * distance);
                    force += chargeForce;
                    
                    // Apply force
                    const dx = other.x - particle.x;
                    const dy = other.y - particle.y;
                    totalFx += (dx / distance) * force;
                    totalFy += (dy / distance) * force;
                }
            }
        }
        
        // Apply turbulence
        if (this.physics.turbulence > 0) {
            totalFx += (Math.random() - 0.5) * this.physics.turbulence;
            totalFy += (Math.random() - 0.5) * this.physics.turbulence;
        }
        
        // Apply gravity
        totalFx += this.physics.gravity.x * this.species.mass[particle.species];
        totalFy += this.physics.gravity.y * this.species.mass[particle.species];
        
        // Apply environmental field
        if (this.environment.fieldStrength > 0) {
            const fieldForce = this.calculateFieldForce(particle);
            totalFx += fieldForce.x * this.environment.fieldStrength;
            totalFy += fieldForce.y * this.environment.fieldStrength;
        }
        
        // Apply viscosity
        totalFx -= particle.vx * this.physics.viscosity;
        totalFy -= particle.vy * this.physics.viscosity;
        
        // Temperature affects movement
        const tempFactor = this.species.temperature[particle.species] * this.environment.temperature;
        totalFx *= tempFactor;
        totalFy *= tempFactor;
        
        // Apply force to particle
        particle.applyForce(totalFx, totalFy, this.physics.forceFactor * 2);
        
        // Limit velocity
        particle.limitVelocity(this.physics.maxVelocity);
    }
    
    private calculateFieldForce(particle: Particle): { x: number; y: number } {
        const cx = this.environment.fieldCenter.x * this.width;
        const cy = this.environment.fieldCenter.y * this.height;
        
        switch (this.environment.fieldType) {
            case 'radial': {
                const dx = cx - particle.x;
                const dy = cy - particle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                return { x: dx / dist, y: dy / dist };
            }
            
            case 'linear': {
                return { x: 1, y: 0 };
            }
            
            case 'spiral': {
                const dx = cx - particle.x;
                const dy = cy - particle.y;
                const angle = Math.atan2(dy, dx) + Math.PI / 2;
                return { x: Math.cos(angle), y: Math.sin(angle) };
            }
            
            case 'turbulent': {
                const time = Date.now() * 0.001;
                return {
                    x: Math.sin(particle.x * 0.01 + time),
                    y: Math.cos(particle.y * 0.01 + time)
                };
            }
            
            default:
                return { x: 0, y: 0 };
        }
    }
    
    private applyEnvironmentalEffects(particle: Particle, dt: number): void {
        // Consume resources
        const fieldX = Math.floor(particle.x / this.fieldResolution);
        const fieldY = Math.floor(particle.y / this.fieldResolution);
        const width = Math.ceil(this.width / this.fieldResolution);
        const height = Math.ceil(this.height / this.fieldResolution);
        
        if (fieldX >= 0 && fieldY >= 0 && fieldX < width && fieldY < height) {
            const index = fieldY * width + fieldX;
            if (index >= 0 && index < this.resourceField.length) {
                const resource = this.resourceField[index];
                
                if (resource > 0) {
                    const consumed = Math.min(resource, 0.1 * dt);
                    this.resourceField[index] -= consumed;
                    particle.energy += consumed * 0.5;
                }
            }
        }
        
        // Emit pheromones
        if (this.chemical.pheromoneStrength[particle.species] > 0) {
            const state = this.stateMachines.get(particle)?.getState();
            let pheromoneType = 0;
            
            // Different states emit different pheromones
            switch (state) {
                case ParticleState.HUNTING:
                    pheromoneType = 0;
                    break;
                case ParticleState.FLEEING:
                    pheromoneType = 1;
                    break;
                case ParticleState.MATING:
                    pheromoneType = 2;
                    break;
            }
            
            if (pheromoneType < this.chemical.pheromoneTypes && 
                fieldX >= 0 && fieldY >= 0 && 
                fieldX < this.pheromoneField[pheromoneType].length &&
                fieldY < this.pheromoneField[pheromoneType][fieldX].length) {
                this.pheromoneField[pheromoneType][fieldX][fieldY] += 
                    this.chemical.pheromoneStrength[particle.species] * dt;
            }
        }
        
        // Radiation effects
        if (this.environment.radiation > 0 && Math.random() < this.environment.radiation * dt) {
            // Mutation
            particle.metabolism *= 0.9 + Math.random() * 0.2;
            particle.size *= 0.9 + Math.random() * 0.2;
        }
    }
    
    private applyBoundaryConditions(particle: Particle): void {
        const margin = 20;
        
        switch (this.physics.boundaryMode) {
            case 'wrap':
                if (particle.x < -margin) particle.x = this.width + margin;
                if (particle.x > this.width + margin) particle.x = -margin;
                if (particle.y < -margin) particle.y = this.height + margin;
                if (particle.y > this.height + margin) particle.y = -margin;
                break;
                
            case 'bounce':
                if (particle.x < margin || particle.x > this.width - margin) {
                    particle.vx *= -this.physics.boundaryDamping;
                    particle.x = Math.max(margin, Math.min(this.width - margin, particle.x));
                }
                if (particle.y < margin || particle.y > this.height - margin) {
                    particle.vy *= -this.physics.boundaryDamping;
                    particle.y = Math.max(margin, Math.min(this.height - margin, particle.y));
                }
                break;
                
            case 'teleport':
                if (particle.x < 0 || particle.x > this.width ||
                    particle.y < 0 || particle.y > this.height) {
                    particle.x = Math.random() * this.width;
                    particle.y = Math.random() * this.height;
                    particle.vx *= 0.5;
                    particle.vy *= 0.5;
                }
                break;
                
            case 'infinite':
                // No boundary constraints
                break;
        }
    }
    
    private handleLifecycle(particle: Particle, dt: number): void {
        // Age particle
        particle.age += dt;
        
        // Check death conditions
        const lifespan = this.species.lifespan[particle.species];
        const shouldDie = particle.energy <= 0.1 || 
                         particle.age > lifespan ||
                         this.stateMachines.get(particle)?.getState() === ParticleState.DYING;
        
        if (shouldDie) {
            // Remove particle
            const index = this.particles.indexOf(particle);
            if (index > -1) {
                this.particles.splice(index, 1);
                this.stateMachines.delete(particle);
                
                // Spawn new particle with chance
                if (Math.random() < 0.8) {
                    this.spawnParticle(particle.species);
                }
            }
        }
        
        // Check reproduction
        const maturityAge = this.species.maturityAge[particle.species];
        const reproductionRate = this.species.reproductionRate[particle.species];
        
        if (particle.age > maturityAge && 
            particle.energy > this.species.energyCapacity[particle.species] * 0.8 &&
            Math.random() < reproductionRate * dt) {
            
            // Create offspring
            const offspring = new Particle(
                particle.x + (Math.random() - 0.5) * 20,
                particle.y + (Math.random() - 0.5) * 20,
                particle.species,
                this.rendering.particleSize[particle.species]
            );
            
            // Inherit some traits with mutation
            offspring.metabolism = particle.metabolism * (0.9 + Math.random() * 0.2);
            offspring.responseDelay = Math.floor(particle.responseDelay * (0.8 + Math.random() * 0.4));
            
            // Split energy
            particle.energy *= 0.6;
            offspring.energy = particle.energy * 0.4;
            
            this.particles.push(offspring);
            this.stateMachines.set(offspring, new ParticleStateMachine());
        }
    }
    
    private processEmergentBehaviors(dt: number): void {
        // Flocking behavior
        for (const particle of this.particles) {
            const nearby = this.getParticlesInRadius(particle, this.emergent.alignmentRadius);
            const sameSpecies = nearby.filter(p => p.species === particle.species);
            
            if (sameSpecies.length > 1) {
                let alignX = 0, alignY = 0;
                let cohesionX = 0, cohesionY = 0;
                let separationX = 0, separationY = 0;
                let count = 0;
                
                for (const other of sameSpecies) {
                    if (other === particle) continue;
                    
                    const distance = particle.distanceTo(other);
                    
                    // Alignment
                    if (distance < this.emergent.alignmentRadius) {
                        alignX += other.vx;
                        alignY += other.vy;
                        count++;
                    }
                    
                    // Cohesion
                    if (distance < this.emergent.cohesionRadius) {
                        cohesionX += other.x;
                        cohesionY += other.y;
                    }
                    
                    // Separation
                    if (distance < this.emergent.separationRadius && distance > 0) {
                        const dx = particle.x - other.x;
                        const dy = particle.y - other.y;
                        separationX += dx / distance;
                        separationY += dy / distance;
                    }
                }
                
                if (count > 0) {
                    // Apply flocking forces
                    alignX /= count;
                    alignY /= count;
                    cohesionX = cohesionX / count - particle.x;
                    cohesionY = cohesionY / count - particle.y;
                    
                    particle.vx += alignX * this.emergent.alignmentStrength * dt;
                    particle.vy += alignY * this.emergent.alignmentStrength * dt;
                    particle.vx += cohesionX * this.emergent.cohesionStrength * 0.01 * dt;
                    particle.vy += cohesionY * this.emergent.cohesionStrength * 0.01 * dt;
                    particle.vx += separationX * this.emergent.separationStrength * dt;
                    particle.vy += separationY * this.emergent.separationStrength * dt;
                }
            }
        }
    }
    
    private processChemicalReactions(dt: number): void {
        // Check for particles close enough to react
        const reactionDistance = 20;
        const processed = new Set<Particle>();
        
        for (const particle1 of this.particles) {
            if (processed.has(particle1)) continue;
            
            const nearby = this.getParticlesInRadius(particle1, reactionDistance);
            
            for (const particle2 of nearby) {
                if (particle2 === particle1 || processed.has(particle2)) continue;
                
                const reactionProb = this.chemical.reactionProbability[particle1.species][particle2.species];
                
                if (Math.random() < reactionProb * dt) {
                    // Reaction occurs!
                    const product = Math.floor(this.chemical.reactionProducts[particle1.species][particle2.species]);
                    
                    // Create product particle
                    const productParticle = new Particle(
                        (particle1.x + particle2.x) / 2,
                        (particle1.y + particle2.y) / 2,
                        product,
                        this.rendering.particleSize[product]
                    );
                    
                    // Conservation of energy and momentum
                    productParticle.vx = (particle1.vx * particle1.mass + particle2.vx * particle2.mass) / 
                                        (particle1.mass + particle2.mass);
                    productParticle.vy = (particle1.vy * particle1.mass + particle2.vy * particle2.mass) / 
                                        (particle1.mass + particle2.mass);
                    productParticle.energy = particle1.energy + particle2.energy;
                    
                    // Mark reactants for removal
                    processed.add(particle1);
                    processed.add(particle2);
                    
                    // Add product
                    this.particles.push(productParticle);
                    this.stateMachines.set(productParticle, new ParticleStateMachine());
                }
            }
        }
        
        // Remove reacted particles
        for (const particle of processed) {
            const index = this.particles.indexOf(particle);
            if (index > -1) {
                this.particles.splice(index, 1);
                this.stateMachines.delete(particle);
            }
        }
    }
    
    private processQuantumEffects(dt: number): void {
        // Quantum tunneling
        if (this.quantum.tunneling) {
            for (const particle of this.particles) {
                if (Math.random() < 0.001 * dt) {
                    // Tunnel to nearby location
                    const tunnelDistance = 50 + Math.random() * 50;
                    const angle = Math.random() * Math.PI * 2;
                    particle.x += Math.cos(angle) * tunnelDistance;
                    particle.y += Math.sin(angle) * tunnelDistance;
                }
            }
        }
        
        // Quantum entanglement
        if (this.quantum.entanglement) {
            // Create entangled pairs
            // This would require tracking entangled particle pairs
            // and synchronizing their states
        }
        
        // Uncertainty principle
        if (this.quantum.uncertaintyPrinciple > 0) {
            for (const particle of this.particles) {
                // Add position uncertainty based on velocity
                const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                const positionUncertainty = this.quantum.uncertaintyPrinciple * speed * 0.1;
                
                particle.x += (Math.random() - 0.5) * positionUncertainty;
                particle.y += (Math.random() - 0.5) * positionUncertainty;
            }
        }
    }
    
    private updatePheromoneField(dt: number): void {
        const decay = this.chemical.pheromoneDecayRate * dt;
        
        for (let type = 0; type < this.chemical.pheromoneTypes; type++) {
            for (let x = 0; x < this.pheromoneField[type].length; x++) {
                for (let y = 0; y < this.pheromoneField[type][x].length; y++) {
                    // Decay
                    this.pheromoneField[type][x][y] *= (1 - decay);
                    
                    // Diffusion (simple averaging with neighbors)
                    let sum = this.pheromoneField[type][x][y] * 4;
                    let count = 4;
                    
                    for (let dx = -1; dx <= 1; dx += 2) {
                        const nx = x + dx;
                        if (nx >= 0 && nx < this.pheromoneField[type].length) {
                            sum += this.pheromoneField[type][nx][y];
                            count++;
                        }
                    }
                    
                    for (let dy = -1; dy <= 1; dy += 2) {
                        const ny = y + dy;
                        if (ny >= 0 && ny < this.pheromoneField[type][x].length) {
                            sum += this.pheromoneField[type][x][ny];
                            count++;
                        }
                    }
                    
                    this.pheromoneField[type][x][y] = sum / count;
                }
            }
        }
    }
    
    private updateResourceField(dt: number): void {
        const regeneration = this.environment.resourceRegenerationRate * dt;
        const width = Math.ceil(this.width / this.fieldResolution);
        
        for (let i = 0; i < this.resourceField.length; i++) {
            // Regenerate resources
            const maxResource = this.environment.resourceDensity;
            if (this.resourceField[i] < maxResource) {
                this.resourceField[i] = Math.min(maxResource, this.resourceField[i] + regeneration);
            }
        }
    }
    
    private getParticlesInRadius(center: Particle, radius: number): Particle[] {
        const result: Particle[] = [];
        const gridRadius = Math.ceil(radius / this.gridCellSize);
        const gridX = Math.floor(center.x / this.gridCellSize);
        const gridY = Math.floor(center.y / this.gridCellSize);
        
        for (let dx = -gridRadius; dx <= gridRadius; dx++) {
            for (let dy = -gridRadius; dy <= gridRadius; dy++) {
                const key = `${gridX + dx},${gridY + dy}`;
                const cellParticles = this.spatialGrid.get(key) || [];
                
                for (const particle of cellParticles) {
                    if (center.distanceTo(particle) <= radius) {
                        result.push(particle);
                    }
                }
            }
        }
        
        return result;
    }
    
    private spawnParticle(species: number): void {
        const particle = new Particle(
            Math.random() * this.width,
            Math.random() * this.height,
            species,
            this.rendering.particleSize[species]
        );
        
        // Apply species-specific properties
        particle.mass = this.species.mass[species];
        particle.metabolism = this.species.metabolism[species];
        particle.energy = this.species.energyCapacity[species] * 0.5;
        
        this.particles.push(particle);
        this.stateMachines.set(particle, new ParticleStateMachine());
    }
    
    // Public methods for UI control
    public setAttractionMatrix(i: number, j: number, value: number): void {
        // Ensure the matrix is properly sized
        if (!this.physics.attractionMatrix[i]) {
            this.physics.attractionMatrix[i] = [];
        }
        this.physics.attractionMatrix[i][j] = value;
    }
    
    public getAttractionMatrix(): number[][] {
        return this.physics.attractionMatrix;
    }
    
    public loadPreset(name: string): void {
        // Load comprehensive presets that set all parameters
        switch (name) {
            case 'biological_ecosystem':
                this.loadBiologicalEcosystemPreset();
                break;
            case 'quantum_foam':
                this.loadQuantumFoamPreset();
                break;
            case 'neural_network':
                this.loadNeuralNetworkPreset();
                break;
            case 'fluid_dynamics':
                this.loadFluidDynamicsPreset();
                break;
            case 'crystalline_growth':
                this.loadCrystallineGrowthPreset();
                break;
            default:
                this.initializeDefaultParams();
        }
    }
    
    private loadBiologicalEcosystemPreset(): void {
        // Predator-prey dynamics with realistic biological behaviors
        this.physics.attractionMatrix = [
            [0.3, -0.8, 0.2, -0.5, 0.1],   // Red: predator
            [0.8, 0.5, -0.3, 0.2, -0.4],   // Blue: prey
            [-0.2, 0.3, 0.6, -0.1, 0.4],   // Green: plant-like
            [0.5, -0.2, 0.1, 0.4, -0.3],   // Yellow: scavenger
            [-0.1, 0.4, -0.4, 0.3, 0.5]    // Purple: decomposer
        ];
        
        this.species.metabolism = [0.5, 0.3, 0.1, 0.4, 0.2];
        this.species.reproductionRate = [0.008, 0.02, 0.03, 0.01, 0.015];
        this.environment.resourceDensity = 0.5;
        this.emergent.alignmentStrength = 0.4;
        this.chemical.pheromoneStrength = [0.7, 0.5, 0.2, 0.6, 0.3];
    }
    
    private loadQuantumFoamPreset(): void {
        // Quantum-inspired behaviors with uncertainty and entanglement
        this.quantum.tunneling = true;
        this.quantum.entanglement = true;
        this.quantum.uncertaintyPrinciple = 0.3;
        this.physics.turbulence = 0.2;
        
        // Symmetric attraction matrix for quantum coherence
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                this.physics.attractionMatrix[i][j] = Math.cos((i + j) * Math.PI / 5);
            }
        }
    }
    
    private loadNeuralNetworkPreset(): void {
        // Neural network-like signal propagation
        this.neural.synapseFormationRate = 0.05;
        this.neural.signalPropagationSpeed = 5.0;
        this.emergent.informationTransferRate = 0.3;
        
        // Asymmetric connections like neural pathways
        this.physics.attractionMatrix = [
            [0.0, 0.8, -0.2, 0.5, -0.3],
            [-0.5, 0.0, 0.9, -0.1, 0.4],
            [0.3, -0.4, 0.0, 0.7, -0.2],
            [-0.2, 0.6, -0.3, 0.0, 0.8],
            [0.7, -0.1, 0.4, -0.6, 0.0]
        ];
    }
    
    private loadFluidDynamicsPreset(): void {
        // Fluid-like behaviors with vortices and flow
        this.physics.viscosity = 0.3;
        this.physics.rotationalForces = true;
        this.environment.fieldType = 'spiral';
        this.environment.fieldStrength = 0.4;
        
        // Uniform weak attractions for fluid cohesion
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                this.physics.attractionMatrix[i][j] = 0.2;
            }
        }
    }
    
    private loadCrystallineGrowthPreset(): void {
        // Crystal formation with rigid structure
        this.emergent.crystallizationTendency = 0.9;
        this.emergent.patternPersistence = 0.8;
        this.emergent.symmetryPreference = 0.9;
        this.physics.friction = 0.2;
        
        // Strong same-species attraction for crystal formation
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                this.physics.attractionMatrix[i][j] = i === j ? 0.9 : -0.3;
            }
        }
    }
    
    public setCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
    }
    
    public getParticles(): Particle[] {
        return this.particles;
    }
    
    public getParticleCount(): number {
        return this.particles.length;
    }
    
    public getPheromoneField(): Float32Array[][] {
        return this.pheromoneField;
    }
    
    public getResourceField(): Float32Array {
        return this.resourceField;
    }
    
    public resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        // Reinitialize fields with new dimensions if needed
        this.initializeFields(width, height);
    }
    
    public resetParticles(): void {
        this.particles = [];
        this.stateMachines.clear();
        
        // Reinitialize particles
        for (let species = 0; species < this.selectedColors; species++) {
            for (let i = 0; i < this.particlesPerSpecies; i++) {
                this.spawnParticle(species);
            }
        }
    }
    
    public setSpeciesCount(count: number): void {
        this.selectedColors = count;
        this.resetParticles();
    }
    
    public setParticlesPerSpecies(count: number): void {
        this.particlesPerSpecies = count;
        this.resetParticles();
    }
    
    public updateVisualParams(): void {
        for (const particle of this.particles) {
            particle.size = this.rendering.particleSize[particle.species];
            particle.setTrailLength(this.rendering.trailLength);
        }
    }
    
}