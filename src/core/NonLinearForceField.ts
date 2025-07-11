import { ForceFieldParams } from './ForceField.js';

export interface ForceZone {
    startRadius: number;
    endRadius: number;
    forceType: 'exponential' | 'logarithmic' | 'sinusoidal' | 'step' | 'polynomial';
    forceParams: {
        strength: number;
        offset?: number;
        frequency?: number;
        exponent?: number;
        phase?: number;
    };
}

export interface AdvancedForceFieldParams {
    zones: ForceZone[];
    timeModulation?: {
        enabled: boolean;
        frequency: number;
        amplitude: number;
        phase: number;
    };
    densityModulation?: {
        enabled: boolean;
        threshold: number;
        scaleFactor: number;
    };
}

export class NonLinearForceField {
    private advancedFields: AdvancedForceFieldParams[][] = [];
    private time: number = 0;
    
    constructor() {
        this.initializeAdvancedFields();
    }
    
    private initializeAdvancedFields(): void {
        // Initialize 5x5 matrix with Ventrella-inspired complex force fields
        for (let i = 0; i < 5; i++) {
            this.advancedFields[i] = [];
            for (let j = 0; j < 5; j++) {
                this.advancedFields[i][j] = this.createDefaultAdvancedField(i, j);
            }
        }
    }
    
    private createDefaultAdvancedField(species1: number, species2: number): AdvancedForceFieldParams {
        const isSameSpecies = species1 === species2;
        
        return {
            zones: [
                {
                    // Close-range zone: strong repulsion to prevent overlap
                    startRadius: 0,
                    endRadius: 20,
                    forceType: 'exponential',
                    forceParams: {
                        strength: -3.0,
                        exponent: 2.0
                    }
                },
                {
                    // Mid-range zone: species-specific interactions
                    startRadius: 20,
                    endRadius: 80,
                    forceType: 'sinusoidal',
                    forceParams: {
                        strength: isSameSpecies ? 1.0 : -0.5,
                        frequency: 0.05,
                        phase: species1 * 0.5
                    }
                },
                {
                    // Long-range zone: weak attraction or neutral
                    startRadius: 80,
                    endRadius: 200,
                    forceType: 'exponential',
                    forceParams: {
                        strength: 0.3,
                        exponent: -1.5
                    }
                }
            ],
            timeModulation: {
                enabled: true,
                frequency: 0.001 * (species1 + 1),
                amplitude: 0.2,
                phase: species1 * Math.PI / 5
            }
        };
    }
    
    public calculateAdvancedForce(
        distance: number, 
        species1: number, 
        species2: number,
        localDensity: number = 0,
        isRunner: boolean = false
    ): number {
        const params = this.advancedFields[species1][species2];
        let force = 0;
        
        // Find applicable zone
        for (const zone of params.zones) {
            if (distance >= zone.startRadius && distance < zone.endRadius) {
                force = this.calculateZoneForce(distance, zone);
                break;
            }
        }
        
        // Apply time modulation
        if (params.timeModulation?.enabled) {
            const timeMod = 1 + params.timeModulation.amplitude * 
                Math.sin(this.time * params.timeModulation.frequency + params.timeModulation.phase);
            force *= timeMod;
        }
        
        // Apply density modulation
        if (params.densityModulation?.enabled && localDensity > params.densityModulation.threshold) {
            force *= params.densityModulation.scaleFactor;
        }
        
        // Runner particles have reduced force response
        if (isRunner) {
            force *= 0.3;
        }
        
        return force;
    }
    
    private calculateZoneForce(distance: number, zone: ForceZone): number {
        const { forceType, forceParams } = zone;
        const normalizedDist = (distance - zone.startRadius) / (zone.endRadius - zone.startRadius);
        
        switch (forceType) {
            case 'exponential':
                return forceParams.strength * Math.exp(-normalizedDist * (forceParams.exponent || 1));
                
            case 'logarithmic':
                return forceParams.strength * Math.log(1 + normalizedDist * 10) / Math.log(11);
                
            case 'sinusoidal':
                return forceParams.strength * Math.sin(
                    normalizedDist * Math.PI * (forceParams.frequency || 1) + (forceParams.offset || 0)
                );
                
            case 'step':
                return normalizedDist < 0.5 ? forceParams.strength : forceParams.strength * 0.1;
                
            case 'polynomial':
                const exp = forceParams.exponent || 2;
                return forceParams.strength * (1 - Math.pow(normalizedDist, exp));
                
            default:
                return forceParams.strength * (1 - normalizedDist);
        }
    }
    
    public updateTime(dt: number): void {
        this.time += dt;
    }
    
    // Preset configurations for Ventrella-like behaviors
    public loadAdvancedPreset(name: string): void {
        switch (name) {
            case 'biological_hunt':
                this.loadBiologicalHuntPreset();
                break;
            case 'cellular_clusters':
                this.loadCellularClustersPreset();
                break;
            case 'neural_networks':
                this.loadNeuralNetworksPreset();
                break;
            case 'fluid_dynamics':
                this.loadFluidDynamicsPreset();
                break;
            case 'quantum_fields':
                this.loadQuantumFieldsPreset();
                break;
            default:
                this.initializeAdvancedFields();
        }
    }
    
