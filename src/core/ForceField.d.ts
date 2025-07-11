export interface ForceFieldParams {
    r1: number;
    r2: number;
    f1: number;
    f2: number;
}
export declare class ForceField {
    private forceFields;
    constructor();
    private initializeDefault;
    calculateForce(distance: number, species1: number, species2: number, isRunner?: boolean): number;
    private interpolateForce;
    setForceField(species1: number, species2: number, params: ForceFieldParams): void;
    getForceField(species1: number, species2: number): ForceFieldParams;
    loadPreset(name: string): void;
    private loadPollackPreset;
    private loadGemsPreset;
    private loadAlliancesPreset;
    private loadRedMenacePreset;
    private loadAcrobatsPreset;
    private loadMitosisPreset;
    private loadPlanetsPreset;
    private loadStigmergyPreset;
    private loadFieldPreset;
    private loadSimplifyPreset;
    private loadDreamtimePreset;
}
