import { ParticleSystem } from '../core/ParticleSystem.js';
export declare class ParameterPanel {
    private panel;
    private particleSystem;
    private isVisible;
    constructor(particleSystem: ParticleSystem);
    private initializeControls;
    private initializeAttractionMatrix;
    private initializeSliders;
    private initializeButtons;
    private initializePresetSelector;
    private updateDisplayValues;
    private savePreset;
    private loadPreset;
    private applyPreset;
    private randomizeParameters;
    toggle(): void;
    updateStats(fps: number, particleCount: number, speciesCount: number): void;
}