    private loadBiologicalHuntPreset(): void {
        // Predator-prey dynamics with complex chase behaviors
        for (let predator = 0; predator < 5; predator++) {
            for (let prey = 0; prey < 5; prey++) {
                const isPredatorPrey = (predator + 1) % 5 === prey;
                
                this.advancedFields[predator][prey] = {
                    zones: [
                        {
                            startRadius: 0,
                            endRadius: 15,
                            forceType: 'exponential',
                            forceParams: { strength: -5.0, exponent: 3.0 }
                        },
                        {
                            startRadius: 15,
                            endRadius: 100,
                            forceType: 'polynomial',
                            forceParams: { 
                                strength: isPredatorPrey ? 3.5 : -0.5,
                                exponent: isPredatorPrey ? 1.5 : 2.0
                            }
                        },
                        {
                            startRadius: 100,
                            endRadius: 250,
                            forceType: 'sinusoidal',
                            forceParams: {
                                strength: isPredatorPrey ? 2.0 : 0.2,
                                frequency: 0.03,
                                phase: predator * 0.8
                            }
                        }
                    ],
                    timeModulation: {
                        enabled: true,
                        frequency: 0.002,
                        amplitude: isPredatorPrey ? 0.3 : 0.1,
                        phase: 0
                    }
                };
            }
        }
    }
    
    private loadCellularClustersPreset(): void {
        // Cell-like clustering with membrane formation
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const affinity = 1 - Math.abs(i - j) / 4;
                
                this.advancedFields[i][j] = {
                    zones: [
                        {
                            startRadius: 0,
                            endRadius: 25,
                            forceType: 'polynomial',
                            forceParams: { strength: -2.0, exponent: 4.0 }
                        },
                        {
                            startRadius: 25,
                            endRadius: 50,
                            forceType: 'sinusoidal',
                            forceParams: {
                                strength: affinity * 2.0,
                                frequency: 0.1,
                                phase: 0
                            }
                        },
                        {
                            startRadius: 50,
                            endRadius: 80,
                            forceType: 'exponential',
                            forceParams: {
                                strength: -affinity * 0.5,
                                exponent: 1.0
                            }
                        }
                    ],
                    densityModulation: {
                        enabled: true,
                        threshold: 5,
                        scaleFactor: 0.7
                    }
                };
            }
        }
    }
    
    private loadNeuralNetworksPreset(): void {
        // Neural-like signal propagation patterns
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const connection = Math.sin(i * 2 + j * 3) * 0.5 + 0.5;
                
                this.advancedFields[i][j] = {
                    zones: [
                        {
                            startRadius: 0,
                            endRadius: 20,
                            forceType: 'step',
                            forceParams: { strength: -3.0 }
                        },
                        {
                            startRadius: 20,
                            endRadius: 60,
                            forceType: 'sinusoidal',
                            forceParams: {
                                strength: connection * 2.0 - 1.0,
                                frequency: 0.2,
                                phase: i * j * 0.5
                            }
                        },
                        {
                            startRadius: 60,
                            endRadius: 150,
                            forceType: 'logarithmic',
                            forceParams: { strength: connection }
                        }
                    ],
                    timeModulation: {
                        enabled: true,
                        frequency: 0.005 * (1 + connection),
                        amplitude: 0.4,
                        phase: i * Math.PI / 3
                    }
                };
            }
        }
    }
    
    private loadFluidDynamicsPreset(): void {
        // Fluid-like vortex and flow patterns
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const viscosity = 0.2 + (i + j) * 0.1;
                
                this.advancedFields[i][j] = {
                    zones: [
                        {
                            startRadius: 0,
                            endRadius: 30,
                            forceType: 'polynomial',
                            forceParams: { strength: -1.5, exponent: 2.0 }
                        },
                        {
                            startRadius: 30,
                            endRadius: 120,
                            forceType: 'sinusoidal',
                            forceParams: {
                                strength: 0.8,
                                frequency: viscosity * 0.05,
                                phase: (i - j) * Math.PI / 4
                            }
                        },
                        {
                            startRadius: 120,
                            endRadius: 200,
                            forceType: 'exponential',
                            forceParams: {
                                strength: 0.3,
                                exponent: -viscosity
                            }
                        }
                    ],
                    timeModulation: {
                        enabled: true,
                        frequency: 0.001 * viscosity,
                        amplitude: 0.5,
                        phase: 0
                    }
                };
            }
        }
    }
    
    private loadQuantumFieldsPreset(): void {
        // Quantum-inspired probability fields
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const entanglement = Math.cos((i + j) * Math.PI / 5);
                
                this.advancedFields[i][j] = {
                    zones: [
                        {
                            startRadius: 0,
                            endRadius: 10,
                            forceType: 'exponential',
                            forceParams: { strength: -10.0, exponent: 5.0 }
                        },
                        {
                            startRadius: 10,
                            endRadius: 40,
                            forceType: 'sinusoidal',
                            forceParams: {
                                strength: entanglement * 3.0,
                                frequency: 0.3,
                                phase: Math.random() * Math.PI * 2
                            }
                        },
                        {
                            startRadius: 40,
                            endRadius: 100,
                            forceType: 'polynomial',
                            forceParams: {
                                strength: entanglement,
                                exponent: 0.5
                            }
                        },
                        {
                            startRadius: 100,
                            endRadius: 300,
                            forceType: 'logarithmic',
                            forceParams: { strength: Math.abs(entanglement) * 0.5 }
                        }
                    ],
                    timeModulation: {
                        enabled: true,
                        frequency: 0.01 * Math.abs(entanglement),
                        amplitude: 0.8,
                        phase: entanglement * Math.PI
                    },
                    densityModulation: {
                        enabled: true,
                        threshold: 3,
                        scaleFactor: 1.5
                    }
                };
            }
        }
    }
    
    public getAdvancedField(species1: number, species2: number): AdvancedForceFieldParams {
        return this.advancedFields[species1][species2];
    }
    
    public setAdvancedField(species1: number, species2: number, params: AdvancedForceFieldParams): void {
        this.advancedFields[species1][species2] = params;
    }
}