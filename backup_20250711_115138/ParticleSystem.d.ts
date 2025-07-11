import { Particle } from './Particle.js';
import { ForceField } from './ForceField.js';
export interface PhysicsParams {
    maxForce: number;
    maxSpeed: number;
    friction: number;
    minDistance: number;
    maxDistance: number;
}
export interface VisualParams {
    trailLength: number;
    particleSize: number;
    glowIntensity: number;
}
export interface BehaviorMetrics {
    clusterCoherence: number;
    patternStability: number;
    movementComplexity: number;
    interSpeciesMixing: number;
    energyConservation: number;
}
export declare class ParticleSystem {
    private particles;
    private attractionMatrix;
    private forceField;
    private species;
    private canvas;
    private width;
    private height;
    physics: PhysicsParams;
    visual: VisualParams;
    private behaviorHistory;
    private maxHistoryLength;
    constructor(canvas: HTMLCanvasElement);
    private initializeAttractionMatrix;
    private initializeParticles;
    update(dt: number): void;
    private updateForces;
    private handleBoundaries;
    private updateBehaviorMetrics;
    private calculateClusterCoherence;
    private calculatePatternStability;
    private calculateMovementComplexity;
    private calculateInterSpeciesMixing;
    private calculateEnergyConservation;
    private calculateVariance;
    getParticles(): Particle[];
    getAttractionMatrix(): number[][];
    loadEcosystemPreset(name: string): void;
    getForceField(): ForceField;
    setAttractionMatrix(matrix: number[][]): void;
    setAttractionValue(species1: number, species2: number, value: number): void;
    getCurrentBehaviorMetrics(): BehaviorMetrics | null;
    resetParticles(): void;
    resize(width: number, height: number): void;
    setSpeciesCount(count: number): void;
    setParticlesPerSpecies(count: number): void;
    updateVisualParams(): void;
}
