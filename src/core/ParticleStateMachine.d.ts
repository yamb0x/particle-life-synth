import { Particle } from './Particle.js';
export declare enum ParticleState {
    EXPLORING = "exploring",
    HUNTING = "hunting",
    FLEEING = "fleeing",
    CLUSTERING = "clustering",
    MATING = "mating",
    FORAGING = "foraging",
    DORMANT = "dormant",
    DYING = "dying"
}
export interface StateTransitionRule {
    fromState: ParticleState;
    toState: ParticleState;
    condition: (particle: Particle, context: StateContext) => boolean;
    priority: number;
}
export interface StateContext {
    nearbyParticles: Map<number, Particle[]>;
    localDensity: number;
    nearestPredator?: Particle;
    nearestPrey?: Particle;
    nearestMate?: Particle;
    energyGradient: {
        x: number;
        y: number;
    };
    environmentalPressure: number;
}
export interface BehaviorParams {
    exploreSpeed: number;
    huntSpeed: number;
    fleeSpeed: number;
    clusterDistance: number;
    matingEnergyThreshold: number;
    dormantEnergyThreshold: number;
    perceptionRadius: number;
}
export declare class ParticleStateMachine {
    private state;
    private stateTimer;
    private previousState;
    private target?;
    private behaviorMemory;
    private maxMemoryLength;
    private readonly behaviorParams;
    private readonly stateTransitions;
    constructor(initialState?: ParticleState);
    update(particle: Particle, context: StateContext, dt: number): void;
    private transitionTo;
    private executeBehavior;
    private exploreMovement;
    private huntMovement;
    private fleeMovement;
    private clusterMovement;
    private matingMovement;
    private foragingMovement;
    private dormantBehavior;
    private dyingBehavior;
    private updateMemory;
    private levyFlightStep;
    getState(): ParticleState;
    getStateTimer(): number;
    getTarget(): Particle | undefined;
    getBehaviorParams(): BehaviorParams;
    getMemoryTrail(): {
        x: number;
        y: number;
    }[];
}
