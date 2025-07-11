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
export declare class NonLinearForceField {
    private advancedFields;
    private time;
    constructor();
    private initializeAdvancedFields;
    private createDefaultAdvancedField;
    calculateAdvancedForce(distance: number, species1: number, species2: number, localDensity?: number, isRunner?: boolean): number;
    private calculateZoneForce;
    updateTime(dt: number): void;
    loadAdvancedPreset(name: string): void;
    private loadBiologicalHuntPreset;
    private loadCellularClustersPreset;
    private loadNeuralNetworksPreset;
    private loadFluidDynamicsPreset;
    private loadQuantumFieldsPreset;
    getAdvancedField(species1: number, species2: number): AdvancedForceFieldParams;
    setAdvancedField(species1: number, species2: number, params: AdvancedForceFieldParams): void;
}
