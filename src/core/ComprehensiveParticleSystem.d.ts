import { Particle } from './Particle.js';
export interface ComprehensivePhysicsParams {
    attractionMatrix: number[][];
    minRadius: number[][];
    maxRadius: number[][];
    friction: number;
    forceFactor: number;
    maxVelocity: number;
    timeStep: number;
    boundaryMode: 'wrap' | 'bounce' | 'infinite' | 'teleport';
    boundaryDamping: number;
    viscosity: number;
    turbulence: number;
    gravity: {
        x: number;
        y: number;
    };
    rotationalForces: boolean;
}
export interface SpeciesParams {
    mass: number[];
    charge: number[];
    temperature: number[];
    metabolism: number[];
    aggression: number[];
    sociability: number[];
    curiosity: number[];
    fear: number[];
    reproductionRate: number[];
    lifespan: number[];
    maturityAge: number[];
    energyCapacity: number[];
}
export interface EnvironmentalParams {
    fieldStrength: number;
    fieldType: 'none' | 'radial' | 'linear' | 'spiral' | 'turbulent';
    fieldCenter: {
        x: number;
        y: number;
    };
    resourceDensity: number;
    resourceRegenerationRate: number;
    resourceClustering: number;
    temperature: number;
    pressure: number;
    radiation: number;
}
export interface EmergentBehaviorParams {
    alignmentRadius: number;
    alignmentStrength: number;
    cohesionRadius: number;
    cohesionStrength: number;
    separationRadius: number;
    separationStrength: number;
    informationTransferRate: number;
    memoryDecayRate: number;
    learningRate: number;
    crystallizationTendency: number;
    patternPersistence: number;
    symmetryPreference: number;
}
export interface QuantumParams {
    tunneling: boolean;
    entanglement: boolean;
    superposition: boolean;
    uncertaintyPrinciple: number;
    waveFunction: boolean;
}
export interface ChemicalParams {
    pheromoneTypes: number;
    pheromoneStrength: number[];
    pheromoneDecayRate: number;
    pheromoneResponseMatrix: number[][];
    reactionProbability: number[][];
    reactionProducts: number[][];
    catalystEffect: number[][];
}
export interface NeuralParams {
    synapseFormationRate: number;
    synapseStrength: number;
    synapseDecay: number;
    signalPropagationSpeed: number;
    refractoryPeriod: number;
}
export interface AdvancedRenderingParams {
    particleSize: number[];
    particleShape: ('circle' | 'square' | 'triangle' | 'star')[];
    glowIntensity: number[];
    trailLength: number;
    trailOpacity: number;
    colorBlending: boolean;
    motionBlur: boolean;
}
export declare class ComprehensiveParticleSystem {
    private particles;
    private stateMachines;
    private nonLinearForceField;
    private selectedColors;
    private particlesPerSpecies;
    physics: ComprehensivePhysicsParams;
    species: SpeciesParams;
    environment: EnvironmentalParams;
    emergent: EmergentBehaviorParams;
    quantum: QuantumParams;
    chemical: ChemicalParams;
    neural: NeuralParams;
    rendering: AdvancedRenderingParams;
    private spatialGrid;
    private gridCellSize;
    private pheromoneField;
    private fieldResolution;
    private resourceField;
    private canvas;
    private width;
    private height;
    constructor(width: number, height: number);
    private initializeDefaultParams;
    private createRandomMatrix;
    private createUniformMatrix;
    private initializeFields;
    private generateResourceField;
    private simplexNoise;
    update(dt: number): void;
    private updateSpatialGrid;
    private calculateStateContext;
    private calculateResourceGradient;
    private applyForces;
    private calculateFieldForce;
    private applyEnvironmentalEffects;
    private applyBoundaryConditions;
    private handleLifecycle;
    private processEmergentBehaviors;
    private processChemicalReactions;
    private processQuantumEffects;
    private updatePheromoneField;
    private updateResourceField;
    private getParticlesInRadius;
    private spawnParticle;
    setAttractionMatrix(i: number, j: number, value: number): void;
    getAttractionMatrix(): number[][];
    loadPreset(name: string): void;
    private loadBiologicalEcosystemPreset;
    private loadQuantumFoamPreset;
    private loadNeuralNetworkPreset;
    private loadFluidDynamicsPreset;
    private loadCrystallineGrowthPreset;
    setCanvas(canvas: HTMLCanvasElement): void;
    getParticles(): Particle[];
    getParticleCount(): number;
    getPheromoneField(): Float32Array[][];
    getResourceField(): Float32Array;
    resize(width: number, height: number): void;
    resetParticles(): void;
    setSpeciesCount(count: number): void;
    setParticlesPerSpecies(count: number): void;
    updateVisualParams(): void;
}
