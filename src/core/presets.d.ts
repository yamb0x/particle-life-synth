export interface Preset {
    name: string;
    description: string;
    attractionMatrix: number[][];
    physics: {
        maxForce: number;
        maxSpeed: number;
        friction: number;
        minDistance: number;
        maxDistance: number;
    };
    particlesPerSpecies: number;
}
export declare const naturePresets: Preset[];
export declare function applyPreset(particleSystem: any, preset: Preset): void;
